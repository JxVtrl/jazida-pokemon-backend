const express = require('express');
const bodyParser = require('body-parser');
const pokemonRoutes = require('./routes/pokemons');

const app = express();
app.use(bodyParser.json());

app.use('/pokemons', pokemonRoutes);

module.exports = app;
