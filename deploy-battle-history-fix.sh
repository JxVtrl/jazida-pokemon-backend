#!/bin/bash

echo "🔧 Aplicando correções do histórico de batalhas na VPS..."

# 1. Fazer backup do código atual
echo "📦 Fazendo backup do código atual..."
cp -r src src.backup.$(date +%Y%m%d_%H%M%S)

# 2. Aplicar correções no BattleHistoryController
echo "🔧 Aplicando correções no BattleHistoryController..."
cat > src/controllers/BattleHistoryController.js << 'EOF'
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

        // Debug: verificar se há dados na tabela
        const totalBattles = await knex('battle_history').count('* as total');
        console.log(`📊 Total de batalhas na tabela: ${totalBattles[0].total}`);

        // Buscar batalhas onde o treinador participou
        const battles = await knex('battle_history')
            .where(function() {
                this.where('trainer_a_id', treinadorId)
                    .orWhere('trainer_b_id', treinadorId);
            })
            .orderBy('finished_at', 'desc')
            .limit(50); // Limitar a 50 batalhas mais recentes

        console.log(`📊 Encontradas ${battles.length} batalhas para o treinador ${treinadorId}`);
        if (battles.length > 0) {
            console.log(`📊 Primeira batalha encontrada:`, {
                battle_id: battles[0].battle_id,
                trainer_a_id: battles[0].trainer_a_id,
                trainer_b_id: battles[0].trainer_b_id,
                finished_at: battles[0].finished_at
            });
        }

        // Formatar dados para o frontend
        const formattedBattles = battles.map(battle => {
            const isTrainerA = battle.trainer_a_id === treinadorId;
            const isWinner = battle.winner_trainer_id === treinadorId;
            
            return {
                id: battle.battle_id,
                data: battle.finished_at,
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
EOF

# 3. Aplicar correções no ProfileController
echo "🔧 Aplicando correções no ProfileController..."
cat > src/controllers/ProfileController.js << 'EOF'
const knex = require('../database/db');
const { upload, processImage, deleteImage } = require('../middleware/upload');
const path = require('path');
const fs = require('fs-extra');

/**
 * Busca o perfil do treinador autenticado
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function getProfile(req, res) {
    const treinadorId = req.treinadorId || req.user?.id || req.userId;

    if (!treinadorId) {
        return res.status(401).json({ error: 'Não autenticado.' });
    }

    try {
        console.log(`🔍 Buscando perfil do treinador ID: ${treinadorId}`);

        // Debug: verificar se o treinador existe
        const treinador = await knex('trainers')
            .where({ id: treinadorId })
            .select([
                'id', 'nome', 'avatar_url', 'status_message',
                'total_battles', 'wins', 'losses', 'level', 'experience'
            ])
            .first();

        if (!treinador) {
            console.log(`❌ Treinador ID ${treinadorId} não encontrado`);
            return res.status(404).json({ error: 'Treinador não encontrado.' });
        }

        console.log(`📊 Dados brutos do treinador:`, treinador);

        // Calcular estatísticas
        const winRate = treinador.total_battles > 0 
            ? Math.round((treinador.wins / treinador.total_battles) * 100) 
            : 0;

        // Calcular experiência para próximo nível
        const expForNextLevel = treinador.level * 100;
        const expProgress = treinador.experience % 100;

        const profile = {
            ...treinador,
            winRate,
            nextLevelExp: expForNextLevel,
            expProgress
        };

        console.log(`✅ Perfil encontrado:`, profile);

        return res.status(200).json(profile);

    } catch (error) {
        console.error('❌ Erro ao buscar perfil:', error);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}

/**
 * Atualiza o perfil do treinador
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function updateProfile(req, res) {
    const treinadorId = req.treinadorId || req.user?.id || req.userId;
    const { nome, status_message } = req.body;

    if (!treinadorId) {
        return res.status(401).json({ error: 'Não autenticado.' });
    }

    try {
        console.log(`📝 Atualizando perfil do treinador ID: ${treinadorId}`);

        // Validações
        if (nome && nome.length < 3) {
            return res.status(400).json({ error: 'Nome deve ter pelo menos 3 caracteres.' });
        }

        if (status_message && status_message.length > 200) {
            return res.status(400).json({ error: 'Mensagem de status deve ter no máximo 200 caracteres.' });
        }

        // Verificar se o nome já existe (se estiver sendo alterado)
        if (nome) {
            const existingTrainer = await knex('trainers')
                .where({ nome })
                .whereNot({ id: treinadorId })
                .first();

            if (existingTrainer) {
                return res.status(409).json({ error: 'Nome já está em uso por outro treinador.' });
            }
        }

        // Atualizar perfil
        const updateData = {};
        if (nome) updateData.nome = nome;
        if (status_message !== undefined) updateData.status_message = status_message;

        const [updatedTrainer] = await knex('trainers')
            .where({ id: treinadorId })
            .update(updateData)
            .returning(['id', 'nome', 'avatar_url', 'status_message']);

        console.log(`✅ Perfil atualizado:`, updatedTrainer);

        return res.status(200).json({
            message: 'Perfil atualizado com sucesso!',
            trainer: updatedTrainer
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar perfil:', error);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}

/**
 * Upload de avatar usando middleware robusto
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function uploadAvatar(req, res) {
    const treinadorId = req.treinadorId || req.user?.id || req.userId;

    if (!treinadorId) {
        return res.status(401).json({ error: 'Não autenticado.' });
    }

    console.log(`🖼️ [AVATAR] Iniciando upload para treinador ID: ${treinadorId}`);

    // Usar multer para processar o upload
    upload.single('avatar')(req, res, async function (err) {
        if (err) {
            console.error('❌ [AVATAR] Erro no upload:', err);
            return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
            console.error('❌ [AVATAR] Nenhum arquivo enviado');
            return res.status(400).json({ error: 'Nenhuma imagem foi enviada.' });
        }

        console.log(`🖼️ [AVATAR] Arquivo recebido: ${req.file.originalname} (${req.file.size} bytes)`);

        try {
            // Usar o middleware de processamento de imagem
            const processImageMiddleware = processImage('avatar', 'avatars', 200 * 1024, 80, 512, 512);
            
            // Simular o processamento
            await new Promise((resolve, reject) => {
                processImageMiddleware(req, res, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            if (!req.processedImage) {
                throw new Error('Falha no processamento da imagem');
            }

            console.log(`✅ [AVATAR] Imagem processada: ${req.processedImage.url}`);

            // Deletar avatar antigo se existir
            const treinadorAtual = await knex('trainers')
                .where({ id: treinadorId })
                .select(['avatar_url'])
                .first();

            if (treinadorAtual && treinadorAtual.avatar_url) {
                await deleteImage(treinadorAtual.avatar_url);
            }

            // Atualizar treinador com nova URL do avatar
            const [updatedTrainer] = await knex('trainers')
                .where({ id: treinadorId })
                .update({ avatar_url: req.processedImage.url })
                .returning(['id', 'nome', 'avatar_url', 'status_message']);

            console.log(`✅ [AVATAR] Avatar atualizado no banco:`, updatedTrainer);

            return res.status(200).json({
                message: 'Avatar atualizado com sucesso!',
                trainer: updatedTrainer
            });

        } catch (error) {
            console.error('❌ [AVATAR] Erro ao processar avatar:', error);
            return res.status(500).json({ error: 'Erro ao processar avatar.' });
        }
    });
}

module.exports = {
    getProfile,
    updateProfile,
    uploadAvatar
};
EOF

echo "✅ Correções aplicadas com sucesso!"
echo "🔄 Reiniciando o container..."
docker-compose restart backend

echo "📊 Aguarde alguns segundos e teste novamente o histórico de batalhas!" 