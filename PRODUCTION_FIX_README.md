# 🔧 Correção do Banco de Produção

## Problema
O banco de produção ainda está usando a estrutura antiga da tabela `pokemons` com a coluna `treinador` (string) em vez da nova estrutura com `treinador_id` (integer). Isso está causando erros ao tentar criar pokémons.

## Solução

### Opção 1: Usando o script automatizado (Recomendado)

1. **Acesse a VPS** onde está o banco de produção
2. **Navegue até o diretório backend** do projeto
3. **Execute o script de correção**:
   ```bash
   ./deploy-production-fix.sh
   ```

O script irá:
- ✅ Fazer backup da tabela pokemons
- ✅ Executar a migração para adicionar a coluna `treinador_id`
- ✅ Migrar os dados existentes
- ✅ Verificar se tudo foi aplicado corretamente

### Opção 2: Execução manual

Se preferir executar manualmente:

1. **Fazer backup**:
   ```bash
   pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -t pokemons > pokemons_backup.sql
   ```

2. **Executar a migração**:
   ```bash
   npx knex migrate:latest
   ```

3. **Verificar o status**:
   ```bash
   npx knex migrate:status
   ```

### Opção 3: SQL direto

Se precisar executar o SQL diretamente no banco:

```sql
-- Executar o conteúdo do arquivo fix-production-database.sql
-- Este arquivo contém o SQL completo para corrigir a estrutura
```

## Verificação

Após aplicar a correção, verifique se:

1. **A coluna `treinador_id` existe**:
   ```sql
   \d pokemons
   ```

2. **Os dados foram migrados**:
   ```sql
   SELECT COUNT(*) FROM pokemons WHERE treinador_id IS NOT NULL;
   ```

3. **O sistema está funcionando**:
   - Tente criar um novo pokémon
   - Verifique se o histórico de batalhas está funcionando

## Rollback (se necessário)

Se algo der errado, você pode fazer rollback:

```bash
npx knex migrate:rollback
```

E restaurar o backup:
```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME < pokemons_backup.sql
```

## Arquivos Criados

- `fix-production-database.sql` - Script SQL para correção manual
- `deploy-production-fix.sh` - Script automatizado para correção
- `20250701000000_fix_production_pokemons_table.js` - Migração Knex

## Notas Importantes

- ⚠️ **Sempre faça backup** antes de aplicar mudanças no banco de produção
- 🔄 **Teste em ambiente de desenvolvimento** primeiro
- 📊 **Monitore os logs** após aplicar a correção
- 🚀 **Reinicie a aplicação** após aplicar as mudanças

## Suporte

Se encontrar problemas, verifique:
1. Logs da aplicação
2. Status das migrações: `npx knex migrate:status`
3. Estrutura da tabela: `\d pokemons`
4. Dados migrados: `SELECT * FROM pokemons LIMIT 5;` 