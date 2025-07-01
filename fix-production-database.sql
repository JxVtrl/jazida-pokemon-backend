-- Script para corrigir a estrutura da tabela pokemons no banco de produção
-- Este script deve ser executado na VPS onde está o banco de produção

-- 1. Primeiro, vamos verificar se a coluna treinador_id já existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pokemons' AND column_name = 'treinador_id') THEN
        -- Adicionar a nova coluna treinador_id
        ALTER TABLE pokemons ADD COLUMN treinador_id INTEGER;
        
        -- Atualizar os dados existentes baseado no nome do treinador
        UPDATE pokemons 
        SET treinador_id = trainers.id 
        FROM trainers 
        WHERE pokemons.treinador = trainers.nome;
        
        -- Tornar a coluna NOT NULL após popular os dados
        ALTER TABLE pokemons ALTER COLUMN treinador_id SET NOT NULL;
        
        -- Adicionar foreign key constraint
        ALTER TABLE pokemons ADD CONSTRAINT pokemons_treinador_id_foreign 
        FOREIGN KEY (treinador_id) REFERENCES trainers(id) ON DELETE CASCADE;
        
        -- Criar índice para melhor performance
        CREATE INDEX idx_pokemons_treinador_id ON pokemons(treinador_id);
        
        RAISE NOTICE 'Coluna treinador_id adicionada e dados migrados com sucesso';
    ELSE
        RAISE NOTICE 'Coluna treinador_id já existe';
    END IF;
END $$;

-- 2. Remover a coluna antiga treinador (opcional - pode ser feito depois de confirmar que tudo está funcionando)
-- DO $$ 
-- BEGIN
--     IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pokemons' AND column_name = 'treinador') THEN
--         ALTER TABLE pokemons DROP COLUMN treinador;
--         RAISE NOTICE 'Coluna treinador removida com sucesso';
--     ELSE
--         RAISE NOTICE 'Coluna treinador não existe';
--     END IF;
-- END $$;

-- 3. Verificar o resultado
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pokemons' 
ORDER BY ordinal_position;

-- 4. Verificar se há pokémons sem treinador_id
SELECT COUNT(*) as pokemons_sem_treinador_id 
FROM pokemons 
WHERE treinador_id IS NULL;

-- 5. Verificar se há pokémons com treinador_id
SELECT COUNT(*) as pokemons_com_treinador_id 
FROM pokemons 
WHERE treinador_id IS NOT NULL; 