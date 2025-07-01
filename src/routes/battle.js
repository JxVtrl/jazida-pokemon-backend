const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { battleController } = require('../controllers/BattleController');

// INSTÂNCIA ÚNICA DO BANCO - Garantir que salvamento e consulta usem a mesma conexão
const db = require('../database/db');
const { saveBattleHistory } = require('../controllers/BattleHistoryController');

// --- LÓGICA EM MEMÓRIA PARA ESCOLHA DE POKÉMONS ---
const battleSelections = new Map(); // battleId -> { treinadorA: { id, pokemonId }, treinadorB: { id, pokemonId } }

// --- LÓGICA EM MEMÓRIA PARA DESAFIOS ---
const pendingChallenges = new Map(); // challengeId -> { challengerId, challengerName, challengedId, challengedName, createdAt }

// ROTAS MAIS ESPECÍFICAS DEVEM VIR PRIMEIRO

// ROTA DE INICIAR BATALHA (DEVE VIR ANTES DA ROTA DE BATALHA DIRETA)
router.post('/:battleId/iniciar', requireAuth, async (req, res) => {
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
    // Usar a instância única do banco definida no topo do arquivo
    const ids = Object.values(sel).map(s => s.pokemonId);
    const pokemons = await db('pokemons').whereIn('id', ids);
    if (pokemons.length < 2) {
        console.log(`[BATALHA][${battleId}] ❌ Pokémons não encontrados para os IDs:`, ids);
        return res.status(404).json({ error: 'Pokémons não encontrados.' });
    }
    
    // CORREÇÃO: Buscar nomes reais dos treinadores
    const treinadorAId = Object.values(sel)[0]?.treinadorId;
    const treinadorBId = Object.values(sel)[1]?.treinadorId;
    const treinadorAData = await db('trainers').where({ id: treinadorAId }).first();
    const treinadorBData = await db('trainers').where({ id: treinadorBId }).first();
    const treinadorANome = treinadorAData?.nome || 'Treinador A';
    const treinadorBNome = treinadorBData?.nome || 'Treinador B';
    
    // Encontrar qual pokémon pertence a qual treinador
    const pokemonA = pokemons.find(p => p.treinador_id === treinadorAId) || pokemons[0];
    const pokemonB = pokemons.find(p => p.treinador_id === treinadorBId) || pokemons[1];
    
    if (!pokemonA || !pokemonB) {
        console.log(`[BATALHA][${battleId}] ❌ Erro ao mapear pokémons aos treinadores`);
        return res.status(404).json({ error: 'Erro ao mapear pokémons aos treinadores.' });
    }
    
    // CORREÇÃO: Garantir que pokemonA sempre seja do primeiro treinador e pokemonB do segundo
    // E que o campo treinador_id contenha o ID do treinador
    const battlePokemonA = { 
        ...pokemonA, 
        treinador_id: treinadorAId, // Usar ID do treinador
        vida: 100, 
        vidaMaxima: 100, 
        status: 'ready' 
    };
    const battlePokemonB = { 
        ...pokemonB, 
        treinador_id: treinadorBId, // Usar ID do treinador
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
    console.log(`[BATALHA][${battleId}] Treinador A (${treinadorANome}): ${battlePokemonA.tipo} (ID: ${battlePokemonA.id})`);
    console.log(`[BATALHA][${battleId}] Treinador B (${treinadorBNome}): ${battlePokemonB.tipo} (ID: ${battlePokemonB.id})`);
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
                        danoA = calcularDano(pokeA.nivel);
                        vidaB = Math.max(0, vidaB - danoA);
                        if (vidaB > 0) {
                            danoB = calcularDano(pokeB.nivel);
                            vidaA = Math.max(0, vidaA - danoB);
                        }
                    } else {
                        danoB = calcularDano(pokeB.nivel);
                        vidaA = Math.max(0, vidaA - danoB);
                        if (vidaA > 0) {
                            danoA = calcularDano(pokeA.nivel);
                            vidaB = Math.max(0, vidaB - danoA);
                        }
                    }
                    io.to(roomName).emit('battle:round', {
                        round: roundAtual,
                        pokemonA: { ...pokeA, vida: vidaA },
                        pokemonB: { ...pokeB, vida: vidaB },
                        atacantePrimeiro,
                        danoA,
                        danoB
                    });
                    if (vidaA <= 0 || vidaB <= 0) break;
                    roundAtual++;
                    if (vidaA > 0 && vidaB > 0 && roundAtual <= maxRounds) {
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
            const treinadorVencedor = sel[vencedor.treinador_id]?.treinadorNome || vencedor.treinador_id;
            const treinadorPerdedor = sel[perdedor.treinador_id]?.treinadorNome || perdedor.treinador_id;
            console.log(`[BATALHA][${battleId}] Vencedor: ${treinadorVencedor} (${vencedor.tipo})`);
            console.log(`[BATALHA][${battleId}] Perdedor: ${treinadorPerdedor} (${perdedor.tipo})`);
            
            // Atualizar níveis no banco PRIMEIRO
            await db('pokemons').where({ id: vencedor.id }).update({ nivel: vencedor.nivel + 1 });
            let perdedorFinal = { ...perdedor, nivel: perdedor.nivel - 1 };
            
            // Salvar histórico da batalha DEPOIS de atualizar níveis
            const battleHistory = {
                battle_id: battleId,
                trainer_a_id: treinadorAId,
                trainer_b_id: treinadorBId,
                trainer_a_name: treinadorANome,
                trainer_b_name: treinadorBNome,
                pokemon_a_id: battlePokemonA.id,
                pokemon_b_id: battlePokemonB.id,
                pokemon_a_type: battlePokemonA.tipo,
                pokemon_b_type: battlePokemonB.tipo,
                pokemon_a_level_before: battlePokemonA.nivel, // Nível original antes da batalha
                pokemon_b_level_before: battlePokemonB.nivel, // Nível original antes da batalha
                pokemon_a_level_after: battlePokemonA.id === vencedor.id ? battlePokemonA.nivel + 1 : Math.max(0, battlePokemonA.nivel - 1),
                pokemon_b_level_after: battlePokemonB.id === vencedor.id ? battlePokemonB.nivel + 1 : Math.max(0, battlePokemonB.nivel - 1),
                winner_trainer_id: vencedor.treinador_id,
                loser_trainer_id: perdedor.treinador_id,
                winner_pokemon_type: vencedor.tipo,
                loser_pokemon_type: perdedor.tipo,
                rounds_played: roundAtual - 1,
                finished_at: new Date()
            };
            console.log(`[BATALHA][${battleId}] Dados do histórico:`, JSON.stringify(battleHistory, null, 2));
            const savedBattle = await saveBattleHistory(battleHistory);
            console.log(`[BATALHA][${battleId}] ✅ Histórico salvo com sucesso:`, savedBattle.id);
            
            // Remover pokémon perdedor POR ÚLTIMO (se nível 0)
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
                    treinador_id: vencedor.treinador_id // Manter o ID do treinador
                },
                loser: { 
                    ...perdedorFinal, 
                    treinador_id: perdedor.treinador_id // Manter o ID do treinador
                },
                rounds: roundAtual - 1
            });
            console.log(`[BATALHA][${battleId}] Evento 'battle:end' emitido para sala ${roomName}`);
            console.log(`[BATALHA][${battleId}] Winner treinador ID: ${vencedor.treinador_id}, Loser treinador ID: ${perdedor.treinador_id}`);
        } catch (err) {
            console.error(`[BATALHA][${battleId}] Erro ao simular batalha:`, err);
        }
    }, 2000); // 2 segundos de delay para efeito visual

    // Limpa seleção em memória
    battleSelections.delete(battleId);

    return res.json({ ok: true, battle: battleState });
});

