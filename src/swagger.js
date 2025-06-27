const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Pokémon Battle API',
            version: '1.0.0',
            description: 'API para batalhas e gerenciamento de pokémons.',
        },
        servers: [{ url: 'http://localhost:3001' }],
    },
    apis: ['./src/routes/*.js'], // inclui os comentários JSDoc nas rotas
};

module.exports = swaggerJsdoc(options);
