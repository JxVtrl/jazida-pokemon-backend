const knex = require('../database');

const tiposPermitidos = ['pikachu', 'charizard', 'mewtwo'];

// Criar um novo pokémon
async function createPokemon(req, res) {
    const { tipo, treinador } = req.body;
    if (!tiposPermitidos.includes(tipo)) {
        return res.status(400).json({ error: 'Tipo inválido. Use pikachu, charizard ou mewtwo.' });
    }

    try {
        const [id] = await knex('pokemons').insert({ tipo, treinador, nivel: 1 }).returning('id');
        const novoPokemon = await knex('pokemons').where({ id }).first();
        return res.status(201).json(novoPokemon);
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao criar pokémon.' });
    }
}

// Listar todos os pokémons
async function listPokemons(req, res) {
    try {
        const pokemons = await knex('pokemons');
        return res.status(200).json(pokemons);
    } catch (err) {
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
        return res.status(500).json({ error: 'Erro ao deletar pokémon.' });
    }
}


module.exports = { createPokemon, listPokemons, getPokemonById, updatePokemon, deletePokemon };
