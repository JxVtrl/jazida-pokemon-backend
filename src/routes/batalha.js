const express = require('express');
const { batalhar } = require('../controllers/BatalhaController');

const router = express.Router();

/**
 * @swagger
 * /batalhar/{pokemonAId}/{pokemonBId}:
 *   post:
 *     summary: Realiza uma batalha entre dois pokémons
 *     description: |
 *       Simula uma batalha entre dois pokémons baseada na proporção dos níveis.
 *       - O vencedor é determinado probabilisticamente baseado nos níveis
 *       - O vencedor ganha +1 nível
 *       - O perdedor perde -1 nível
 *       - Se o perdedor chegar ao nível 0, é deletado do sistema
 *     tags: [Batalhas]
 *     parameters:
 *       - in: path
 *         name: pokemonAId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do primeiro pokémon (Pokémon A)
 *       - in: path
 *         name: pokemonBId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do segundo pokémon (Pokémon B)
 *     responses:
 *       200:
 *         description: Batalha realizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vencedor:
 *                   type: object
 *                   description: Dados do pokémon vencedor após a batalha
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID único do pokémon
 *                     tipo:
 *                       type: string
 *                       description: Tipo do pokémon
 *                     treinador:
 *                       type: string
 *                       description: Nome do treinador
 *                     nivel:
 *                       type: integer
 *                       description: Nível atual do pokémon (aumentou +1)
 *                 perdedor:
 *                   type: object
 *                   description: Dados do pokémon perdedor após a batalha
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID único do pokémon
 *                     tipo:
 *                       type: string
 *                       description: Tipo do pokémon
 *                     treinador:
 *                       type: string
 *                       description: Nome do treinador
 *                     nivel:
 *                       type: integer
 *                       description: Nível atual do pokémon (diminuiu -1, pode ser 0)
 *       404:
 *         description: Um ou ambos os pokémons não foram encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Um ou ambos os pokémons não foram encontrados."
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Erro ao processar a batalha."
 */
router.post('/batalhar/:pokemonAId/:pokemonBId', batalhar);

// --- LÓGICA EM MEMÓRIA PARA ESCOLHA DE POKÉMONS ---
const battleSelections = new Map(); // battleId -> { treinadorA: { id, pokemonId }, treinadorB: { id, pokemonId } }

