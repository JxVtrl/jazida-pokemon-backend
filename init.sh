#!/bin/bash

echo "🚀 Iniciando configuração do backend..."

# Criar pastas de upload se não existirem
echo "📁 Criando pastas de upload..."
mkdir -p uploads/avatars
chmod -R 755 uploads

# Verificar se as pastas foram criadas
if [ -d "uploads/avatars" ]; then
    echo "✅ Pasta uploads/avatars criada com sucesso"
else
    echo "❌ Erro ao criar pasta uploads/avatars"
    exit 1
fi

# Testar configuração de upload
echo "🧪 Testando configuração de upload..."
node test-upload.js

# Executar migrações
echo "🗄️ Executando migrações..."
npm run migrate

# Iniciar o servidor
echo "🌐 Iniciando servidor..."
npm run dev 