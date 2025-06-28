const knex = require('../database/db');

// Tipos de pokémon permitidos no sistema
const tiposPermitidos = ['pikachu', 'charizard', 'mewtwo'];

// Criar um novo pokémon
async function createPokemon(req, res) {
    const { tipo } = req.body;
    // Buscar o ID do treinador autenticado
    const treinadorId = req.treinadorId || req.user?.id || req.userId;
    console.log('🔍 Tentando criar pokémon:', { tipo, treinadorId });

    if (!tiposPermitidos.includes(tipo)) {
        return res.status(400).json({ error: 'Tipo inválido. Use pikachu, charizard ou mewtwo.' });
    }

    if (!treinadorId) {
        return res.status(401).json({ error: 'Não autenticado.' });
    }

    try {
        console.log('📡 Inserindo pokémon no banco...');

        // Para PostgreSQL, precisamos usar returning para obter o ID
        const [novoPokemon] = await knex('pokemons')
            .insert({
                tipo,
                treinador: Number(treinadorId), // Força o campo a ser número
                nivel: 1
            })
            .returning('*');

        console.log('✅ Pokémon criado:', novoPokemon);

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

    // Validar se o campo treinador foi enviado
    if (!treinador) {
        return res.status(400).json({ error: "O campo 'treinador' é obrigatório." });
    }

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

// Lista os pokémons do treinador autenticado
async function listarMeusPokemons(req, res) {
    const treinadorId = req.treinadorId || req.user?.id || req.userId;
    console.log(`[MEUS POKEMONS] Requisição recebida. Treinador ID: ${treinadorId}`);
    console.log(`[MEUS POKEMONS] req.treinadorId:`, req.treinadorId);
    console.log(`[MEUS POKEMONS] req.user?.id:`, req.user?.id);
    console.log(`[MEUS POKEMONS] req.userId:`, req.userId);
    if (!treinadorId) {
        console.log(`[MEUS POKEMONS] ❌ Treinador não autenticado`);
        return res.status(401).json({ error: 'Não autenticado.' });
    }
    try {
        const db = req.app.get('db') || require('../database/db');
        const pokemons = await db('pokemons').where('treinador', treinadorId);
        console.log(`[MEUS POKEMONS] Encontrados ${pokemons.length} pokémons para treinador ${treinadorId}:`, pokemons);
        return res.json(pokemons);
    } catch (error) {
        console.error('[MEUS POKEMONS] Erro ao buscar pokémons:', error);
        return res.status(500).json({ error: 'Erro ao buscar pokémons.' });
    }
}

module.exports = { createPokemon, listPokemons, getPokemonById, updatePokemon, deletePokemon, listarMeusPokemons };
