const express = require('express');
const { batalhar } = require('../controllers/BatalhaController');

const router = express.Router();

router.post('/batalhar/:pokemonAId/:pokemonBId', batalhar);

module.exports = router; 