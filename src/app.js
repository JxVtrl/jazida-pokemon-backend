const express = require('express');
const cors = require('cors');
const pokemonsRoutes = require('./routes/pokemons');
const batalhaRoutes = require('./routes/batalha');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/pokemons', pokemonsRoutes);
app.use('/', batalhaRoutes);

module.exports = app;
