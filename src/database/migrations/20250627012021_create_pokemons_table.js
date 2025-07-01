exports.up = function (knex) {
    return knex.schema.createTable('pokemons', (table) => {
        table.increments('id').primary();
        table.string('tipo').notNullable();
        table.integer('treinador_id').unsigned().references('id').inTable('trainers').onDelete('CASCADE');
        table.integer('nivel').notNullable().defaultTo(1);
        
        // Índices para melhor performance
        table.index('treinador_id');
        table.index('tipo');
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('pokemons');
};
