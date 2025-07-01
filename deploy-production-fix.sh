#!/bin/bash

# Script para corrigir a estrutura da tabela pokemons no banco de produção
# Este script deve ser executado na VPS onde está o banco de produção

echo "🔧 Iniciando correção da estrutura da tabela pokemons no banco de produção..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório backend do projeto"
    exit 1
fi

# Verificar se as variáveis de ambiente estão configuradas
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
    echo "❌ Erro: Variáveis de ambiente do banco não configuradas"
    echo "Certifique-se de que DB_HOST, DB_USER, DB_NAME estão definidas"
    exit 1
fi

echo "📊 Configuração do banco:"
echo "   - Host: $DB_HOST"
echo "   - Usuário: $DB_USER"
echo "   - Banco: $DB_NAME"

# Fazer backup antes de aplicar as mudanças
echo "💾 Fazendo backup da tabela pokemons..."
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -t pokemons > pokemons_backup_$(date +%Y%m%d_%H%M%S).sql

if [ $? -eq 0 ]; then
    echo "✅ Backup criado com sucesso"
else
    echo "❌ Erro ao criar backup"
    exit 1
fi

# Executar a migração
echo "🚀 Executando migração para corrigir estrutura da tabela pokemons..."
npx knex migrate:latest

if [ $? -eq 0 ]; then
    echo "✅ Migração executada com sucesso"
else
    echo "❌ Erro ao executar migração"
    echo "💡 Você pode tentar executar manualmente: npx knex migrate:latest"
    exit 1
fi

# Verificar se a correção foi aplicada
echo "🔍 Verificando se a correção foi aplicada..."
npx knex migrate:status

echo "✅ Correção da estrutura da tabela pokemons concluída!"
echo "🎉 O sistema deve estar funcionando corretamente agora" 