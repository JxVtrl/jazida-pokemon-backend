const express = require('express');
const router = express.Router();

const {
    createPokemon,
    listPokemons,
    getPokemonById,
    updatePokemon,
    deletePokemon,
} = require('../controllers/PokemonController');

// CRUD Pokemons
router.post('/', createPokemon);
router.get('/', listPokemons);
router.get('/:id', getPokemonById);
router.put('/:id', updatePokemon);
router.delete('/:id', deletePokemon);

module.exports = router;
