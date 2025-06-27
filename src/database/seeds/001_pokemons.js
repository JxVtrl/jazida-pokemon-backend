/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
    await knex('pokemons').del();

    await knex('pokemons').insert([
        { tipo: 'pikachu', treinador: 'Ash', nivel: 1 },
        { tipo: 'charizard', treinador: 'Thiago', nivel: 1 },
        { tipo: 'mewtwo', treinador: 'Giovanni', nivel: 1 }
    ]);
};
