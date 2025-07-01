/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.alterTable('pokemons', function (table) {
        // Remover a coluna antiga 'treinador' se existir
        if (knex.client.config.client === 'sqlite3') {
            // Para SQLite, não podemos remover colunas facilmente
            // Vamos apenas garantir que a nova coluna existe
            return;
        } else {
            // Para PostgreSQL, podemos tentar remover a coluna antiga
            return knex.raw(`
                DO $$ 
                BEGIN
                    -- Remover coluna treinador se existir
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pokemons' AND column_name = 'treinador') THEN
                        ALTER TABLE pokemons DROP COLUMN treinador;
                    END IF;
                END $$;
            `);
        }
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.alterTable('pokemons', function (table) {
        // Adicionar de volta a coluna treinador se necessário
        if (knex.client.config.client === 'sqlite3') {
            table.string('treinador');
        } else {
            return knex.raw(`
                DO $$ 
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pokemons' AND column_name = 'treinador') THEN
                        ALTER TABLE pokemons ADD COLUMN treinador VARCHAR(255);
                    END IF;
                END $$;
            `);
        }
    });
}; 