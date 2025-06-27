# backend/Dockerfile

FROM node:18

WORKDIR /app

COPY package*.json ./
COPY knexfile.js ./knexfile.js
RUN npm install

COPY . .

EXPOSE 4001

# Script de inicialização que aguarda o banco estar pronto
CMD ["sh", "-c", "echo 'Aguardando banco de dados...' && sleep 10 && npm run setup && npm run dev"]
