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

describe('Treinadores', () => {
    let authToken;

    beforeAll(async () => {
        // Criar um treinador para autenticação
        const registerRes = await request(app)
            .post('/auth/register')
            .send({ nome: 'TrainerTest', senha: '123456' });

        authToken = registerRes.body.token;
    });

    beforeEach(async () => {
        // Limpar pokémons antes de cada teste
        await knex('pokemons').del();
        // Inserir pokémons de teste
        await knex('pokemons').insert([
            { tipo: 'pikachu', treinador: 'Ash', nivel: 1 },
            { tipo: 'charizard', treinador: 'Ash', nivel: 2 },
            { tipo: 'bulbasaur', treinador: 'Misty', nivel: 1 },
            { tipo: 'squirtle', treinador: 'Brock', nivel: 1 }
        ]);
    });

    it('deve listar todos os treinadores únicos', async () => {
        const res = await request(app)
            .get('/treinadores')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('treinadores');
        expect(res.body).toHaveProperty('total');
        expect(res.body.treinadores).toContain('Ash');
        expect(res.body.treinadores).toContain('Misty');
        expect(res.body.treinadores).toContain('Brock');
        expect(res.body.total).toBe(3);
    });

    it('deve listar pokémons de um treinador específico', async () => {
        const res = await request(app)
            .get('/treinadores/Ash/pokemons')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('treinador', 'Ash');
        expect(res.body).toHaveProperty('pokemons');
        expect(res.body).toHaveProperty('total', 2);
        expect(res.body.pokemons).toHaveLength(2);
        expect(res.body.pokemons[0]).toHaveProperty('tipo');
        expect(res.body.pokemons[0]).toHaveProperty('nivel');
    });

    it('deve retornar lista vazia para treinador inexistente', async () => {
        const res = await request(app)
            .get('/treinadores/TreinadorInexistente/pokemons')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('treinador', 'TreinadorInexistente');
        expect(res.body).toHaveProperty('pokemons');
        expect(res.body).toHaveProperty('total', 0);
        expect(res.body.pokemons).toHaveLength(0);
    });
}); 