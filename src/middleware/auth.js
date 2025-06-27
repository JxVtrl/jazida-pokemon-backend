const jwt = require('jsonwebtoken');
const knex = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'jazida-pokemon-secret-key';

/**
 * Middleware para verificar autenticação
 * Decodifica o token JWT e define req.treinadorId
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
async function requireAuth(req, res, next) {
    try {
        // Extrair token do header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Token de autenticação não fornecido.'
            });
        }

        const token = authHeader.replace('Bearer ', '');

        // Verificar e decodificar token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Verificar se o treinador ainda existe no banco
        const treinador = await knex('trainers')
            .where({ id: decoded.treinadorId })
            .select(['id', 'nome'])
            .first();

        if (!treinador) {
            return res.status(401).json({
                error: 'Token inválido - treinador não encontrado.'
            });
        }

        // Adicionar informações do treinador ao request
        req.treinadorId = treinador.id;
        req.treinadorNome = treinador.nome;
        req.treinador = treinador;
        req.user = treinador;

        console.log(`🔐 Autenticação válida para treinador: ${treinador.nome} (ID: ${treinador.id})`);

        next();

    } catch (err) {
        console.error('❌ Erro na autenticação:', err.message);

        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Token inválido.'
            });
        }

        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expirado.'
            });
        }

        return res.status(500).json({
            error: 'Erro interno do servidor na autenticação.'
        });
    }
}

/**
 * Middleware opcional para autenticação
 * Não falha se não houver token, apenas adiciona informações se existir
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET);

        const treinador = await knex('trainers')
            .where({ id: decoded.treinadorId })
            .select(['id', 'nome'])
            .first();

        if (treinador) {
            req.treinadorId = treinador.id;
            req.treinadorNome = treinador.nome;
            req.treinador = treinador;
        }

        next();

    } catch (err) {
        // Em caso de erro, apenas continua sem autenticação
        next();
    }
}

module.exports = {
    requireAuth,
    optionalAuth
}; 