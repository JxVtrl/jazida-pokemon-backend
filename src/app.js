const express = require('express');
const cors = require('cors');
const pokemonsRoutes = require('./routes/pokemons');
const batalhaRoutes = require('./routes/batalha');
const treinadoresRoutes = require('./routes/treinadores');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();

app.use(cors({
    origin: [
        'https://jazida.pokemon.majorssolutions.com.br',
        'https://jazida.api.majorssolutions.com.br',
        'https://jazida-pokemon-frontend.vercel.app',
        'http://localhost:5173'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Rotas da aplicação
app.use('/pokemons', pokemonsRoutes);
app.use('/treinadores', treinadoresRoutes);
app.use('/', batalhaRoutes);

// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = app;
