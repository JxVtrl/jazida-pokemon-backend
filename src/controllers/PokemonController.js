const knex = require('../database/db');

// Tipos de pokémon permitidos no sistema
const tiposPermitidos = ['pikachu', 'charizard', 'mewtwo'];

// Criar um novo pokémon
async function createPokemon(req, res) {
    const { tipo, treinador } = req.body;
    console.log('🔍 Tentando criar pokémon:', { tipo, treinador });

    if (!tiposPermitidos.includes(tipo)) {
        return res.status(400).json({ error: 'Tipo inválido. Use pikachu, charizard ou mewtwo.' });
    }

    try {
        console.log('📡 Inserindo pokémon no banco...');

        // Abordagem mais robusta para diferentes versões do Knex e bancos
        const insertResult = await knex('pokemons').insert({
            tipo,
            treinador,
            nivel: 1
        });

        console.log('✅ Resultado da inserção:', insertResult);

        // Obtém o ID do pokémon inserido
        let pokemonId;
        if (Array.isArray(insertResult) && insertResult.length > 0) {
            pokemonId = insertResult[0];
        } else if (typeof insertResult === 'object' && insertResult.id) {
            pokemonId = insertResult.id;
        } else {
            pokemonId = insertResult;
        }

        console.log('✅ Pokémon inserido com ID:', pokemonId);

        console.log('📡 Buscando pokémon criado...');
        const novoPokemon = await knex('pokemons').where({ id: pokemonId }).first();
        console.log('✅ Pokémon encontrado:', novoPokemon);

        if (!novoPokemon) {
            throw new Error('Pokémon não foi encontrado após inserção');
        }

        return res.status(201).json(novoPokemon);
    } catch (err) {
        console.error('❌ Erro ao criar pokémon:');
        console.error('   - Mensagem:', err.message);
        console.error('   - Stack:', err.stack);
        console.error('   - Código:', err.code);
        console.error('   - Detalhes completos:', err);

        return res.status(500).json({ error: 'Erro ao criar pokémon.' });
    }
}

// Listar todos os pokémons
async function listPokemons(req, res) {
    console.log('🔍 Iniciando listagem de pokémons...');

    try {
        console.log('📡 Executando query no banco de dados...');
        const pokemons = await knex('pokemons');
        console.log(`✅ Query executada com sucesso. ${pokemons.length} pokémons encontrados:`, pokemons);

        return res.status(200).json(pokemons);
    } catch (err) {
        console.error('❌ Erro ao listar pokémons:');
        console.error('   - Mensagem:', err.message);
        console.error('   - Stack:', err.stack);
        console.error('   - Código:', err.code);
        console.error('   - Detalhes completos:', err);

        return res.status(500).json({ error: 'Erro ao listar pokémons.' });
    }
}

// Buscar um pokémon pelo ID
async function getPokemonById(req, res) {
    const { id } = req.params;

    try {
        const pokemon = await knex('pokemons').where({ id }).first();
        if (!pokemon) return res.status(404).json({ error: 'Pokémon não encontrado.' });

        return res.status(200).json(pokemon);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao buscar pokémon.' });
    }
}

// Atualizar um pokémon
async function updatePokemon(req, res) {
    const { id } = req.params;
    const { treinador } = req.body;

    try {
        const updated = await knex('pokemons').where({ id }).update({ treinador });
        if (!updated) return res.status(404).json({ error: 'Pokémon não encontrado.' });

        return res.status(204).send();
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao atualizar pokémon.' });
    }
}


// Deletar um pokémon
async function deletePokemon(req, res) {
    const { id } = req.params;

    try {
        const deleted = await knex('pokemons').where({ id }).del();
        if (!deleted) return res.status(404).json({ error: 'Pokémon não encontrado.' });

        return res.status(204).send();
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao deletar pokémon.' });
    }
}


module.exports = { createPokemon, listPokemons, getPokemonById, updatePokemon, deletePokemon };
