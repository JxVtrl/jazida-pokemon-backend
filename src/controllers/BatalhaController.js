const knex = require('../database/db');

async function batalhar(req, res) {
    const { pokemonAId, pokemonBId } = req.params;

    try {
        // Verificar se não é a mesma batalha
        if (pokemonAId === pokemonBId) {
            return res.status(400).json({
                error: 'Não é possível batalhar um pokémon contra ele mesmo.'
            });
        }

        // Buscar pokémons no banco
        const pokemonA = await knex('pokemons').where({ id: pokemonAId }).first();
        const pokemonB = await knex('pokemons').where({ id: pokemonBId }).first();

        if (!pokemonA) {
            return res.status(404).json({
                error: 'Pokémon não encontrado.',
                details: `Pokémon com ID ${pokemonAId} não foi encontrado.`
            });
        }

        if (!pokemonB) {
            return res.status(404).json({
                error: 'Pokémon não encontrado.',
                details: `Pokémon com ID ${pokemonBId} não foi encontrado.`
            });
        }

        // Calcular probabilidade baseada nos níveis
        const totalNivel = pokemonA.nivel + pokemonB.nivel;
        const chanceA = pokemonA.nivel / totalNivel;
        const chanceB = pokemonB.nivel / totalNivel;
        const random = Math.random();

        const vencedor = random < chanceA ? pokemonA : pokemonB;
        const perdedor = vencedor.id === pokemonA.id ? pokemonB : pokemonA;

        // Atualizar vencedor
        await knex('pokemons')
            .where({ id: vencedor.id })
            .update({ nivel: vencedor.nivel + 1 });

        let perdedorFinal = { ...perdedor, nivel: perdedor.nivel - 1, removido: false };

        if (perdedorFinal.nivel <= 0) {
            await knex('pokemons').where({ id: perdedor.id }).del();
            perdedorFinal.nivel = 0;
            perdedorFinal.removido = true;
        } else {
            await knex('pokemons')
                .where({ id: perdedor.id })
                .update({ nivel: perdedorFinal.nivel });
        }

        const vencedorFinal = {
            ...vencedor,
            nivel: vencedor.nivel + 1,
        };

        return res.status(200).json({
            vencedor: vencedorFinal,
            perdedor: perdedorFinal,
            batalha: {
                vencedor: vencedor.tipo,
                perdedor: perdedor.tipo,
                probabilidadeVencedor: vencedor.id === pokemonA.id ? chanceA : chanceB,
                probabilidadePerdedor: perdedor.id === pokemonA.id ? chanceA : chanceB
            }
        });
    } catch (error) {
        console.error('Erro ao processar batalha:', error);
        return res.status(500).json({ error: 'Erro ao processar a batalha.' });
    }
}

module.exports = {
    batalhar,
};
