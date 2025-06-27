const express = require('express');
const router = express.Router();

const {
    batalharPokemons
} = require('../controllers/BattleController');

/**
 * @swagger
 * /batalhar/{pokemonAId}/{pokemonBId}:
 *   post:
 *     summary: Realiza uma batalha entre dois pokémons
 *     description: |
 *       Realiza uma batalha entre dois pokémons baseada em suas probabilidades de vitória.
 *       As probabilidades são calculadas com base nos níveis dos pokémons.
 *       O vencedor ganha +1 nível e o perdedor perde -1 nível.
 *       Se o perdedor ficar com nível 0, ele é removido do banco de dados.
 *     tags: [Batalhas]
 *     parameters:
 *       - in: path
 *         name: pokemonAId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do primeiro pokémon
 *       - in: path
 *         name: pokemonBId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do segundo pokémon
 *     responses:
 *       200:
 *         description: Batalha realizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vencedor:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID do pokémon vencedor
 *                     tipo:
 *                       type: string
 *                       description: Tipo do pokémon vencedor
 *                     treinador:
 *                       type: string
 *                       description: Nome do treinador do vencedor
 *                     nivel:
 *                       type: integer
 *                       description: Novo nível do vencedor (nível anterior + 1)
 *                 perdedor:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID do pokémon perdedor
 *                     tipo:
 *                       type: string
 *                       description: Tipo do pokémon perdedor
 *                     treinador:
 *                       type: string
 *                       description: Nome do treinador do perdedor
 *                     nivel:
 *                       type: integer
 *                       description: Novo nível do perdedor (nível anterior - 1)
 *                     removido:
 *                       type: boolean
 *                       description: Indica se o pokémon foi removido do banco (nível 0)
 *                 batalha:
 *                   type: object
 *                   properties:
 *                     vencedor:
 *                       type: string
 *                       description: Tipo do pokémon vencedor
 *                     perdedor:
 *                       type: string
 *                       description: Tipo do pokémon perdedor
 *                     probabilidadeVencedor:
 *                       type: number
 *                       format: float
 *                       description: Probabilidade de vitória do vencedor (0.0 a 1.0)
 *                     probabilidadePerdedor:
 *                       type: number
 *                       format: float
 *                       description: Probabilidade de vitória do perdedor (0.0 a 1.0)
 *       400:
 *         description: Tentativa de batalha inválida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Não é possível batalhar um pokémon contra ele mesmo."
 *       404:
 *         description: Um ou ambos os pokémons não encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Pokémon não encontrado."
 *                 details:
 *                   type: string
 *                   example: "Pokémon com ID 999 não foi encontrado."
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Erro interno do servidor ao processar a batalha."
 *                 details:
 *                   type: string
 *                   example: "Detalhes do erro interno"
 */
router.post('/:pokemonAId/:pokemonBId', batalharPokemons);

module.exports = router; 