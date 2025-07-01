/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    // Só executa em PostgreSQL
    if (knex.client.config.client !== 'pg' && knex.client.config.client !== 'postgres') {
        // Ignora em SQLite e outros bancos
        return Promise.resolve();
    }
    return knex.raw(`
        -- Script para corrigir a estrutura da tabela pokemons no banco de produção
        DO $$ 
        DECLARE
            null_count INTEGER;
        BEGIN
            -- 1. Adicionar coluna treinador_id se não existir
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pokemons' AND column_name = 'treinador_id') THEN
                -- Adicionar a nova coluna treinador_id (permitindo NULL inicialmente)
                ALTER TABLE pokemons ADD COLUMN treinador_id INTEGER;
                
                -- Atualizar os dados existentes baseado no nome do treinador
                UPDATE pokemons 
                SET treinador_id = trainers.id 
                FROM trainers 
                WHERE pokemons.treinador = trainers.nome;
                
                -- Verificar se há valores NULL
                SELECT COUNT(*) INTO null_count FROM pokemons WHERE treinador_id IS NULL;
                
                IF null_count > 0 THEN
                    RAISE NOTICE 'Encontrados % pokémons sem treinador_id correspondente. Removendo...', null_count;
                    DELETE FROM pokemons WHERE treinador_id IS NULL;
                END IF;
                
                -- Agora podemos tornar a coluna NOT NULL
                ALTER TABLE pokemons ALTER COLUMN treinador_id SET NOT NULL;
                
                -- Adicionar foreign key constraint se não existir
                IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pokemons_treinador_id_foreign') THEN
                    ALTER TABLE pokemons ADD CONSTRAINT pokemons_treinador_id_foreign 
                    FOREIGN KEY (treinador_id) REFERENCES trainers(id) ON DELETE CASCADE;
                END IF;
                
                -- Criar índice para melhor performance se não existir
                IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pokemons_treinador_id') THEN
                    CREATE INDEX idx_pokemons_treinador_id ON pokemons(treinador_id);
                END IF;
                
                RAISE NOTICE 'Coluna treinador_id adicionada e dados migrados com sucesso';
            ELSE
                RAISE NOTICE 'Coluna treinador_id já existe';
            END IF;
        END $$;
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    // Só executa em PostgreSQL
    if (knex.client.config.client !== 'pg' && knex.client.config.client !== 'postgres') {
        return Promise.resolve();
    }
    return knex.raw(`
        DO $$ 
        BEGIN
            -- Remover foreign key constraint se existir
            IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pokemons_treinador_id_foreign') THEN
                ALTER TABLE pokemons DROP CONSTRAINT pokemons_treinador_id_foreign;
            END IF;
            
            -- Remover índice se existir
            IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pokemons_treinador_id') THEN
                DROP INDEX idx_pokemons_treinador_id;
            END IF;
            
            -- Remover coluna treinador_id se existir
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pokemons' AND column_name = 'treinador_id') THEN
                ALTER TABLE pokemons DROP COLUMN treinador_id;
                RAISE NOTICE 'Coluna treinador_id removida';
            END IF;
        END $$;
    `);
}; 