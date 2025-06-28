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
                treinador: parseInt(treinadorId), // Força o campo a ser número inteiro
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

        // Buscar nomes dos treinadores (apenas para IDs numéricos válidos)
        const treinadorIds = [...new Set(pokemons.map(p => p.treinador))];
        const numericTrainerIds = treinadorIds.filter(id => !isNaN(id) && id !== null && id !== undefined);
        
        let treinadorMap = {};
        if (numericTrainerIds.length > 0) {
            const treinadores = await knex('trainers').whereIn('id', numericTrainerIds).select('id', 'nome');
            treinadorMap = Object.fromEntries(treinadores.map(t => [t.id, t.nome]));
        }

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
                // O pokémon venceu se for o vencedor da batalha
                if (b.pokemon_a_id === p.id && b.pokemon_a_level_after > b.pokemon_a_level_before) return true;
                if (b.pokemon_b_id === p.id && b.pokemon_b_level_after > b.pokemon_b_level_before) return true;
                return false;
            }).length;
            const losses = battlesForPokemon.filter(b => {
                // O pokémon perdeu se o nível diminuiu
                if (b.pokemon_a_id === p.id && b.pokemon_a_level_after < b.pokemon_a_level_before) return true;
                if (b.pokemon_b_id === p.id && b.pokemon_b_level_after < b.pokemon_b_level_before) return true;
                return false;
            }).length;
            const total = battlesForPokemon.length;
            const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
            statsMap[p.id] = { total, wins, losses, winRate };
        }

        // Montar resposta
        const pokemonsWithStats = pokemons.map(p => {
            // Determinar o nome do treinador
            let treinadorNome = p.treinador;
            
            // Se o treinador for um número (ID), buscar o nome
            if (!isNaN(p.treinador)) {
                treinadorNome = treinadorMap[p.treinador] || p.treinador;
            }
            
            return {
                ...p,
                treinador_nome: treinadorNome,
                batalhas: statsMap[p.id]?.total || 0,
                vitorias: statsMap[p.id]?.wins || 0,
                derrotas: statsMap[p.id]?.losses || 0,
                winRate: statsMap[p.id]?.winRate || 0
            };
        });

        return res.status(200).json(pokemonsWithStats);
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
        const pokemons = await knex('pokemons').where('treinador', treinadorId);
        console.log(`[MEUS POKEMONS] Encontrados ${pokemons.length} pokémons para treinador ${treinadorId}:`, pokemons);

        // Buscar nome do treinador
        const treinador = await knex('trainers').where({ id: treinadorId }).select('id', 'nome').first();
        const treinadorNome = treinador ? treinador.nome : treinadorId;

        // Buscar estatísticas de batalhas para cada pokémon
        const pokemonIds = pokemons.map(p => p.id);
        const battles = await knex('battle_history')
            .whereIn('pokemon_a_id', pokemonIds)
            .orWhereIn('pokemon_b_id', pokemonIds);

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

        return res.json(pokemonsWithStats);
    } catch (error) {
        console.error('[MEUS POKEMONS] Erro ao buscar pokémons:', error);
        return res.status(500).json({ error: 'Erro ao buscar pokémons.' });
    }
}

module.exports = { createPokemon, listPokemons, getPokemonById, updatePokemon, deletePokemon, listarMeusPokemons };
