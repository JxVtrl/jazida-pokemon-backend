const express = require('express');
const cors = require('cors');
const pokemonsRoutes = require('./routes/pokemons');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/pokemons', pokemonsRoutes);

module.exports = app;
