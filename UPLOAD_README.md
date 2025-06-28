# Sistema de Upload de Avatares

## Visão Geral

O sistema de upload de avatares permite que os treinadores enviem suas próprias imagens de perfil. As imagens são processadas, comprimidas e convertidas para o formato WebP para otimização.

## Funcionalidades

- ✅ Upload de imagens (JPG, PNG, GIF, etc.)
- ✅ Conversão automática para WebP
- ✅ Compressão inteligente (máximo 200KB)
- ✅ Redimensionamento para 512x512px
- ✅ Exclusão automática do avatar anterior
- ✅ Persistência em volume Docker
- ✅ Headers de cache otimizados

## Estrutura de Arquivos

```
backend/
├── uploads/
│   └── avatars/          # Avatares dos treinadores
├── src/
│   ├── middleware/
│   │   └── upload.js     # Middleware de processamento
│   └── controllers/
│       └── ProfileController.js  # Controller de upload
├── init.sh               # Script de inicialização
└── test-upload.js        # Teste de configuração
```

## Configuração Docker

### Volume Persistente

O `docker-compose.yml` inclui um volume persistente para os uploads:

```yaml
volumes:
  - uploads_data:/app/uploads
```

### Script de Inicialização

O `init.sh` garante que:
1. Pastas de upload sejam criadas
2. Permissões sejam configuradas
3. Teste de upload seja executado
4. Migrações sejam aplicadas
5. Servidor seja iniciado

## API Endpoints

### POST /profile/avatar

**Descrição:** Faz upload de um novo avatar

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:**
```
avatar: <arquivo de imagem>
```

**Resposta de Sucesso:**
```json
{
  "message": "Avatar atualizado com sucesso!",
  "trainer": {
    "id": 1,
    "nome": "Treinador",
    "avatar_url": "/uploads/avatars/1234567890_abc123.webp",
    "status_message": "Mensagem de status"
  }
}
```

## Processamento de Imagem

### Etapas:

1. **Validação:** Verifica se é uma imagem válida
2. **Redimensionamento:** Redimensiona para 512x512px mantendo proporção
3. **Conversão:** Converte para WebP
4. **Compressão:** Comprime até 200KB máximo
5. **Salvamento:** Salva com nome único
6. **Limpeza:** Remove avatar anterior

### Logs de Debug

O sistema gera logs detalhados:

```
🖼️ [AVATAR] Iniciando upload para treinador ID: 1
🖼️ [AVATAR] Arquivo recebido: foto.jpg (1024000 bytes)
🖼️ [UPLOAD] Processando imagem: foto.jpg
🖼️ [UPLOAD] Tamanho original: 1024000 bytes
🖼️ [UPLOAD] Tamanho após compressão: 156789 bytes
🖼️ [UPLOAD] Redução: 84.7%
✅ [UPLOAD] Imagem salva com sucesso: 156789 bytes
✅ [AVATAR] Imagem processada: /uploads/avatars/1234567890_abc123.webp
✅ [AVATAR] Avatar atualizado no banco
```

## Troubleshooting

### Problema: Upload não funciona

**Solução:**
1. Verificar se a pasta `uploads/avatars` existe
2. Verificar permissões (755)
3. Executar `node test-upload.js`
4. Verificar logs do container

### Problema: Imagem não aparece

**Solução:**
1. Verificar se o arquivo foi salvo em `uploads/avatars/`
2. Verificar se a URL está correta no banco
3. Verificar se o middleware `serveStaticFiles` está ativo

### Problema: Erro de permissão

**Solução:**
```bash
# No container
chmod -R 755 /app/uploads
chown -R node:node /app/uploads
```

## Testes

Execute o teste de upload:

```bash
node test-upload.js
```

Este teste verifica:
- Criação de pastas
- Permissões
- Capacidade de escrita
- Capacidade de leitura

## Monitoramento

### Logs Importantes

- `🖼️ [AVATAR]` - Início do upload
- `🖼️ [UPLOAD]` - Processamento da imagem
- `✅ [UPLOAD]` - Sucesso no processamento
- `❌ [UPLOAD]` - Erro no processamento
- `🗑️ [UPLOAD]` - Exclusão de arquivo

### Métricas

- Tamanho original vs final
- Taxa de compressão
- Tempo de processamento
- Taxa de sucesso/erro 