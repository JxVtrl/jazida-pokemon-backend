const express = require('express');
const cors = require('cors');
const pokemonsRoutes = require('./routes/pokemons');
const batalhaRoutes = require('./routes/batalha');
const treinadoresRoutes = require('./routes/treinadores');
const authRoutes = require('./routes/auth');
const { requireAuth } = require('./middleware/auth');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const battleHistoryRoutes = require('./routes/battle-history');
const profileRoutes = require('./routes/profile');
const { serveStaticFiles } = require('./middleware/upload');
const { listarMeusPokemons, listPokemons, createPokemon, getPokemonById, updatePokemon, deletePokemon } = require('./controllers/PokemonController');
const { batalharPokemons } = require('./controllers/BattleController');

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

// Servir arquivos estáticos (uploads)
serveStaticFiles(app);

// Rotas públicas (sem autenticação)
app.use('/auth', authRoutes);

// Rota pública para listar todos os pokémons (para visualização) - APENAS GET
app.get('/pokemons', listPokemons);

// Rotas protegidas (com autenticação)
// Rotas de pokémons que precisam de autenticação (exceto GET que já está acima)
app.post('/pokemons', requireAuth, createPokemon);
app.get('/pokemons/:id', requireAuth, getPokemonById);
app.put('/pokemons/:id', requireAuth, updatePokemon);
app.delete('/pokemons/:id', requireAuth, deletePokemon);

app.use('/treinadores', requireAuth, treinadoresRoutes);
app.use('/batalha', requireAuth, batalhaRoutes);
app.use('/battle-history', requireAuth, battleHistoryRoutes);
app.use('/profile', requireAuth, profileRoutes);

// Rota específica para pokémons do usuário autenticado
app.get('/me/pokemons', requireAuth, listarMeusPokemons);

// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = app;
