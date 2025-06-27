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

describe('Pokémons CRUD', () => {
    let pokemonId;
    let authToken;

    beforeAll(async () => {
        // Criar um treinador para autenticação
        const registerRes = await request(app)
            .post('/auth/register')
            .send({ nome: 'TestTrainer', senha: '123456' });

        authToken = registerRes.body.token;
    });

    it('deve criar um novo pokémon válido', async () => {
        const res = await request(app)
            .post('/pokemons')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ tipo: 'pikachu', treinador: 'Ash' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.nivel).toBe(1);

        pokemonId = res.body.id;
    });

    it('deve retornar erro se tipo for inválido', async () => {
        const res = await request(app)
            .post('/pokemons')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ tipo: 'bulbasaur', treinador: 'Ash' });

        expect(res.status).toBe(400);
    });

    it('deve listar pokémons', async () => {
        const res = await request(app)
            .get('/pokemons')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);
    });

    it('deve buscar pokémon por id', async () => {
        const res = await request(app)
            .get(`/pokemons/${pokemonId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(pokemonId);
    });

    it('deve alterar o treinador', async () => {
        const res = await request(app)
            .put(`/pokemons/${pokemonId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ treinador: 'Misty' });

        expect(res.status).toBe(204);
    });

    it('deve retornar erro se treinador não for fornecido', async () => {
        const res = await request(app)
            .put(`/pokemons/${pokemonId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("O campo 'treinador' é obrigatório.");
    });

    it('deve retornar erro se pokémon não existir', async () => {
        const res = await request(app)
            .put('/pokemons/99999')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ treinador: 'Misty' });

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Pokémon não encontrado.');
    });

    it('deve deletar o pokémon', async () => {
        const res = await request(app)
            .delete(`/pokemons/${pokemonId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(204);
    });

    it('deve listar apenas os pokémons do treinador autenticado', async () => {
        // Criar pokémon para outro treinador
        await request(app)
            .post('/pokemons')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ tipo: 'charizard', treinador: 'OutroTreinador' });

        // Criar pokémon para o treinador autenticado
        await request(app)
            .post('/pokemons')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ tipo: 'mewtwo', treinador: 'TestTrainer' });

        // Buscar pokémons do treinador autenticado
        const res = await request(app)
            .get('/me/pokemons')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);

        // Verificar que todos os pokémons retornados pertencem ao treinador autenticado
        res.body.forEach(pokemon => {
            expect(pokemon.treinador).toBe('TestTrainer');
        });
    });
});
