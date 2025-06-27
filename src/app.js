const express = require('express');
const cors = require('cors');
const pokemonsRoutes = require('./routes/pokemons');
const batalhaRoutes = require('./routes/batalha');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/', batalhaRoutes);
app.use('/pokemons', pokemonsRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = app;
