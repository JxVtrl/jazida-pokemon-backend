/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    // Verificar se é SQLite ou PostgreSQL
    const isSQLite = knex.client.config.client === 'sqlite3';
    
    if (isSQLite) {
        // Para SQLite, não podemos alterar constraints facilmente
        // Vamos recriar a tabela com as constraints corretas
        return knex.schema.dropTableIfExists('battle_history')
            .then(() => {
                return knex.schema.createTable('battle_history', function (table) {
                    table.increments('id').primary();
                    table.string('battle_id').unique().notNullable();
                    table.integer('trainer_a_id').unsigned().references('id').inTable('trainers').onDelete('CASCADE');
                    table.integer('trainer_b_id').unsigned().references('id').inTable('trainers').onDelete('CASCADE');
                    table.string('trainer_a_name').notNullable();
                    table.string('trainer_b_name').notNullable();
                    table.integer('pokemon_a_id').unsigned().references('id').inTable('pokemons').onDelete('SET NULL');
                    table.integer('pokemon_b_id').unsigned().references('id').inTable('pokemons').onDelete('SET NULL');
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
                    
                    table.index(['trainer_a_id']);
                    table.index(['trainer_b_id']);
                    table.index(['winner_trainer_id']);
                    table.index(['created_at']);
                });
            });
    } else {
        // Para PostgreSQL, usar a sintaxe original
        return knex.raw(`
            -- Remover constraints de chave estrangeira existentes
            ALTER TABLE battle_history DROP CONSTRAINT IF EXISTS battle_history_pokemon_a_id_foreign;
            ALTER TABLE battle_history DROP CONSTRAINT IF EXISTS battle_history_pokemon_b_id_foreign;
            
            -- Adicionar constraints novamente, mas sem CASCADE DELETE
            ALTER TABLE battle_history 
            ADD CONSTRAINT battle_history_pokemon_a_id_foreign 
            FOREIGN KEY (pokemon_a_id) REFERENCES pokemons(id);
            
            ALTER TABLE battle_history 
            ADD CONSTRAINT battle_history_pokemon_b_id_foreign 
            FOREIGN KEY (pokemon_b_id) REFERENCES pokemons(id);
        `);
    }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    // Verificar se é SQLite ou PostgreSQL
    const isSQLite = knex.client.config.client === 'sqlite3';
    
    if (isSQLite) {
        // Para SQLite, recriar com constraints originais
        return knex.schema.dropTableIfExists('battle_history')
            .then(() => {
                return knex.schema.createTable('battle_history', function (table) {
                    table.increments('id').primary();
                    table.string('battle_id').unique().notNullable();
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
                    
                    table.index(['trainer_a_id']);
                    table.index(['trainer_b_id']);
                    table.index(['winner_trainer_id']);
                    table.index(['created_at']);
                });
            });
    } else {
        // Para PostgreSQL, usar a sintaxe original
        return knex.raw(`
            -- Restaurar constraints originais
            ALTER TABLE battle_history DROP CONSTRAINT IF EXISTS battle_history_pokemon_a_id_foreign;
            ALTER TABLE battle_history DROP CONSTRAINT IF EXISTS battle_history_pokemon_b_id_foreign;
            
            ALTER TABLE battle_history 
            ADD CONSTRAINT battle_history_pokemon_a_id_foreign 
            FOREIGN KEY (pokemon_a_id) REFERENCES pokemons(id) ON DELETE CASCADE;
            
            ALTER TABLE battle_history 
            ADD CONSTRAINT battle_history_pokemon_b_id_foreign 
            FOREIGN KEY (pokemon_b_id) REFERENCES pokemons(id) ON DELETE CASCADE;
        `);
    }
}; 