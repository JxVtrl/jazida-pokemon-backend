const express = require('express');
const router = express.Router();

const {
    createPokemon,
    listPokemons,
    getPokemonById,
    updatePokemon,
    deletePokemon,
    listarMeusPokemons,
} = require('../controllers/PokemonController');

/**
 * @swagger
 * /pokemons:
 *   post:
 *     summary: Cria um novo pokémon
 *     description: Cria um novo pokémon com tipo, treinador e nível inicial 1
 *     tags: [Pokémons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo
 *               - treinador
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [pikachu, charizard, mewtwo]
 *                 description: Tipo do pokémon (apenas os tipos permitidos)
 *               treinador:
 *                 type: string
 *                 description: Nome do treinador do pokémon
 *     responses:
 *       201:
 *         description: Pokémon criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: ID único do pokémon
 *                 tipo:
 *                   type: string
 *                   description: Tipo do pokémon
 *                 treinador:
 *                   type: string
 *                   description: Nome do treinador
 *                 nivel:
 *                   type: integer
 *                   description: Nível do pokémon (inicia em 1)
 *       400:
 *         description: Tipo de pokémon inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Tipo inválido. Use pikachu, charizard ou mewtwo."
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Erro ao criar pokémon."
 */
router.post('/', createPokemon);

/**
 * @swagger
 * /pokemons:
 *   get:
 *     summary: Lista todos os pokémons
 *     description: Retorna uma lista com todos os pokémons cadastrados no sistema
 *     tags: [Pokémons]
 *     responses:
 *       200:
 *         description: Lista de pokémons retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: ID único do pokémon
 *                   tipo:
 *                     type: string
 *                     description: Tipo do pokémon
 *                   treinador:
 *                     type: string
 *                     description: Nome do treinador
 *                   nivel:
 *                     type: integer
 *                     description: Nível atual do pokémon
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Erro ao listar pokémons."
 */
router.get('/', listPokemons);

/**
 * @swagger
 * /pokemons/{id}:
 *   get:
 *     summary: Busca um pokémon por ID
 *     description: Retorna os dados de um pokémon específico pelo seu ID
 *     tags: [Pokémons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único do pokémon
 *     responses:
 *       200:
 *         description: Pokémon encontrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: ID único do pokémon
 *                 tipo:
 *                   type: string
 *                   description: Tipo do pokémon
 *                 treinador:
 *                   type: string
 *                   description: Nome do treinador
 *                 nivel:
 *                   type: integer
 *                   description: Nível atual do pokémon
 *       404:
 *         description: Pokémon não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Pokémon não encontrado."
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Erro ao buscar pokémon."
 */
router.get('/:id', getPokemonById);

/**
 * @swagger
 * /pokemons/{id}:
 *   put:
 *     summary: Atualiza o treinador de um pokémon
 *     description: Atualiza apenas o nome do treinador de um pokémon específico
 *     tags: [Pokémons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único do pokémon
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - treinador
 *             properties:
 *               treinador:
 *                 type: string
 *                 description: Novo nome do treinador
 *     responses:
 *       204:
 *         description: Treinador atualizado com sucesso
 *       400:
 *         description: Campo treinador não fornecido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "O campo 'treinador' é obrigatório."
 *       404:
 *         description: Pokémon não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Pokémon não encontrado."
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Erro ao atualizar pokémon."
 */
router.put('/:id', updatePokemon);

/**
 * @swagger
 * /pokemons/{id}:
 *   delete:
 *     summary: Deleta um pokémon
 *     description: Remove um pokémon específico do sistema pelo seu ID
 *     tags: [Pokémons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único do pokémon a ser deletado
 *     responses:
 *       204:
 *         description: Pokémon deletado com sucesso
 *       404:
 *         description: Pokémon não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Pokémon não encontrado."
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Erro ao deletar pokémon."
 */
router.delete('/:id', deletePokemon);

module.exports = router;
