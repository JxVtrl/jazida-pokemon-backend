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

        const treinador = await knex('trainers')
            .where({ id: treinadorId })
            .select([
                'id', 'nome', 'avatar_url', 'status_message',
                'total_battles', 'wins', 'losses', 'level', 'experience'
            ])
            .first();

        if (!treinador) {
            return res.status(404).json({ error: 'Treinador não encontrado.' });
        }

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