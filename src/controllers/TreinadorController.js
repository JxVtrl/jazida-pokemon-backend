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
 * Lista todos os treinadores únicos no sistema com estatísticas
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function listarTreinadores(req, res) {
    try {
        console.log('🔍 Buscando todos os treinadores com estatísticas...');

        // Buscar todos os treinadores cadastrados com estatísticas
        const treinadores = await knex('trainers')
            .select([
                'id', 
                'nome', 
                'avatar_url', 
                'status_message',
                'total_battles', 
                'wins', 
                'losses', 
                'level', 
                'experience'
            ])
            .orderBy('nome', 'asc');

        console.log(`✅ Encontrados ${treinadores.length} treinadores únicos`);

        return res.status(200).json({
            treinadores: treinadores,
            total: treinadores.length
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