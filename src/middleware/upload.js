const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');
const express = require('express');

// Configurar armazenamento temporário
const storage = multer.memoryStorage();

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
    // Verificar se é uma imagem
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
    }
};

// Configurar multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo para upload original
        files: 1 // Apenas 1 arquivo por vez
    }
});

/**
 * Middleware para processar e salvar imagem como WebP
 * @param {string} fieldName - Nome do campo do formulário
 * @param {string} folder - Pasta onde salvar a imagem
 * @param {number} maxSize - Tamanho máximo em bytes (padrão: 1MB)
 * @param {number} quality - Qualidade da compressão (0-100, padrão: 80)
 * @param {number} width - Largura máxima (opcional)
 * @param {number} height - Altura máxima (opcional)
 */
function processImage(fieldName, folder, maxSize = 1024 * 1024, quality = 80, width = null, height = null) {
    return async (req, res, next) => {
        try {
            // Verificar se há arquivo
            if (!req.file) {
                return res.status(400).json({ error: 'Nenhuma imagem foi enviada.' });
            }

            console.log(`🖼️ [UPLOAD] Processando imagem: ${req.file.originalname}`);
            console.log(`🖼️ [UPLOAD] Tamanho original: ${req.file.size} bytes`);
            console.log(`🖼️ [UPLOAD] Tipo: ${req.file.mimetype}`);

            // Criar pasta de uploads se não existir
            const uploadsDir = path.join(__dirname, '../../uploads', folder);
            await fs.ensureDir(uploadsDir);

            // Gerar nome único para o arquivo
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 15);
            const filename = `${timestamp}_${randomString}.webp`;
            const filepath = path.join(uploadsDir, filename);

            // Processar imagem com Sharp
            let imageProcessor = sharp(req.file.buffer);

            // Redimensionar se especificado
            if (width || height) {
                imageProcessor = imageProcessor.resize(width, height, {
                    fit: 'inside',
                    withoutEnlargement: true
                });
            }

            // Converter para WebP com compressão
            const webpBuffer = await imageProcessor
                .webp({ 
                    quality: quality,
                    effort: 6 // Máximo esforço de compressão
                })
                .toBuffer();

            console.log(`🖼️ [UPLOAD] Tamanho após compressão: ${webpBuffer.length} bytes`);
            console.log(`🖼️ [UPLOAD] Redução: ${((1 - webpBuffer.length / req.file.size) * 100).toFixed(1)}%`);

            // Verificar se o tamanho final está dentro do limite
            if (webpBuffer.length > maxSize) {
                console.log(`⚠️ [UPLOAD] Imagem ainda muito grande (${webpBuffer.length} bytes), comprimindo mais...`);
                
                // Tentar com qualidade menor
                const compressedBuffer = await sharp(req.file.buffer)
                    .resize(width, height, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .webp({ 
                        quality: Math.max(quality - 20, 30), // Reduzir qualidade
                        effort: 6
                    })
                    .toBuffer();

                if (compressedBuffer.length > maxSize) {
                    return res.status(400).json({ 
                        error: `Imagem muito grande mesmo após compressão. Tamanho máximo: ${(maxSize / 1024 / 1024).toFixed(1)}MB` 
                    });
                }

                // Salvar versão mais comprimida
                await fs.writeFile(filepath, compressedBuffer);
                console.log(`✅ [UPLOAD] Imagem salva com compressão adicional: ${compressedBuffer.length} bytes`);
            } else {
                // Salvar versão normal
                await fs.writeFile(filepath, webpBuffer);
                console.log(`✅ [UPLOAD] Imagem salva com sucesso: ${webpBuffer.length} bytes`);
            }

            // Salvar informações do arquivo no request
            req.processedImage = {
                filename: filename,
                originalName: req.file.originalname,
                path: filepath,
                url: `/uploads/${folder}/${filename}`,
                size: (await fs.stat(filepath)).size,
                mimetype: 'image/webp'
            };

            console.log(`✅ [UPLOAD] Imagem processada: ${req.processedImage.url}`);
            next();

        } catch (error) {
            console.error('❌ [UPLOAD] Erro ao processar imagem:', error);
            return res.status(500).json({ error: 'Erro ao processar imagem.' });
        }
    };
}

/**
 * Middleware para deletar imagem antiga
 * @param {string} imageUrl - URL da imagem a ser deletada
 */
async function deleteImage(imageUrl) {
    try {
        if (!imageUrl || imageUrl.includes('dicebear.com')) {
            return; // Não deletar avatares padrão
        }

        const filename = imageUrl.split('/').pop();
        const filepath = path.join(__dirname, '../../uploads/avatars', filename);
        
        if (await fs.pathExists(filepath)) {
            await fs.remove(filepath);
            console.log(`🗑️ [UPLOAD] Imagem deletada: ${filename}`);
        }
    } catch (error) {
        console.error('❌ [UPLOAD] Erro ao deletar imagem:', error);
    }
}

/**
 * Middleware para servir arquivos estáticos
 */
function serveStaticFiles(app) {
    app.use('/uploads', (req, res, next) => {
        // Adicionar headers de cache para imagens
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 ano
        res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
        next();
    }, express.static(path.join(__dirname, '../../uploads')));
}

module.exports = {
    upload,
    processImage,
    deleteImage,
    serveStaticFiles
}; 