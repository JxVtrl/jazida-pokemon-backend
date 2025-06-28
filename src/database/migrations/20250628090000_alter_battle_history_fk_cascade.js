exports.up = async function (knex) {
    const exists = await knex.schema.hasTable('battle_history');
    if (!exists) return;
    // Remove as FKs antigas e adiciona com ON DELETE CASCADE
    await knex.schema.alterTable('battle_history', function (table) {
        table.dropForeign('pokemon_a_id');
        table.dropForeign('pokemon_b_id');
    });
    await knex.schema.alterTable('battle_history', function (table) {
        table.foreign('pokemon_a_id').references('pokemons.id').onDelete('CASCADE');
        table.foreign('pokemon_b_id').references('pokemons.id').onDelete('CASCADE');
    });
};

exports.down = async function (knex) {
    const exists = await knex.schema.hasTable('battle_history');
    if (!exists) return;
    // Remove as FKs com CASCADE e adiciona sem CASCADE (restrito)
    await knex.schema.alterTable('battle_history', function (table) {
        table.dropForeign('pokemon_a_id');
        table.dropForeign('pokemon_b_id');
    });
    await knex.schema.alterTable('battle_history', function (table) {
        table.foreign('pokemon_a_id').references('pokemons.id');
        table.foreign('pokemon_b_id').references('pokemons.id');
    });
}; 