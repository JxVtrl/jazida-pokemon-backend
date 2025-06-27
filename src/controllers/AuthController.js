const knex = require('../database/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'jazida-pokemon-secret-key';

/**
 * Registra um novo treinador
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function register(req, res) {
    const { nome, senha } = req.body;

    try {
        console.log('🔐 Tentando registrar treinador:', { nome });

        // Validações
        if (!nome || !senha) {
            return res.status(400).json({
                error: 'Nome e senha são obrigatórios.'
            });
        }

        if (nome.length < 3) {
            return res.status(400).json({
                error: 'Nome deve ter pelo menos 3 caracteres.'
            });
        }

        if (senha.length < 6) {
            return res.status(400).json({
                error: 'Senha deve ter pelo menos 6 caracteres.'
            });
        }

        // Verificar se o treinador já existe
        const existingTrainer = await knex('trainers').where({ nome }).first();
        if (existingTrainer) {
            return res.status(409).json({
                error: 'Treinador com este nome já existe.'
            });
        }

        // Hash da senha
        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(senha, saltRounds);

        // Inserir treinador
        const [novoTreinador] = await knex('trainers')
            .insert({
                nome,
                senha_hash: senhaHash
            })
            .returning(['id', 'nome', 'created_at']);

        console.log('✅ Treinador registrado:', { id: novoTreinador.id, nome: novoTreinador.nome });

        // Gerar token JWT
        const token = jwt.sign(
            {
                treinadorId: novoTreinador.id,
                nome: novoTreinador.nome
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.status(201).json({
            message: 'Treinador registrado com sucesso!',
            treinador: {
                id: novoTreinador.id,
                nome: novoTreinador.nome
            },
            token
        });

    } catch (err) {
        console.error('❌ Erro ao registrar treinador:', err);
        return res.status(500).json({
            error: 'Erro interno do servidor ao registrar treinador.'
        });
    }
}

/**
 * Faz login do treinador
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function login(req, res) {
    const { nome, senha } = req.body;

    try {
        console.log('🔐 Tentando login do treinador:', { nome });

        // Validações
        if (!nome || !senha) {
            return res.status(400).json({
                error: 'Nome e senha são obrigatórios.'
            });
        }

        // Buscar treinador
        const treinador = await knex('trainers').where({ nome }).first();
        if (!treinador) {
            return res.status(401).json({
                error: 'Nome ou senha inválidos.'
            });
        }

        // Verificar senha
        const senhaValida = await bcrypt.compare(senha, treinador.senha_hash);
        if (!senhaValida) {
            return res.status(401).json({
                error: 'Nome ou senha inválidos.'
            });
        }

        console.log('✅ Login bem-sucedido:', { id: treinador.id, nome: treinador.nome });

        // Gerar token JWT
        const token = jwt.sign(
            {
                treinadorId: treinador.id,
                nome: treinador.nome
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.status(200).json({
            message: 'Login realizado com sucesso!',
            treinador: {
                id: treinador.id,
                nome: treinador.nome
            },
            token
        });

    } catch (err) {
        console.error('❌ Erro ao fazer login:', err);
        return res.status(500).json({
            error: 'Erro interno do servidor ao fazer login.'
        });
    }
}

/**
 * Verifica se o token é válido
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function verifyToken(req, res) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                error: 'Token não fornecido.'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        // Buscar treinador no banco
        const treinador = await knex('trainers')
            .where({ id: decoded.treinadorId })
            .select(['id', 'nome'])
            .first();

        if (!treinador) {
            return res.status(401).json({
                error: 'Token inválido.'
            });
        }

        return res.status(200).json({
            valid: true,
            treinador: {
                id: treinador.id,
                nome: treinador.nome
            }
        });

    } catch (err) {
        console.error('❌ Erro ao verificar token:', err);
        return res.status(401).json({
            error: 'Token inválido.'
        });
    }
}

module.exports = {
    register,
    login,
    verifyToken
}; 