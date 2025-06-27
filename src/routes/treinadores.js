const express = require('express');
const router = express.Router();

const {
    listarPokemonsPorTreinador,
    listarTreinadores
} = require('../controllers/TreinadorController');

/**
 * @swagger
 * /treinadores:
 *   get:
 *     summary: Lista todos os treinadores únicos
 *     description: Retorna uma lista com todos os treinadores únicos cadastrados no sistema
 *     tags: [Treinadores]
 *     responses:
 *       200:
 *         description: Lista de treinadores retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 treinadores:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Lista de nomes dos treinadores
 *                 total:
 *                   type: integer
 *                   description: Total de treinadores únicos
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Erro ao listar treinadores."
 */
router.get('/', listarTreinadores);

/**
 * @swagger
 * /treinadores/{nome}/pokemons:
 *   get:
 *     summary: Lista pokémons de um treinador específico
 *     description: Retorna todos os pokémons pertencentes a um treinador específico
 *     tags: [Treinadores]
 *     parameters:
 *       - in: path
 *         name: nome
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome do treinador
 *     responses:
 *       200:
 *         description: Lista de pokémons do treinador retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 treinador:
 *                   type: string
 *                   description: Nome do treinador
 *                 pokemons:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: ID único do pokémon
 *                       tipo:
 *                         type: string
 *                         description: Tipo do pokémon
 *                       treinador:
 *                         type: string
 *                         description: Nome do treinador
 *                       nivel:
 *                         type: integer
 *                         description: Nível atual do pokémon
 *                 total:
 *                   type: integer
 *                   description: Total de pokémons do treinador
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Erro ao buscar pokémons do treinador."
 */
router.get('/:nome/pokemons', listarPokemonsPorTreinador);

module.exports = router; 