/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('battle_history', function (table) {
        table.increments('id').primary();
        table.string('battle_id').unique().notNullable(); // ID único da batalha
        table.integer('trainer_a_id').unsigned().references('id').inTable('trainers').onDelete('CASCADE');
        table.integer('trainer_b_id').unsigned().references('id').inTable('trainers').onDelete('CASCADE');
        table.string('trainer_a_name').notNullable();
        table.string('trainer_b_name').notNullable();
        table.integer('pokemon_a_id').unsigned().references('id').inTable('pokemons').onDelete('CASCADE');
        table.integer('pokemon_b_id').unsigned().references('id').inTable('pokemons').onDelete('CASCADE');
        table.string('pokemon_a_type').notNullable();
        table.string('pokemon_b_type').notNullable();
        table.integer('pokemon_a_level_before').notNullable();
        table.integer('pokemon_b_level_before').notNullable();
        table.integer('pokemon_a_level_after').notNullable();
        table.integer('pokemon_b_level_after').notNullable();
        table.integer('winner_trainer_id').unsigned().references('id').inTable('trainers');
        table.integer('loser_trainer_id').unsigned().references('id').inTable('trainers');
        table.string('winner_pokemon_type').notNullable();
        table.string('loser_pokemon_type').notNullable();
        table.integer('rounds_played').notNullable().defaultTo(0);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('finished_at').defaultTo(knex.fn.now());
        
        // Índices para melhor performance
        table.index(['trainer_a_id']);
        table.index(['trainer_b_id']);
        table.index(['winner_trainer_id']);
        table.index(['created_at']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('battle_history');
}; 