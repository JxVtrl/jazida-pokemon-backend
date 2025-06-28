/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    // Verificar se é SQLite ou PostgreSQL
    const isSQLite = knex.client.config.client === 'sqlite3';
    
    if (isSQLite) {
        // Para SQLite, usar ALTER TABLE simples
        return knex.schema.alterTable('trainers', function (table) {
            table.string('avatar_url', 255);
            table.string('status_message', 200);
            table.integer('total_battles').defaultTo(0);
            table.integer('wins').defaultTo(0);
            table.integer('losses').defaultTo(0);
            table.integer('level').defaultTo(1);
            table.integer('experience').defaultTo(0);
        });
    } else {
        // Para PostgreSQL, usar a sintaxe original
        return knex.raw(`
            DO $$ 
            BEGIN
                -- Adicionar avatar_url se não existir
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainers' AND column_name = 'avatar_url') THEN
                    ALTER TABLE trainers ADD COLUMN avatar_url VARCHAR(255);
                END IF;
                
                -- Adicionar status_message se não existir
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainers' AND column_name = 'status_message') THEN
                    ALTER TABLE trainers ADD COLUMN status_message VARCHAR(200);
                END IF;
                
                -- Adicionar total_battles se não existir
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainers' AND column_name = 'total_battles') THEN
                    ALTER TABLE trainers ADD COLUMN total_battles INTEGER DEFAULT 0;
                END IF;
                
                -- Adicionar wins se não existir
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainers' AND column_name = 'wins') THEN
                    ALTER TABLE trainers ADD COLUMN wins INTEGER DEFAULT 0;
                END IF;
                
                -- Adicionar losses se não existir
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainers' AND column_name = 'losses') THEN
                    ALTER TABLE trainers ADD COLUMN losses INTEGER DEFAULT 0;
                END IF;
                
                -- Adicionar level se não existir
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainers' AND column_name = 'level') THEN
                    ALTER TABLE trainers ADD COLUMN level INTEGER DEFAULT 1;
                END IF;
                
                -- Adicionar experience se não existir
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainers' AND column_name = 'experience') THEN
                    ALTER TABLE trainers ADD COLUMN experience INTEGER DEFAULT 0;
                END IF;
            END $$;
        `);
    }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.alterTable('trainers', function (table) {
        table.dropColumn('avatar_url');
        table.dropColumn('status_message');
        table.dropColumn('total_battles');
        table.dropColumn('wins');
        table.dropColumn('losses');
        table.dropColumn('level');
        table.dropColumn('experience');
    });
}; 