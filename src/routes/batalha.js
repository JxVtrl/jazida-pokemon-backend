const express = require('express');
const { batalhar } = require('../controllers/BatalhaController');

const router = express.Router();

/**
 * @swagger
 * /batalhar/{pokemonAId}/{pokemonBId}:
 *   post:
 *     summary: Realiza uma batalha entre dois pokémons
 *     description: |
 *       Simula uma batalha entre dois pokémons baseada na proporção dos níveis.
 *       - O vencedor é determinado probabilisticamente baseado nos níveis
 *       - O vencedor ganha +1 nível
 *       - O perdedor perde -1 nível
 *       - Se o perdedor chegar ao nível 0, é deletado do sistema
 *     tags: [Batalhas]
 *     parameters:
 *       - in: path
 *         name: pokemonAId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do primeiro pokémon (Pokémon A)
 *       - in: path
 *         name: pokemonBId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do segundo pokémon (Pokémon B)
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
 *                   description: Dados do pokémon vencedor após a batalha
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID único do pokémon
 *                     tipo:
 *                       type: string
 *                       description: Tipo do pokémon
 *                     treinador:
 *                       type: string
 *                       description: Nome do treinador
 *                     nivel:
 *                       type: integer
 *                       description: Nível atual do pokémon (aumentou +1)
 *                 perdedor:
 *                   type: object
 *                   description: Dados do pokémon perdedor após a batalha
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID único do pokémon
 *                     tipo:
 *                       type: string
 *                       description: Tipo do pokémon
 *                     treinador:
 *                       type: string
 *                       description: Nome do treinador
 *                     nivel:
 *                       type: integer
 *                       description: Nível atual do pokémon (diminuiu -1, pode ser 0)
 *       404:
 *         description: Um ou ambos os pokémons não foram encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Um ou ambos os pokémons não foram encontrados."
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Erro ao processar a batalha."
 */
router.post('/batalhar/:pokemonAId/:pokemonBId', batalhar);

module.exports = router; 