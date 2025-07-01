const knex = require('../database/db');

/**
 * Salva uma nova entrada no histórico de batalhas
 * @param {Object} battleData - Dados da batalha
 * @returns {Object} - Entrada salva no histórico
 */
async function saveBattleHistory(battleData) {
    try {
        console.log('📝 Salvando histórico de batalha:', battleData);

        // Proteção contra duplicidade de battle_id
        const exists = await knex('battle_history').where({ battle_id: battleData.battle_id }).first();
        if (exists) {
            console.warn('⚠️ Histórico já existe para battle_id:', battleData.battle_id);
            return exists;
        }

        const [savedBattle] = await knex('battle_history')
            .insert(battleData)
            .returning('*');

        console.log('✅ Histórico salvo com sucesso:', savedBattle.id);

        // Atualizar estatísticas dos treinadores
        await updateTrainerStats(battleData);

        return savedBattle;
    } catch (error) {
        console.error('❌ Erro ao salvar histórico:', error);
        throw error;
    }
}

/**
 * Atualiza as estatísticas dos treinadores após uma batalha
 * @param {Object} battleData - Dados da batalha
 */
async function updateTrainerStats(battleData) {
    try {
        console.log('📊 Atualizando estatísticas dos treinadores...');

        // Atualizar estatísticas do vencedor
        await knex('trainers')
            .where({ id: battleData.winner_trainer_id })
            .increment({
                total_battles: 1,
                wins: 1,
                experience: 50 // Experiência por vitória
            });

        // Atualizar estatísticas do perdedor
        await knex('trainers')
            .where({ id: battleData.loser_trainer_id })
            .increment({
                total_battles: 1,
                losses: 1,
                experience: 10 // Experiência por participação
            });

        // Verificar e atualizar níveis baseado na experiência
        await checkAndUpdateLevels(battleData.winner_trainer_id);
        await checkAndUpdateLevels(battleData.loser_trainer_id);

        console.log('✅ Estatísticas atualizadas com sucesso');
    } catch (error) {
        console.error('❌ Erro ao atualizar estatísticas:', error);
    }
}

/**
 * Verifica e atualiza o nível do treinador baseado na experiência
 * @param {number} trainerId - ID do treinador
 */
async function checkAndUpdateLevels(trainerId) {
    try {
        const trainer = await knex('trainers')
            .where({ id: trainerId })
            .select(['id', 'experience', 'level'])
            .first();

        if (!trainer) return;

        const newLevel = Math.floor(trainer.experience / 100) + 1;
        
        if (newLevel > trainer.level) {
            await knex('trainers')
                .where({ id: trainerId })
                .update({ level: newLevel });

            console.log(`⬆️ Treinador ${trainerId} subiu para nível ${newLevel}`);
        }
    } catch (error) {
        console.error('❌ Erro ao verificar nível:', error);
    }
}

/**
 * Busca o histórico de batalhas de um treinador
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function getBattleHistory(req, res) {
    const treinadorId = req.treinadorId || req.user?.id || req.userId;

    if (!treinadorId) {
        return res.status(401).json({ error: 'Não autenticado.' });
    }

    try {
        console.log(`🔍 Buscando histórico de batalhas do treinador ID: ${treinadorId}`);

        // Buscar batalhas onde o treinador participou
        const battles = await knex('battle_history')
            .where(function() {
                this.where('trainer_a_id', treinadorId)
                    .orWhere('trainer_b_id', treinadorId);
            })
            .orderBy('created_at', 'desc')
            .limit(50); // Limitar a 50 batalhas mais recentes

        console.log(`📊 Encontradas ${battles.length} batalhas no banco`);

        // Formatar dados para o frontend
        const formattedBattles = battles.map(battle => {
            const isTrainerA = battle.trainer_a_id === treinadorId;
            const isWinner = battle.winner_trainer_id === treinadorId;
            
            return {
                id: battle.battle_id,
                data: battle.created_at,
                rounds: battle.rounds_played || 1,
                euSouA: isTrainerA,
                meuPokemon: isTrainerA ? battle.pokemon_a_type : battle.pokemon_b_type,
                meuNivelAntes: isTrainerA ? battle.pokemon_a_level_before : battle.pokemon_b_level_before,
                meuNivelDepois: isTrainerA ? battle.pokemon_a_level_after : battle.pokemon_b_level_after,
                adversario: isTrainerA ? battle.trainer_b_name : battle.trainer_a_name,
                pokemonAdversario: isTrainerA ? battle.pokemon_b_type : battle.pokemon_a_type,
                vencedor: isWinner ? 'eu' : 'adversario',
                resultado: isWinner ? 'victory' : 'defeat'
            };
        });

        console.log(`✅ Formatadas ${formattedBattles.length} batalhas para o frontend`);

        return res.status(200).json(formattedBattles);

    } catch (error) {
        console.error('❌ Erro ao buscar histórico:', error);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}

/**
 * Busca estatísticas detalhadas de um treinador
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function getTrainerStats(req, res) {
    const treinadorId = req.treinadorId || req.user?.id || req.userId;

    if (!treinadorId) {
        return res.status(401).json({ error: 'Não autenticado.' });
    }

    try {
        console.log(`📊 Buscando estatísticas do treinador ID: ${treinadorId}`);

        const trainer = await knex('trainers')
            .where({ id: treinadorId })
            .select([
                'id', 'nome', 'total_battles', 'wins', 'losses', 
                'level', 'experience'
            ])
            .first();

        if (!trainer) {
            return res.status(404).json({ error: 'Treinador não encontrado.' });
        }

        // Calcular estatísticas adicionais
        const winRate = trainer.total_battles > 0 
            ? Math.round((trainer.wins / trainer.total_battles) * 100) 
            : 0;

        const expForNextLevel = trainer.level * 100;
        const expProgress = trainer.experience % 100;

        const stats = {
            ...trainer,
            winRate,
            nextLevelExp: expForNextLevel,
            expProgress
        };

        console.log(`✅ Estatísticas encontradas:`, stats);

        return res.status(200).json(stats);

    } catch (error) {
        console.error('❌ Erro ao buscar estatísticas:', error);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}

module.exports = {
    saveBattleHistory,
    getBattleHistory,
    getTrainerStats,
    updateTrainerStats
}; 