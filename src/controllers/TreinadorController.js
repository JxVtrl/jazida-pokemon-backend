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

        // Buscar o treinador pelo nome
        const treinador = await knex('trainers').where({ nome }).first();
        if (!treinador) {
            // Retornar lista vazia se treinador não existe
            return res.status(200).json({
                treinador: nome,
                pokemons: [],
                total: 0
            });
        }
        const treinadorId = treinador.id;
        const treinadorNome = treinador.nome;

        // Buscar pokémons pelo ID do treinador
        const pokemons = await knex('pokemons')
            .where({ treinador: treinadorId })
            .orderBy('id', 'asc');

        // Buscar estatísticas de batalhas para cada pokémon
        const pokemonIds = pokemons.map(p => p.id);
        let battles = [];
        if (pokemonIds.length > 0) {
            battles = await knex('battle_history')
                .whereIn('pokemon_a_id', pokemonIds)
                .orWhereIn('pokemon_b_id', pokemonIds);
        }

        // Mapear estatísticas
        const statsMap = {};
        for (const p of pokemons) {
            const battlesForPokemon = battles.filter(b => b.pokemon_a_id === p.id || b.pokemon_b_id === p.id);
            const wins = battlesForPokemon.filter(b => {
                if (b.pokemon_a_id === p.id && b.pokemon_a_level_after > b.pokemon_a_level_before) return true;
                if (b.pokemon_b_id === p.id && b.pokemon_b_level_after > b.pokemon_b_level_before) return true;
                return false;
            }).length;
            const losses = battlesForPokemon.filter(b => {
                if (b.pokemon_a_id === p.id && b.pokemon_a_level_after < b.pokemon_a_level_before) return true;
                if (b.pokemon_b_id === p.id && b.pokemon_b_level_after < b.pokemon_b_level_before) return true;
                return false;
            }).length;
            const total = battlesForPokemon.length;
            const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
            statsMap[p.id] = { total, wins, losses, winRate };
        }

        // Montar resposta
        const pokemonsWithStats = pokemons.map(p => ({
            ...p,
            treinador_nome: treinadorNome,
            batalhas: statsMap[p.id]?.total || 0,
            vitorias: statsMap[p.id]?.wins || 0,
            derrotas: statsMap[p.id]?.losses || 0,
            winRate: statsMap[p.id]?.winRate || 0
        }));

        return res.status(200).json({
            treinador: treinadorNome,
            pokemons: pokemonsWithStats,
            total: pokemonsWithStats.length
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

/**
 * Lista apenas os treinadores conectados via socket
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function listarTreinadoresOnline(req, res) {
    try {
        console.log('🔍 Buscando treinadores online...');

        // Obter lista de treinadores conectados via socket
        const trainerSockets = req.app.get('trainerSockets');
        
        // Verificar se trainerSockets está disponível (pode não estar em testes)
        if (!trainerSockets) {
            console.log('⚠️ trainerSockets não disponível, retornando lista vazia');
            return res.status(200).json({
                treinadores: [],
                total: 0,
                message: 'Nenhum treinador online no momento.'
            });
        }
        
        const connectedTrainerIds = Array.from(trainerSockets.keys());

        console.log(`📡 Treinadores conectados: ${connectedTrainerIds.length}`);

        if (connectedTrainerIds.length === 0) {
            return res.status(200).json({
                treinadores: [],
                total: 0,
                message: 'Nenhum treinador online no momento.'
            });
        }

        // Buscar dados dos treinadores conectados
        const treinadores = await knex('trainers')
            .whereIn('id', connectedTrainerIds)
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

        console.log(`✅ Encontrados ${treinadores.length} treinadores online`);

        return res.status(200).json({
            treinadores: treinadores,
            total: treinadores.length,
            message: `${treinadores.length} treinador(es) online`
        });
    } catch (err) {
        console.error('❌ Erro ao listar treinadores online:', err);
        return res.status(500).json({
            error: 'Erro ao listar treinadores online.',
            details: err.message
        });
    }
}

module.exports = {
    listarPokemonsPorTreinador,
    listarTreinadores,
    listarTreinadoresOnline
}; 