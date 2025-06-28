const knex = require('../database/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Configuração do multer para upload de imagens (em memória)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB para upload original
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas!'), false);
        }
    }
});

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
 * Upload de avatar
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function uploadAvatar(req, res) {
    const treinadorId = req.treinadorId || req.user?.id || req.userId;

    if (!treinadorId) {
        return res.status(401).json({ error: 'Não autenticado.' });
    }

    // Usar multer para processar o upload (em memória)
    upload.single('avatar')(req, res, async function (err) {
        if (err) {
            console.error('❌ Erro no upload:', err);
            return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Nenhuma imagem foi enviada.' });
        }

        try {
            // Converter e comprimir para WebP
            const maxSize = 200 * 1024; // 200KB
            const minQuality = 30;
            let quality = 80;
            const uploadsDir = path.join(__dirname, '../../uploads/avatars');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 15);
            const filename = `${timestamp}_${randomString}.webp`;
            const filepath = path.join(uploadsDir, filename);

            let webpBuffer;
            // Tenta reduzir a qualidade progressivamente
            while (quality >= minQuality) {
                webpBuffer = await sharp(req.file.buffer)
                    .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
                    .webp({ quality, effort: 6 })
                    .toBuffer();
                if (webpBuffer.length <= maxSize) break;
                quality -= 10;
            }

            // Se ainda ficou grande, rejeita
            if (webpBuffer.length > maxSize) {
                return res.status(400).json({ error: 'Imagem muito grande mesmo após compressão progressiva. Tamanho máximo: 200KB.' });
            }

            // Salvar arquivo
            fs.writeFileSync(filepath, webpBuffer);

            // Gerar URL do avatar
            const avatarUrl = `/uploads/avatars/${filename}`;

            // Atualizar treinador com nova URL do avatar
            const [updatedTrainer] = await knex('trainers')
                .where({ id: treinadorId })
                .update({ avatar_url: avatarUrl })
                .returning(['id', 'nome', 'avatar_url', 'status_message']);

            console.log(`✅ Avatar atualizado:`, updatedTrainer);

            return res.status(200).json({
                message: 'Avatar atualizado com sucesso!',
                trainer: updatedTrainer
            });
        } catch (error) {
            console.error('❌ Erro ao processar/comprimir avatar:', error);
            return res.status(500).json({ error: 'Erro ao processar/comprimir avatar.' });
        }
    });
}

module.exports = {
    getProfile,
    updateProfile,
    uploadAvatar
}; 