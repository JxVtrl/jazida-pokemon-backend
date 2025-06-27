# backend/Dockerfile

FROM node:18

WORKDIR /app

COPY package*.json ./
COPY knexfile.js ./knexfile.js
RUN npm install

COPY . .

EXPOSE 4001

CMD ["sh", "-c", "npx knex migrate:latest --env production && npx knex seed:run --env production && npm run dev"]
