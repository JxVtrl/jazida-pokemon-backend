const express = require('express');
const cors = require('cors');
const pokemonsRoutes = require('./routes/pokemons');
const batalhaRoutes = require('./routes/batalha');
const treinadoresRoutes = require('./routes/treinadores');
const battleRoutes = require('./routes/battle');
const authRoutes = require('./routes/auth');
const { requireAuth } = require('./middleware/auth');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const desafiarRoutes = require('./routes/desafiar');
const { listarMeusPokemons } = require('./controllers/PokemonController');

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

// Rotas públicas (sem autenticação)
app.use('/auth', authRoutes);

// Rota específica para pokémons do usuário autenticado
app.get('/me/pokemons', requireAuth, listarMeusPokemons);

// Rotas protegidas (com autenticação)
app.use('/pokemons', requireAuth, pokemonsRoutes);
app.use('/treinadores', requireAuth, treinadoresRoutes);
app.use('/batalhar', requireAuth, battleRoutes);
app.use('/', requireAuth, batalhaRoutes);
app.use('/desafiar', desafiarRoutes);

// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = app;
