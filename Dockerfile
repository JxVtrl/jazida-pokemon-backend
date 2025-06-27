# backend/Dockerfile

FROM node:18

WORKDIR /app

COPY package*.json ./
COPY knexfile.js ./knexfile.js
RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]
