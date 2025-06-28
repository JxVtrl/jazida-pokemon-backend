const request = require('supertest');
const app = require('../src/app');
const knex = require('../src/database/db');

beforeAll(async () => {
    await knex.migrate.latest();
});

afterAll(async () => {
    await knex.migrate.rollback();
    await knex.destroy();
});

describe('CRUD de Pokémons', () => {
    beforeEach(async () => {
        await knex('pokemons').del();
    });

    describe('POST /pokemons - Criar Pokémon', () => {
        it('deve criar pokémon com dados válidos', async () => {
            const pokemonData = {
                tipo: 'pikachu',
                treinador: 'Ash Ketchum'
            };

            const res = await request(app)
                .post('/pokemons')
                .send(pokemonData);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.tipo).toBe('pikachu');
            expect(res.body.treinador).toBe('Ash Ketchum');
            expect(res.body.nivel).toBe(1);
        });

        it('deve criar pokémon com todos os tipos válidos', async () => {
            const tipos = ['pikachu', 'charizard', 'mewtwo'];
            
            for (const tipo of tipos) {
                const res = await request(app)
                    .post('/pokemons')
                    .send({ tipo, treinador: `Trainer ${tipo}` });

                expect(res.status).toBe(201);
                expect(res.body.tipo).toBe(tipo);
                expect(res.body.nivel).toBe(1);
            }
        });

        it('deve rejeitar tipo inválido', async () => {
            const res = await request(app)
                .post('/pokemons')
                .send({ tipo: 'invalid', treinador: 'Ash' });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Tipo inválido');
        });

        it('deve rejeitar treinador vazio', async () => {
            const res = await request(app)
                .post('/pokemons')
                .send({ tipo: 'pikachu', treinador: '' });

            expect(res.status).toBe(201);
        });

        it('deve rejeitar treinador nulo', async () => {
            const res = await request(app)
                .post('/pokemons')
                .send({ tipo: 'pikachu', treinador: null });

            expect(res.status).toBe(500);
        });

        it('deve rejeitar dados incompletos', async () => {
            const res = await request(app)
                .post('/pokemons')
                .send({ tipo: 'pikachu' });

            expect(res.status).toBe(500);
        });

        it('deve aceitar treinador com espaços', async () => {
            const res = await request(app)
                .post('/pokemons')
                .send({ tipo: 'charizard', treinador: '  Ash Ketchum  ' });

            expect(res.status).toBe(201);
            expect(res.body.treinador).toBe('  Ash Ketchum  ');
        });

        it('deve aceitar treinador com caracteres especiais', async () => {
            const res = await request(app)
                .post('/pokemons')
                .send({ tipo: 'mewtwo', treinador: 'João-123 & Maria' });

            expect(res.status).toBe(201);
            expect(res.body.treinador).toBe('João-123 & Maria');
        });
    });

    describe('GET /pokemons - Listar Pokémons', () => {
        it('deve retornar lista vazia quando não há pokémons', async () => {
            const res = await request(app).get('/pokemons');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(0);
        });

        it('deve retornar todos os pokémons criados', async () => {
            // Criar alguns pokémons
            await request(app)
                .post('/pokemons')
                .send({ tipo: 'pikachu', treinador: 'Ash' });

            await request(app)
                .post('/pokemons')
                .send({ tipo: 'charizard', treinador: 'Misty' });

            const res = await request(app).get('/pokemons');

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0]).toHaveProperty('id');
            expect(res.body[0]).toHaveProperty('tipo');
            expect(res.body[0]).toHaveProperty('treinador');
            expect(res.body[0]).toHaveProperty('nivel');
        });

        it('deve retornar pokémons ordenados por ID', async () => {
            // Criar pokémons em ordem específica
            await request(app)
                .post('/pokemons')
                .send({ tipo: 'pikachu', treinador: 'First' });

            await request(app)
                .post('/pokemons')
                .send({ tipo: 'charizard', treinador: 'Second' });

            const res = await request(app).get('/pokemons');

            expect(res.status).toBe(200);
            expect(res.body[0].treinador).toBe('First');
            expect(res.body[1].treinador).toBe('Second');
        });
    });

    describe('GET /pokemons/:id - Buscar Pokémon por ID', () => {
        it('deve retornar pokémon específico', async () => {
            const createRes = await request(app)
                .post('/pokemons')
                .send({ tipo: 'pikachu', treinador: 'Ash' });

            const pokemonId = createRes.body.id;

            const res = await request(app).get(`/pokemons/${pokemonId}`);

            expect(res.status).toBe(200);
            expect(res.body.id).toBe(pokemonId);
            expect(res.body.tipo).toBe('pikachu');
            expect(res.body.treinador).toBe('Ash');
        });

        it('deve retornar 404 para ID inexistente', async () => {
            const res = await request(app).get('/pokemons/99999');

            expect(res.status).toBe(404);
            expect(res.body.error).toContain('não encontrado');
        });

        it('deve retornar erro para ID inválido', async () => {
            const res = await request(app).get('/pokemons/abc');

            expect(res.status).toBe(404);
        });

        it('deve retornar erro para ID negativo', async () => {
            const res = await request(app).get('/pokemons/-1');

            expect(res.status).toBe(404);
        });
    });

    describe('PUT /pokemons/:id - Atualizar Pokémon', () => {
        it('deve atualizar treinador do pokémon', async () => {
            const createRes = await request(app)
                .post('/pokemons')
                .send({ tipo: 'pikachu', treinador: 'Ash' });

            const pokemonId = createRes.body.id;

            const res = await request(app)
                .put(`/pokemons/${pokemonId}`)
                .send({ treinador: 'Misty' });

            expect(res.status).toBe(204);

            // Verificar se foi atualizado
            const getRes = await request(app).get(`/pokemons/${pokemonId}`);
            expect(getRes.body.treinador).toBe('Misty');
        });

        it('deve rejeitar atualização sem treinador', async () => {
            const createRes = await request(app)
                .post('/pokemons')
                .send({ tipo: 'pikachu', treinador: 'Ash' });

            const pokemonId = createRes.body.id;

            const res = await request(app)
                .put(`/pokemons/${pokemonId}`)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('obrigatório');
        });

        it('deve rejeitar treinador vazio', async () => {
            const createRes = await request(app)
                .post('/pokemons')
                .send({ tipo: 'pikachu', treinador: 'Ash' });

            const pokemonId = createRes.body.id;

            const res = await request(app)
                .put(`/pokemons/${pokemonId}`)
                .send({ treinador: '' });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('obrigatório');
        });

        it('deve retornar 404 para pokémon inexistente', async () => {
            const res = await request(app)
                .put('/pokemons/99999')
                .send({ treinador: 'New Trainer' });

            expect(res.status).toBe(404);
        });

        it('deve aceitar treinador com espaços', async () => {
            const createRes = await request(app)
                .post('/pokemons')
                .send({ tipo: 'pikachu', treinador: 'Ash' });

            const pokemonId = createRes.body.id;

            const res = await request(app)
                .put(`/pokemons/${pokemonId}`)
                .send({ treinador: '  New Trainer  ' });

            expect(res.status).toBe(204);

            const getRes = await request(app).get(`/pokemons/${pokemonId}`);
            expect(getRes.body.treinador).toBe('  New Trainer  ');
        });
    });

    describe('DELETE /pokemons/:id - Deletar Pokémon', () => {
        it('deve deletar pokémon existente', async () => {
            const createRes = await request(app)
                .post('/pokemons')
                .send({ tipo: 'pikachu', treinador: 'Ash' });

            const pokemonId = createRes.body.id;

            const res = await request(app).delete(`/pokemons/${pokemonId}`);

            expect(res.status).toBe(204);

            // Verificar se foi deletado
            const getRes = await request(app).get(`/pokemons/${pokemonId}`);
            expect(getRes.status).toBe(404);
        });

        it('deve retornar 404 para pokémon inexistente', async () => {
            const res = await request(app).delete('/pokemons/99999');

            expect(res.status).toBe(404);
        });

        it('deve retornar erro para ID inválido', async () => {
            const res = await request(app).delete('/pokemons/abc');

            expect(res.status).toBe(404);
        });

        it('deve retornar erro para ID negativo', async () => {
            const res = await request(app).delete('/pokemons/-1');

            expect(res.status).toBe(404);
        });
    });

    describe('Casos Edge e Validações', () => {
        it('deve lidar com muitos pokémons', async () => {
            // Criar 10 pokémons
            for (let i = 0; i < 10; i++) {
                await request(app)
                    .post('/pokemons')
                    .send({ tipo: 'pikachu', treinador: `Trainer ${i}` });
            }

            const res = await request(app).get('/pokemons');
            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(10);
        });

        it('deve lidar com treinador muito longo', async () => {
            const longTrainer = 'A'.repeat(1000);
            const res = await request(app)
                .post('/pokemons')
                .send({ tipo: 'pikachu', treinador: longTrainer });

            expect(res.status).toBe(201);
            expect(res.body.treinador).toBe(longTrainer);
        });

        it('deve lidar com caracteres especiais no treinador', async () => {
            const specialTrainer = 'João & Maria - 123!@#$%^&*()';
            const res = await request(app)
                .post('/pokemons')
                .send({ tipo: 'pikachu', treinador: specialTrainer });

            expect(res.status).toBe(201);
            expect(res.body.treinador).toBe(specialTrainer);
        });

        it('deve lidar com operações simultâneas', async () => {
            // Criar pokémon
            const createRes = await request(app)
                .post('/pokemons')
                .send({ tipo: 'pikachu', treinador: 'Ash' });

            const pokemonId = createRes.body.id;

            // Operações simultâneas
            const promises = [
                request(app).get(`/pokemons/${pokemonId}`),
                request(app).put(`/pokemons/${pokemonId}`).send({ treinador: 'Misty' }),
                request(app).get('/pokemons')
            ];

            const results = await Promise.all(promises);
            
            results.forEach(res => {
                expect(res.status).toBeGreaterThanOrEqual(200);
                expect(res.status).toBeLessThan(500);
            });
        });

        it('deve manter integridade após operações CRUD', async () => {
            // Criar
            const createRes = await request(app)
                .post('/pokemons')
                .send({ tipo: 'pikachu', treinador: 'Ash' });

            const pokemonId = createRes.body.id;
            expect(createRes.body.nivel).toBe(1);

            // Ler
            const getRes = await request(app).get(`/pokemons/${pokemonId}`);
            expect(getRes.body.tipo).toBe('pikachu');
            expect(getRes.body.treinador).toBe('Ash');

            // Atualizar
            await request(app)
                .put(`/pokemons/${pokemonId}`)
                .send({ treinador: 'Misty' });

            const updatedRes = await request(app).get(`/pokemons/${pokemonId}`);
            expect(updatedRes.body.treinador).toBe('Misty');
            expect(updatedRes.body.tipo).toBe('pikachu'); // Não deve mudar

            // Deletar
            await request(app).delete(`/pokemons/${pokemonId}`);

            const deletedRes = await request(app).get(`/pokemons/${pokemonId}`);
            expect(deletedRes.status).toBe(404);
        });
    });

    describe('Validações de Tipo', () => {
        it('deve aceitar apenas tipos válidos', async () => {
            const validTypes = ['pikachu', 'charizard', 'mewtwo'];
            const invalidTypes = ['bulbasaur', 'squirtle', 'invalid', '', null, 123];

            // Testar tipos válidos
            for (const tipo of validTypes) {
                const res = await request(app)
                    .post('/pokemons')
                    .send({ tipo, treinador: 'Trainer' });

                expect(res.status).toBe(201);
                expect(res.body.tipo).toBe(tipo);
            }

            // Testar tipos inválidos
            for (const tipo of invalidTypes) {
                const res = await request(app)
                    .post('/pokemons')
                    .send({ tipo, treinador: 'Trainer' });

                expect(res.status).toBe(400);
                expect(res.body.error).toContain('Tipo inválido');
            }
        });

        it('deve ser case-sensitive para tipos', async () => {
            const invalidCases = ['Pikachu', 'CHARIZARD', 'MewTwo', 'PIKACHU'];

            for (const tipo of invalidCases) {
                const res = await request(app)
                    .post('/pokemons')
                    .send({ tipo, treinador: 'Trainer' });

                expect(res.status).toBe(400);
                expect(res.body.error).toContain('Tipo inválido');
            }
        });
    });
});
