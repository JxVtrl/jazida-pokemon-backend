const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Simulação de armazenamento de batalhas em memória
const battles = new Map();

/**
 * @swagger
 * /desafiar/{trainerBId}:
 *   post:
 *     summary: Desafiar outro treinador para uma batalha
 *     parameters:
 *       - in: path
 *         name: trainerBId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do treinador desafiado
 *     responses:
 *       200:
 *         description: Desafio enviado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 battleId:
 *                   type: string
 *                 trainerAId:
 *                   type: integer
 *                 trainerBId:
 *                   type: integer
 *       400:
 *         description: Erro no desafio
 *       404:
 *         description: Treinador não encontrado
 */
router.post('/:trainerBId', requireAuth, async (req, res) => {
    try {
        const trainerAId = req.user.id;
        const trainerBId = parseInt(req.params.trainerBId);

        // Validação: trainerBId precisa ser um número válido
        if (isNaN(trainerBId)) {
            return res.status(400).json({ error: 'ID do treinador desafiado inválido.' });
        }

        if (trainerAId === trainerBId) {
            return res.status(400).json({ error: 'Não é possível desafiar a si mesmo' });
        }

        // Verificar se o treinador desafiado existe
        const knex = require('../database/db');
        const treinadorB = await knex('trainers').where({ id: trainerBId }).first();
        if (!treinadorB) {
            return res.status(404).json({ error: 'Treinador desafiado não encontrado.' });
        }

        // Gerar ID único para a batalha
        const battleId = uuidv4();

        // Criar batalha em memória
        const battle = {
            id: battleId,
            trainerAId,
            trainerBId,
            status: 'waiting',
            createdAt: new Date(),
            pokemonA: null,
            pokemonB: null
        };

        battles.set(battleId, battle);

        // Obter instâncias do Socket.IO
        const io = req.app.get('io');
        const trainerSockets = req.app.get('trainerSockets');

        // Notificar ambos os treinadores
        const trainerASocketId = trainerSockets.get(trainerAId);
        const trainerBSocketId = trainerSockets.get(trainerBId);

        if (trainerASocketId) {
            io.to(trainerASocketId).emit('battle-invite', {
                battleId,
                trainerAId,
                trainerBId,
                type: 'challenger'
            });
        }

        if (trainerBSocketId) {
            io.to(trainerBSocketId).emit('battle-invite', {
                battleId,
                trainerAId,
                trainerBId,
                type: 'challenged'
            });
        }

        console.log(`⚔️ Desafio criado: ${trainerAId} vs ${trainerBId} (batalha ${battleId})`);

        res.json({
            message: 'Desafio enviado com sucesso!',
            battleId,
            trainerAId,
            trainerBId
        });

    } catch (error) {
        console.error('❌ Erro ao criar desafio:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * @swagger
 * /desafiar/batalha/{battleId}/iniciar:
 *   post:
 *     summary: Iniciar uma batalha com pokémons específicos
 *     parameters:
 *       - in: path
 *         name: battleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da batalha
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pokemonAId:
 *                 type: integer
 *                 description: ID do pokémon do treinador A
 *               pokemonBId:
 *                 type: integer
 *                 description: ID do pokémon do treinador B
 *     responses:
 *       200:
 *         description: Batalha iniciada com sucesso
 *       404:
 *         description: Batalha não encontrada
 */
router.post('/batalha/:battleId/iniciar', requireAuth, async (req, res) => {
    try {
        const { battleId } = req.params;
        const { pokemonAId, pokemonBId } = req.body;

        const battle = battles.get(battleId);
        if (!battle) {
            return res.status(404).json({ error: 'Batalha não encontrada' });
        }

        // Buscar pokémons no banco de dados
        const db = req.app.get('db');

        const [pokemonA] = await db('pokemons').where('id', pokemonAId).first();
        const [pokemonB] = await db('pokemons').where('id', pokemonBId).first();

        if (!pokemonA || !pokemonB) {
            return res.status(404).json({ error: 'Pokémon não encontrado' });
        }

        // Preparar pokémons para batalha
        const battlePokemonA = {
            ...pokemonA,
            vida: 100,
            vidaMaxima: 100,
            status: 'ready'
        };

        const battlePokemonB = {
            ...pokemonB,
            vida: 100,
            vidaMaxima: 100,
            status: 'ready'
        };

        // Atualizar batalha
        battle.status = 'starting';
        battle.pokemonA = battlePokemonA;
        battle.pokemonB = battlePokemonB;

        // Obter instâncias do Socket.IO
        const io = req.app.get('io');
        const roomName = `batalha-${battleId}`;

        // Emitir evento de início da batalha
        io.to(roomName).emit('battle:start', {
            battleId,
            pokemonA: battlePokemonA,
            pokemonB: battlePokemonB
        });

        console.log(`⚔️ Batalha iniciada: ${battleId}`);

        // Simular batalha em tempo real
        simulateBattle(battleId, battlePokemonA, battlePokemonB, io);

        res.json({
            message: 'Batalha iniciada com sucesso!',
            battleId,
            pokemonA: battlePokemonA,
            pokemonB: battlePokemonB
        });

    } catch (error) {
        console.error('❌ Erro ao iniciar batalha:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Função para simular batalha em tempo real
async function simulateBattle(battleId, pokemonA, pokemonB, io) {
    const roomName = `batalha-${battleId}`;
    let round = 1;
    const maxRounds = 10;

    const battleInterval = setInterval(async () => {
        if (round > maxRounds || pokemonA.vida <= 0 || pokemonB.vida <= 0) {
            // Finalizar batalha
            const winner = pokemonA.vida > pokemonB.vida ? pokemonA : pokemonB;
            const loser = pokemonA.vida > pokemonB.vida ? pokemonB : pokemonA;

            io.to(roomName).emit('battle:end', {
                winner,
                loser,
                round
            });

            console.log(`🏆 Batalha finalizada: ${winner.tipo} venceu!`);
            clearInterval(battleInterval);
            return;
        }

        // Simular ataque
        const attacker = round % 2 === 1 ? pokemonA : pokemonB;
        const defender = round % 2 === 1 ? pokemonB : pokemonA;

        // Calcular dano baseado no nível
        const damage = Math.floor(Math.random() * 20) + 10 + (attacker.nivel * 2);
        defender.vida = Math.max(0, defender.vida - damage);

        // Atualizar status
        attacker.status = 'attacking';
        defender.status = 'defending';

        // Emitir atualização
        io.to(roomName).emit('battle:update', {
            pokemonA,
            pokemonB,
            round,
            lastAction: {
                attacker: attacker.tipo,
                defender: defender.tipo,
                damage
            }
        });

        // Resetar status após um delay
        setTimeout(() => {
            attacker.status = 'ready';
            defender.status = 'ready';
        }, 1000);

        round++;
    }, 2000); // Atualizar a cada 2 segundos
}

module.exports = router; 