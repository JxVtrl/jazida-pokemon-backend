# backend/Dockerfile

FROM node:18

WORKDIR /app

COPY package*.json ./
COPY knexfile.js ./knexfile.js
RUN npm install

COPY . .

# Criar pasta de uploads e definir permissões
RUN mkdir -p /app/uploads/avatars && \
    chmod -R 755 /app/uploads && \
    chmod +x /app/init.sh

EXPOSE 4001

# Script de inicialização que aguarda o banco estar pronto
CMD ["sh", "-c", "echo 'Aguardando banco de dados...' && sleep 10 && ./init.sh"]
