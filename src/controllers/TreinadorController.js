const knex = require('../database/db');

/**
 * Lista todos os pokémons de um treinador específico
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function listarPokemonsPorTreinador(req, res) {
    const { nome } = req.params;

    try {
        console.log(`🔍 Buscando pokémons do treinador: ${nome}`);

        const pokemons = await knex('pokemons')
            .where({ treinador: nome })
            .orderBy('id', 'asc');

        console.log(`✅ Encontrados ${pokemons.length} pokémons para o treinador ${nome}`);

        return res.status(200).json({
            treinador: nome,
            pokemons: pokemons,
            total: pokemons.length
        });
    } catch (err) {
        console.error('❌ Erro ao buscar pokémons do treinador:', err);
        return res.status(500).json({
            error: 'Erro ao buscar pokémons do treinador.',
            details: err.message
        });
    }
}

/**
 * Lista todos os treinadores únicos no sistema
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function listarTreinadores(req, res) {
    try {
        console.log('🔍 Buscando todos os treinadores...');

        const treinadores = await knex('pokemons')
            .distinct('treinador')
            .orderBy('treinador', 'asc');

        const nomesTreinadores = treinadores.map(t => t.treinador);

        console.log(`✅ Encontrados ${nomesTreinadores.length} treinadores únicos`);

        return res.status(200).json({
            treinadores: nomesTreinadores,
            total: nomesTreinadores.length
        });
    } catch (err) {
        console.error('❌ Erro ao listar treinadores:', err);
        return res.status(500).json({
            error: 'Erro ao listar treinadores.',
            details: err.message
        });
    }
}

module.exports = {
    listarPokemonsPorTreinador,
    listarTreinadores
}; 