const express = require('express');
const router = express.Router();
const PokemonController = require('../controllers/PokemonController');

router.post('/', PokemonController.create);

module.exports = router;