// GET /:battleId - Buscar batalha por ID
router.get('/:battleId', requireAuth, async (req, res) => {
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

// ROTAS DE DESAFIO
router.post('/desafiar/:trainerId', requireAuth, async (req, res) => {
    const challengerId = req.treinadorId || req.user?.id || req.userId;
    const challengerName = req.treinadorNome || req.user?.nome || req.userName;
    const challengedId = parseInt(req.params.trainerId);

    if (!challengerId || !challengerName) {
        return res.status(401).json({ error: 'Não autenticado.' });
    }

    if (challengerId === challengedId) {
        return res.status(400).json({ error: 'Não é possível desafiar a si mesmo.' });
    }

    try {
        // Verificar se o treinador desafiado existe
        const challengedTrainer = await db('trainers')
            .where({ id: challengedId })
            .select(['id', 'nome'])
            .first();

        if (!challengedTrainer) {
            return res.status(404).json({ error: 'Treinador não encontrado.' });
        }

        // Gerar ID único para o desafio
        const challengeId = `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Armazenar desafio pendente
        pendingChallenges.set(challengeId, {
            challengerId,
            challengerName,
            challengedId,
            challengedName: challengedTrainer.nome,
            createdAt: new Date()
        });

        // Enviar notificação via socket para o treinador desafiado
        const io = req.app.get('io');
        if (io) {
            io.to(`trainer_${challengedId}`).emit('battle-invite', {
                type: 'challenged',
                challengeId,
                challengerId,
                challengerName,
                challengedId,
                challengedName: challengedTrainer.nome,
                createdAt: new Date()
            });
        }

        console.log(`⚔️ Desafio enviado: ${challengerName} (${challengerId}) -> ${challengedTrainer.nome} (${challengedId})`);

        return res.status(200).json({
            message: 'Desafio enviado com sucesso!',
            challengeId
        });

    } catch (error) {
        console.error('❌ Erro ao enviar desafio:', error);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

router.post('/aceitar/:battleId', requireAuth, async (req, res) => {
    const challengedId = req.treinadorId || req.user?.id || req.userId;
    const challengedName = req.treinadorNome || req.user?.nome || req.userName;
    const challengeId = req.params.battleId;

    if (!challengedId || !challengedName) {
        return res.status(401).json({ error: 'Não autenticado.' });
    }

    try {
        // Buscar o desafio pendente
        const challenge = pendingChallenges.get(challengeId);
        if (!challenge) {
            return res.status(404).json({ error: 'Desafio não encontrado ou expirado.' });
        }

        // Verificar se o treinador autenticado é realmente o desafiado
        if (challenge.challengedId !== challengedId) {
            return res.status(403).json({ error: 'Você não pode aceitar este desafio.' });
        }

        // Remover desafio da lista pendente
        pendingChallenges.delete(challengeId);

        // Gerar ID único para a batalha
        const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Notificar ambos os treinadores via socket
        const io = req.app.get('io');
        if (io) {
            // Notificar o desafiante
            io.to(`trainer_${challenge.challengerId}`).emit('battle-accepted', {
                battleId,
                challengerId: challenge.challengerId,
                challengerName: challenge.challengerName,
                challengedId: challenge.challengedId,
                challengedName: challenge.challengedName
            });

            // Notificar o desafiado
            io.to(`trainer_${challenge.challengedId}`).emit('battle-accepted', {
                battleId,
                challengerId: challenge.challengerId,
                challengerName: challenge.challengerName,
                challengedId: challenge.challengedId,
                challengedName: challenge.challengedName
            });
        }

        console.log(`✅ Desafio aceito: ${challenge.challengerName} vs ${challenge.challengedName} -> Batalha ${battleId}`);

        return res.status(200).json({
            message: 'Desafio aceito! Redirecionando para batalha...',
            battleId
        });

    } catch (error) {
        console.error('❌ Erro ao aceitar desafio:', error);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// ROTA DE BATALHA DIRETA (DEVE VIR POR ÚLTIMO)
router.post('/:pokemonAId/:pokemonBId', requireAuth, battleController);

module.exports = router;