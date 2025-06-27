const knex = require('../database/db');

async function batalhar(req, res) {
    const { pokemonAId, pokemonBId } = req.params;

    try {
        // Buscar pokémons no banco
        const pokemonA = await knex('pokemons').where({ id: pokemonAId }).first();
        const pokemonB = await knex('pokemons').where({ id: pokemonBId }).first();

        if (!pokemonA || !pokemonB) {
            return res.status(404).json({ error: 'Um ou ambos os pokémons não foram encontrados.' });
        }

        // Calcular probabilidade baseada nos níveis
        const totalNivel = pokemonA.nivel + pokemonB.nivel;

        const chanceA = pokemonA.nivel / totalNivel;
        const random = Math.random();

        const vencedor = random < chanceA ? pokemonA : pokemonB;
        const perdedor = vencedor.id === pokemonA.id ? pokemonB : pokemonA;

        // Atualizar vencedor
        await knex('pokemons')
            .where({ id: vencedor.id })
            .update({ nivel: vencedor.nivel + 1 });

        let perdedorFinal = { ...perdedor, nivel: perdedor.nivel - 1 };

        if (perdedorFinal.nivel <= 0) {
            await knex('pokemons').where({ id: perdedor.id }).del();
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
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao processar a batalha.' });
    }
}

module.exports = {
    batalhar,
};
