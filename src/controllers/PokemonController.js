const connection = require('../database/db');

const tiposPermitidos = ['pikachu', 'charizard', 'mewtwo'];

module.exports = {
    async create(req, res) {
        const { tipo, treinador } = req.body;

        if (!tiposPermitidos.includes(tipo)) {
            return res.status(400).json({ error: 'Tipo inválido de pokémon' });
        }

        const [id] = await connection('pokemons').insert({ tipo, treinador, nivel: 1 });

        return res.status(201).json({ id, tipo, treinador, nivel: 1 });
    },
};
