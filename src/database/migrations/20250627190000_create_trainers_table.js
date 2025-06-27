/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('trainers', function (table) {
        table.increments('id').primary();
        table.string('nome').notNullable().unique();
        table.string('senha_hash').notNullable();
        table.timestamps(true, true);

        // Índices
        table.index('nome');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('trainers');
}; 