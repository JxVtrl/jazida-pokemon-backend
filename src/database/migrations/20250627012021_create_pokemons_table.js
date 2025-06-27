exports.up = function (knex) {
    return knex.schema.createTable('pokemons', (table) => {
        table.increments('id').primary();
        table.string('tipo').notNullable();
        table.string('treinador').notNullable();
        table.integer('nivel').notNullable().defaultTo(1);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('pokemons');
};