// POST /batalha/:battleId/iniciar
router.post('/batalha/:battleId/iniciar', async (req, res) => {
    const { battleId } = req.params;
    const { pokemonAId } = req.body;
    const treinadorId = req.treinadorId || req.user?.id || req.userId; // ajuste conforme seu middleware
    const treinadorNome = req.treinadorNome || req.user?.nome || req.userName;
    if (!treinadorId || !treinadorNome) {
        console.log(`[BATALHA][${battleId}] ❌ Requisição sem autenticação`);
        return res.status(401).json({ error: 'Não autenticado.' });
    }
    if (!pokemonAId) {
        console.log(`[BATALHA][${battleId}] ❌ pokemonAId não enviado`);
        return res.status(400).json({ error: 'pokemonAId é obrigatório.' });
    }

    // Armazena a escolha
    if (!battleSelections.has(battleId)) {
        battleSelections.set(battleId, {});
    }
    const sel = battleSelections.get(battleId);
    sel[treinadorId] = { treinadorId, treinadorNome, pokemonId: pokemonAId };
    console.log(`[BATALHA][${battleId}] Treinador ${treinadorNome} (${treinadorId}) selecionou pokémon ${pokemonAId}`);
    console.log(`[BATALHA][${battleId}] Estado atual das escolhas:`, sel);

    // Verifica se já temos dois treinadores
    if (Object.keys(sel).length < 2) {
        console.log(`[BATALHA][${battleId}] Aguardando o outro treinador escolher...`);
        return res.json({ aguardando: true, message: 'Aguardando o outro treinador escolher.' });
    }

    // Ambos escolheram: buscar pokémons e iniciar batalha
    console.log(`[BATALHA][${battleId}] Ambos os treinadores escolheram! Iniciando batalha...`);
    const db = req.app.get('db') || require('../database/db');
    const ids = Object.values(sel).map(s => s.pokemonId);
    const pokemons = await db('pokemons').whereIn('id', ids);
    if (pokemons.length < 2) {
        console.log(`[BATALHA][${battleId}] ❌ Pokémons não encontrados para os IDs:`, ids);
        return res.status(404).json({ error: 'Pokémons não encontrados.' });
    }
    
    // CORREÇÃO: Posicionar pokémons corretamente baseado nos treinadores
    const treinadores = Object.values(sel);
    const treinadorA = treinadores[0];
    const treinadorB = treinadores[1];
    
    // Encontrar qual pokémon pertence a qual treinador
    const pokemonA = pokemons.find(p => p.id === treinadorA.pokemonId);
    const pokemonB = pokemons.find(p => p.id === treinadorB.pokemonId);
    
    if (!pokemonA || !pokemonB) {
        console.log(`[BATALHA][${battleId}] ❌ Erro ao mapear pokémons aos treinadores`);
        return res.status(404).json({ error: 'Erro ao mapear pokémons aos treinadores.' });
    }
    
    // CORREÇÃO: Garantir que pokemonA sempre seja do primeiro treinador e pokemonB do segundo
    // E que o campo treinador contenha o ID do treinador, não o nome
    const battlePokemonA = { 
        ...pokemonA, 
        treinador: treinadorA.treinadorId, // Usar ID do treinador
        vida: 100, 
        vidaMaxima: 100, 
        status: 'ready' 
    };
    const battlePokemonB = { 
        ...pokemonB, 
        treinador: treinadorB.treinadorId, // Usar ID do treinador
        vida: 100, 
        vidaMaxima: 100, 
        status: 'ready' 
    };

    // Atualiza status da batalha (em memória, pode ser expandido)
    const battleState = {
        status: 'starting',
        round: 1,
        pokemonA: battlePokemonA, // Sempre será o pokémon do primeiro treinador
        pokemonB: battlePokemonB, // Sempre será o pokémon do segundo treinador
        winner: null,
        loser: null
    };

    // Envia evento via socket para a sala
    const io = req.app.get('io');
    const roomName = `batalha-${battleId}`;
    console.log(`[BATALHA][${battleId}] Emitindo evento 'battle:start' para sala ${roomName}`);
    console.log(`[BATALHA][${battleId}] Treinador A (${treinadorA.treinadorNome}): ${battlePokemonA.tipo} (ID: ${battlePokemonA.id})`);
    console.log(`[BATALHA][${battleId}] Treinador B (${treinadorB.treinadorNome}): ${battlePokemonB.tipo} (ID: ${battlePokemonB.id})`);
    io.to(roomName).emit('battle:start', {
        battleId,
        ...battleState
    });

    // Simular batalha após breve delay
    setTimeout(async () => {
        try {
            // Lógica de rounds animados
            const [pokeA, pokeB] = [battlePokemonA, battlePokemonB];
            let vidaA = 100;
            let vidaB = 100;
            const rounds = [];
            let roundAtual = 1;
            const maxRounds = 5;

            // Função para calcular dano baseado no nível
            const calcularDano = (nivel) => Math.floor(Math.random() * 20) + (nivel * 2);

            // Simular rounds
            while (vidaA > 0 && vidaB > 0 && roundAtual <= maxRounds) {
                try {
                    console.log(`[BATALHA][${battleId}] Iniciando round ${roundAtual} - Vida A: ${vidaA}, Vida B: ${vidaB}`);
                    
                    // Determinar quem ataca primeiro (baseado em velocidade/aleatório)
                    const atacantePrimeiro = Math.random() > 0.5 ? 'A' : 'B';
                    let danoA = 0;
                    let danoB = 0;
                    
                    if (atacantePrimeiro === 'A') {
                        // A ataca B
                        danoA = calcularDano(pokeA.nivel);
                        vidaB = Math.max(0, vidaB - danoA);
                        console.log(`[BATALHA][${battleId}] Round ${roundAtual}: A atacou B causando ${danoA} de dano. Vida B: ${vidaB}`);
                        
                        // B ataca A (se ainda vivo)
                        if (vidaB > 0) {
                            danoB = calcularDano(pokeB.nivel);
                            vidaA = Math.max(0, vidaA - danoB);
                            console.log(`[BATALHA][${battleId}] Round ${roundAtual}: B atacou A causando ${danoB} de dano. Vida A: ${vidaA}`);
                        }
                    } else {
                        // B ataca A
                        danoB = calcularDano(pokeB.nivel);
                        vidaA = Math.max(0, vidaA - danoB);
                        console.log(`[BATALHA][${battleId}] Round ${roundAtual}: B atacou A causando ${danoB} de dano. Vida A: ${vidaA}`);
                        
                        // A ataca B (se ainda vivo)
                        if (vidaA > 0) {
                            danoA = calcularDano(pokeA.nivel);
                            vidaB = Math.max(0, vidaB - danoA);
                            console.log(`[BATALHA][${battleId}] Round ${roundAtual}: A atacou B causando ${danoA} de dano. Vida B: ${vidaB}`);
                        }
                    }

                    // Emitir evento do round
                    io.to(roomName).emit('battle:round', {
                        round: roundAtual,
                        pokemonA: { ...pokeA, vida: vidaA },
                        pokemonB: { ...pokeB, vida: vidaB },
                        atacantePrimeiro,
                        danoA,
                        danoB
                    });
                    console.log(`[BATALHA][${battleId}] Round ${roundAtual} emitido com sucesso`);

                    // Verificar se alguém foi derrotado
                    if (vidaA <= 0 || vidaB <= 0) {
                        console.log(`[BATALHA][${battleId}] Batalha terminou no round ${roundAtual}!`);
                        break;
                    }

                    roundAtual++;
                    
                    // Aguardar 1 segundo antes do próximo round
                    if (vidaA > 0 && vidaB > 0 && roundAtual <= maxRounds) {
                        console.log(`[BATALHA][${battleId}] Aguardando 1 segundo antes do próximo round...`);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                } catch (roundError) {
                    console.error(`[BATALHA][${battleId}] Erro no round ${roundAtual}:`, roundError);
                    break;
                }
            }

            // Determinar vencedor (quem ainda tem vida > 0)
            const vencedor = vidaA > 0 ? pokeA : pokeB;
            const perdedor = vencedor.id === pokeA.id ? pokeB : pokeA;
            const treinadorVencedor = sel[vencedor.treinador]?.treinadorNome || vencedor.treinador;
            const treinadorPerdedor = sel[perdedor.treinador]?.treinadorNome || perdedor.treinador;

            console.log(`[BATALHA][${battleId}] Vencedor: ${treinadorVencedor} (${vencedor.tipo})`);
            console.log(`[BATALHA][${battleId}] Perdedor: ${treinadorPerdedor} (${perdedor.tipo})`);

            // Salvar histórico da batalha
            try {
                console.log(`[BATALHA][${battleId}] Iniciando salvamento do histórico...`);
                
                // Usar a mesma instância do banco
                const db = require('../database/db');
                
                const battleHistory = {
                    battle_id: battleId,
                    trainer_a_id: Object.values(sel)[0]?.treinadorId,
                    trainer_b_id: Object.values(sel)[1]?.treinadorId,
                    trainer_a_name: Object.values(sel)[0]?.treinadorNome,
                    trainer_b_name: Object.values(sel)[1]?.treinadorNome,
                    pokemon_a_id: pokeA.id,
                    pokemon_b_id: pokeB.id,
                    pokemon_a_type: pokeA.tipo,
                    pokemon_b_type: pokeB.tipo,
                    pokemon_a_level_before: pokeA.nivel, // Nível original antes da batalha
                    pokemon_b_level_before: pokeB.nivel, // Nível original antes da batalha
                    pokemon_a_level_after: pokeA.id === vencedor.id ? vencedor.nivel + 1 : perdedor.nivel - 1,
                    pokemon_b_level_after: pokeB.id === vencedor.id ? vencedor.nivel + 1 : perdedor.nivel - 1,
                    winner_trainer_id: vencedor.treinador,
                    loser_trainer_id: perdedor.treinador,
                    winner_pokemon_type: vencedor.tipo,
                    loser_pokemon_type: perdedor.tipo,
                    rounds_played: roundAtual - 1,
                    finished_at: new Date()
                };

                console.log(`[BATALHA][${battleId}] Salvando histórico no banco:`, JSON.stringify(battleHistory, null, 2));
                
                // Verificar se a tabela existe
                const tableExists = await db.schema.hasTable('battles');
                console.log(`[BATALHA][${battleId}] Tabela 'battles' existe:`, tableExists);
                
                if (!tableExists) {
                    console.error(`[BATALHA][${battleId}] ❌ Tabela 'battles' não existe!`);
                    return;
                }
                
                // Inserir com transação explícita
                await db.transaction(async (trx) => {
                    const result = await trx('battles').insert(battleHistory);
                    console.log(`[BATALHA][${battleId}] Resultado do insert:`, result);
                });
                
                console.log(`[BATALHA][${battleId}] Histórico salvo no banco de dados`);
                
                // Verificar se foi realmente salvo
                const savedBattle = await db('battles').where('battle_id', battleId).first();
                console.log(`[BATALHA][${battleId}] Batalha salva verificada:`, savedBattle);
                
                // VERIFICAÇÃO EXTRA: Contar total de batalhas após salvar
                const totalAfterSave = await db('battles').count('* as total');
                console.log(`[BATALHA][${battleId}] Total de batalhas após salvar:`, totalAfterSave[0].total);
                
            } catch (historyError) {
                console.error(`[BATALHA][${battleId}] Erro ao salvar histórico:`, historyError);
                console.error(`[BATALHA][${battleId}] Stack trace:`, historyError.stack);
            }

            // Atualizar níveis no banco
            await db('pokemons').where({ id: vencedor.id }).update({ nivel: vencedor.nivel + 1 });
            let perdedorFinal = { ...perdedor, nivel: perdedor.nivel - 1 };
            if (perdedorFinal.nivel <= 0) {
                await db('pokemons').where({ id: perdedor.id }).del();
            } else {
                await db('pokemons').where({ id: perdedor.id }).update({ nivel: perdedorFinal.nivel });
            }

            // Emitir evento de fim de batalha
            io.to(roomName).emit('battle:end', {
                winner: { 
                    ...vencedor, 
                    nivel: vencedor.nivel + 1, 
                    treinador: vencedor.treinador // Manter o ID do treinador
                },
                loser: { 
                    ...perdedorFinal, 
                    treinador: perdedor.treinador // Manter o ID do treinador
                },
                rounds: roundAtual - 1
            });
            console.log(`[BATALHA][${battleId}] Evento 'battle:end' emitido para sala ${roomName}`);
            console.log(`[BATALHA][${battleId}] Winner treinador ID: ${vencedor.treinador}, Loser treinador ID: ${perdedor.treinador}`);
        } catch (err) {
            console.error(`[BATALHA][${battleId}] Erro ao simular batalha:`, err);
        }
    }, 2000); // 2 segundos de delay para efeito visual

    // Limpa seleção em memória
    battleSelections.delete(battleId);

    return res.json({ ok: true, battle: battleState });
});

// GET /batalhas/historico - Histórico de batalhas do treinador
router.get('/batalhas/historico', async (req, res) => {
    const treinadorId = req.treinadorId || req.user?.id || req.userId;
    
    console.log(`[HISTÓRICO] Requisição recebida. Treinador ID: ${treinadorId}`);
    console.log(`[HISTÓRICO] req.treinadorId: ${req.treinadorId}`);
    console.log(`[HISTÓRICO] req.user?.id: ${req.user?.id}`);
    console.log(`[HISTÓRICO] req.userId: ${req.userId}`);
    
    if (!treinadorId) {
        console.log(`[HISTÓRICO] ❌ Treinador não autenticado`);
        return res.status(401).json({ error: 'Não autenticado.' });
    }

    try {
        // Usar a mesma instância do banco que é usada no salvamento
        const db = require('../database/db');
        
        console.log(`[HISTÓRICO] Buscando batalhas para treinador ${treinadorId}...`);
        console.log(`[HISTÓRICO] Instância do banco:`, db.client.config);
        
        // Primeiro, vamos verificar se há batalhas na tabela
        const totalBattles = await db('battles').count('* as total');
        console.log(`[HISTÓRICO] Total de batalhas na tabela:`, totalBattles[0].total);
        
        // Verificar todas as batalhas para debug
        const allBattles = await db('battles').select('*');
        console.log(`[HISTÓRICO] Todas as batalhas na tabela:`, allBattles);
        
        // Buscar batalhas onde o treinador participou (como A ou B)
        const historico = await db('battles')
            .where(function() {
                this.where('trainer_a_id', treinadorId)
                    .orWhere('trainer_b_id', treinadorId);
            })
            .orderBy('finished_at', 'desc')
            .limit(10);

        console.log(`[HISTÓRICO] Encontradas ${historico.length} batalhas para treinador ${treinadorId}:`, historico);

        // Formatar dados para o frontend
        const historicoFormatado = historico.map(battle => ({
            id: battle.battle_id,
            data: battle.finished_at,
            rounds: battle.rounds_played,
            euSouA: battle.trainer_a_id === treinadorId,
            meuPokemon: battle.trainer_a_id === treinadorId ? battle.pokemon_a_type : battle.pokemon_b_type,
            meuNivelAntes: battle.trainer_a_id === treinadorId ? battle.pokemon_a_level_before : battle.pokemon_b_level_before,
            meuNivelDepois: battle.trainer_a_id === treinadorId ? battle.pokemon_a_level_after : battle.pokemon_b_level_after,
            adversario: battle.trainer_a_id === treinadorId ? battle.trainer_b_name : battle.trainer_a_name,
            pokemonAdversario: battle.trainer_a_id === treinadorId ? battle.pokemon_b_type : battle.pokemon_a_type,
            vencedor: battle.winner_trainer_id === treinadorId ? 'eu' : 'adversario',
            resultado: battle.winner_trainer_id === treinadorId ? 'victory' : 'defeat'
        }));

        console.log(`[HISTÓRICO] Retornando ${historicoFormatado.length} batalhas formatadas:`, historicoFormatado);

        res.json(historicoFormatado);
    } catch (error) {
        console.error('[HISTÓRICO] Erro ao buscar histórico de batalhas:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// GET /batalha/:battleId - Buscar batalha por ID
router.get('/batalha/:battleId', async (req, res) => {
    const { battleId } = req.params;
    const treinadorId = req.treinadorId || req.user?.id || req.userId;
    
    if (!treinadorId) {
        return res.status(401).json({ error: 'Não autenticado.' });
    }

    try {
        // Verificar se a batalha existe nas seleções
        const battleSelection = battleSelections.get(battleId);
        if (!battleSelection) {
            return res.status(404).json({ error: 'Batalha não encontrada.' });
        }

        // Verificar se o treinador participa desta batalha
        if (!battleSelection[treinadorId]) {
            return res.status(403).json({ error: 'Você não participa desta batalha.' });
        }

        // Se a batalha ainda não foi iniciada (menos de 2 treinadores)
        if (Object.keys(battleSelection).length < 2) {
            return res.status(200).json({ 
                status: 'waiting',
                message: 'Aguardando outro treinador escolher pokémon.'
            });
        }

        // Se a batalha foi iniciada mas não temos estado completo
        return res.status(200).json({ 
            status: 'active',
            message: 'Batalha em andamento.'
        });

    } catch (error) {
        console.error('Erro ao buscar batalha:', error);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;