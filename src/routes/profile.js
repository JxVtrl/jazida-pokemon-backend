const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getProfile, updateProfile, uploadAvatar } = require('../controllers/ProfileController');

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Busca o perfil do treinador autenticado
 *     description: Retorna informações completas do perfil incluindo estatísticas
 *     tags: [Perfil]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: ID do treinador
 *                 nome:
 *                   type: string
 *                   description: Nome do treinador
 *                 avatar_url:
 *                   type: string
 *                   description: URL do avatar
 *                 status_message:
 *                   type: string
 *                   description: Mensagem de status
 *                 total_battles:
 *                   type: integer
 *                   description: Total de batalhas
 *                 wins:
 *                   type: integer
 *                   description: Vitórias
 *                 losses:
 *                   type: integer
 *                   description: Derrotas
 *                 level:
 *                   type: integer
 *                   description: Nível atual
 *                 experience:
 *                   type: integer
 *                   description: Experiência atual
 *                 winRate:
 *                   type: integer
 *                   description: Taxa de vitória em porcentagem
 *                 nextLevelExp:
 *                   type: integer
 *                   description: Experiência necessária para próximo nível
 *                 expProgress:
 *                   type: integer
 *                   description: Progresso da experiência atual
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Treinador não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', requireAuth, getProfile);

/**
 * @swagger
 * /profile:
 *   put:
 *     summary: Atualiza o perfil do treinador
 *     description: Permite atualizar nome e mensagem de status
 *     tags: [Perfil]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Novo nome do treinador (mínimo 3 caracteres)
 *               status_message:
 *                 type: string
 *                 description: Nova mensagem de status (máximo 200 caracteres)
 *     responses:
 *       200:
 *         description: Perfil atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Perfil atualizado com sucesso!"
 *                 trainer:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nome:
 *                       type: string
 *                     avatar_url:
 *                       type: string
 *                     status_message:
 *                       type: string
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       409:
 *         description: Nome já está em uso
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/', requireAuth, updateProfile);

/**
 * @swagger
 * /profile/avatar:
 *   post:
 *     summary: Faz upload de um novo avatar
 *     description: Permite enviar uma nova imagem de avatar
 *     tags: [Perfil]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Arquivo de imagem (máximo 5MB)
 *     responses:
 *       200:
 *         description: Avatar atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Avatar atualizado com sucesso!"
 *                 trainer:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nome:
 *                       type: string
 *                     avatar_url:
 *                       type: string
 *                     status_message:
 *                       type: string
 *       400:
 *         description: Arquivo inválido ou não enviado
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/avatar', requireAuth, uploadAvatar);

module.exports = router; 