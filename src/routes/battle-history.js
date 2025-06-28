const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getBattleHistory, getTrainerStats } = require('../controllers/BattleHistoryController');

/**
 * @swagger
 * /battle-history:
 *   get:
 *     summary: Busca o histórico de batalhas do treinador
 *     description: Retorna as últimas 50 batalhas do treinador autenticado
 *     tags: [Histórico de Batalhas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Histórico retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: ID único da batalha
 *                   data:
 *                     type: string
 *                     format: date-time
 *                     description: Data e hora da batalha
 *                   rounds:
 *                     type: integer
 *                     description: Número de rounds da batalha
 *                   euSouA:
 *                     type: boolean
 *                     description: Se o treinador era o treinador A
 *                   meuPokemon:
 *                     type: string
 *                     description: Tipo do pokémon usado
 *                   meuNivelAntes:
 *                     type: integer
 *                     description: Nível do pokémon antes da batalha
 *                   meuNivelDepois:
 *                     type: integer
 *                     description: Nível do pokémon depois da batalha
 *                   adversario:
 *                     type: string
 *                     description: Nome do adversário
 *                   pokemonAdversario:
 *                     type: string
 *                     description: Tipo do pokémon do adversário
 *                   vencedor:
 *                     type: string
 *                     enum: [eu, adversario]
 *                     description: Quem venceu a batalha
 *                   resultado:
 *                     type: string
 *                     enum: [victory, defeat]
 *                     description: Resultado para o treinador
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', requireAuth, getBattleHistory);

/**
 * @swagger
 * /battle-history/stats:
 *   get:
 *     summary: Busca estatísticas detalhadas do treinador
 *     description: Retorna estatísticas completas incluindo nível e experiência
 *     tags: [Histórico de Batalhas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas retornadas com sucesso
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
router.get('/stats', requireAuth, getTrainerStats);

module.exports = router; 