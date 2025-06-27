const express = require('express');
const router = express.Router();

const {
    register,
    login,
    verifyToken
} = require('../controllers/AuthController');

const { requireAuth } = require('../middleware/auth');

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Registra um novo treinador
 *     description: Cria uma nova conta de treinador com nome e senha
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - senha
 *             properties:
 *               nome:
 *                 type: string
 *                 minLength: 3
 *                 description: Nome do treinador (mínimo 3 caracteres)
 *               senha:
 *                 type: string
 *                 minLength: 6
 *                 description: Senha do treinador (mínimo 6 caracteres)
 *     responses:
 *       201:
 *         description: Treinador registrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Treinador registrado com sucesso!"
 *                 treinador:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID único do treinador
 *                     nome:
 *                       type: string
 *                       description: Nome do treinador
 *                 token:
 *                   type: string
 *                   description: Token JWT para autenticação
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Nome e senha são obrigatórios."
 *       409:
 *         description: Treinador já existe
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Treinador com este nome já existe."
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Erro interno do servidor ao registrar treinador."
 */
router.post('/register', register);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Faz login do treinador
 *     description: Autentica um treinador com nome e senha, retornando um token JWT
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - senha
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome do treinador
 *               senha:
 *                 type: string
 *                 description: Senha do treinador
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login realizado com sucesso!"
 *                 treinador:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID único do treinador
 *                     nome:
 *                       type: string
 *                       description: Nome do treinador
 *                 token:
 *                   type: string
 *                   description: Token JWT para autenticação
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Nome e senha são obrigatórios."
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Nome ou senha inválidos."
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Erro interno do servidor ao fazer login."
 */
router.post('/login', login);

/**
 * @swagger
 * /verify:
 *   post:
 *     summary: Verifica se o token é válido
 *     description: Valida um token JWT e retorna informações do treinador
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 treinador:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID único do treinador
 *                     nome:
 *                       type: string
 *                       description: Nome do treinador
 *       401:
 *         description: Token inválido ou não fornecido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Token inválido."
 */
router.post('/verify', requireAuth, verifyToken);

module.exports = router; 