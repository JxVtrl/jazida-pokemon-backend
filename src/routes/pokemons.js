const express = require('express');
const {
    createPokemon,
    listPokemons,
    getPokemonById,
    updatePokemon,
    deletePokemon,
} = require('../controllers/PokemonController');

const router = express.Router();

router.post('/', createPokemon);
router.get('/', listPokemons);
router.get('/:id', getPokemonById);
router.put('/:id', updatePokemon);
router.delete('/:id', deletePokemon);

module.exports = router;
