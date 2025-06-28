const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Jazida Pokémon Challenge API',
            version: '1.0.0',
            description: `
## 🎮 Sistema de Batalhas Pokémon em Tempo Real

API completa para gerenciamento de treinadores, pokémons e batalhas em tempo real.

### 🚀 Funcionalidades Principais

- **Autenticação JWT**: Sistema seguro de login e registro
- **Gerenciamento de Pokémons**: Criação, listagem e evolução de pokémons
- **Batalhas em Tempo Real**: Sistema de batalhas via WebSocket/Socket.IO
- **Histórico de Batalhas**: Registro completo de todas as batalhas
- **Sistema de Desafios**: Desafios entre treinadores
- **Ranking**: Lista de pokémons ordenados por nível

### 🛠️ Tecnologias

- **Backend**: Node.js, Express, Knex.js, PostgreSQL
- **Tempo Real**: Socket.IO
- **Autenticação**: JWT (JSON Web Tokens)
- **Documentação**: Swagger/OpenAPI 3.0

### 📋 Tipos de Pokémon Suportados

- **Pikachu** ⚡ - Pokémon elétrico
- **Charizard** 🔥 - Pokémon de fogo
- **Mewtwo** 🧬 - Pokémon psíquico

### ⚔️ Sistema de Batalhas

As batalhas são determinadas probabilisticamente baseadas nos níveis dos pokémons:
- **Vencedor**: +1 nível
- **Perdedor**: -1 nível (se chegar a 0, é removido do sistema)

### 🔐 Autenticação

A maioria das rotas requer autenticação via Bearer Token JWT.
Inclua o header: \`Authorization: Bearer <seu_token>\`
            `,
            contact: {
                name: 'Jazida Pokémon Challenge',
                url: 'https://github.com/jazida-pokemon-challenge',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: 'http://localhost:4001',
                description: 'Servidor de Desenvolvimento'
            },
            {
                url: 'https://jazida.api.majorssolutions.com.br',
                description: 'Servidor de Produção'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Token JWT obtido no login'
                }
            },
            schemas: {
                Pokemon: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'ID único do pokémon'
                        },
                        tipo: {
                            type: 'string',
                            enum: ['pikachu', 'charizard', 'mewtwo'],
                            description: 'Tipo do pokémon'
                        },
                        treinador: {
                            type: 'string',
                            description: 'Nome do treinador'
                        },
                        nivel: {
                            type: 'integer',
                            minimum: 1,
                            description: 'Nível atual do pokémon'
                        }
                    },
                    required: ['tipo', 'treinador', 'nivel']
                },
                Trainer: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'ID único do treinador'
                        },
                        nome: {
                            type: 'string',
                            description: 'Nome do treinador'
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Data de criação da conta'
                        }
                    }
                },
                BattleHistory: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'ID interno do registro'
                        },
                        battle_id: {
                            type: 'string',
                            description: 'ID único da batalha'
                        },
                        trainer_a_id: {
                            type: 'integer',
                            description: 'ID do treinador A'
                        },
                        trainer_b_id: {
                            type: 'integer',
                            description: 'ID do treinador B'
                        },
                        trainer_a_name: {
                            type: 'string',
                            description: 'Nome do treinador A'
                        },
                        trainer_b_name: {
                            type: 'string',
                            description: 'Nome do treinador B'
                        },
                        pokemon_a_type: {
                            type: 'string',
                            description: 'Tipo do pokémon A'
                        },
                        pokemon_b_type: {
                            type: 'string',
                            description: 'Tipo do pokémon B'
                        },
                        winner_trainer_id: {
                            type: 'integer',
                            description: 'ID do treinador vencedor'
                        },
                        loser_trainer_id: {
                            type: 'integer',
                            description: 'ID do treinador perdedor'
                        },
                        rounds_played: {
                            type: 'integer',
                            description: 'Número de rounds jogados'
                        },
                        finished_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Data e hora de fim da batalha'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Mensagem de erro'
                        },
                        details: {
                            type: 'string',
                            description: 'Detalhes adicionais do erro (opcional)'
                        }
                    }
                }
            }
        },
        tags: [
            {
                name: 'Autenticação',
                description: 'Endpoints para registro, login e verificação de token'
            },
            {
                name: 'Pokémons',
                description: 'Gerenciamento de pokémons (criar, listar, atualizar, deletar)'
            },
            {
                name: 'Treinadores',
                description: 'Gerenciamento de treinadores e suas informações'
            },
            {
                name: 'Batalhas',
                description: 'Sistema de batalhas em tempo real via Socket.IO'
            },
            {
                name: 'Histórico de Batalhas',
                description: 'Consulta do histórico de batalhas dos treinadores'
            },
            {
                name: 'Desafios',
                description: 'Sistema de desafios entre treinadores'
            }
        ]
    },
    apis: ['./src/routes/*.js'], // inclui os comentários JSDoc nas rotas
};

module.exports = swaggerJsdoc(options);
