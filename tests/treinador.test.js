const request = require('supertest');
const app = require('../src/app');
const knex = require('../src/database/db');

beforeAll(async () => {
    await knex.migrate.latest();

    // Criar alguns pokémons para teste
    await knex('pokemons').insert([
        { tipo: 'pikachu', treinador: 'Ash', nivel: 1 },
        { tipo: 'charizard', treinador: 'Ash', nivel: 1 },
        { tipo: 'mewtwo', treinador: 'Misty', nivel: 1 },
        { tipo: 'pikachu', treinador: 'Brock', nivel: 1 }
    ]);
});

afterAll(async () => {
    await knex.migrate.rollback();
    await knex.destroy();
});

describe('Treinadores', () => {
    it('deve listar todos os treinadores únicos', async () => {
        const res = await request(app).get('/treinadores');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('treinadores');
        expect(res.body).toHaveProperty('total');
        expect(res.body.treinadores).toContain('Ash');
        expect(res.body.treinadores).toContain('Misty');
        expect(res.body.treinadores).toContain('Brock');
        expect(res.body.total).toBe(3);
    });

    it('deve listar pokémons de um treinador específico', async () => {
        const res = await request(app).get('/treinadores/Ash/pokemons');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('treinador', 'Ash');
        expect(res.body).toHaveProperty('pokemons');
        expect(res.body).toHaveProperty('total', 2);
        expect(res.body.pokemons).toHaveLength(2);
        expect(res.body.pokemons[0].treinador).toBe('Ash');
        expect(res.body.pokemons[1].treinador).toBe('Ash');
    });

    it('deve retornar lista vazia para treinador inexistente', async () => {
        const res = await request(app).get('/treinadores/TreinadorInexistente/pokemons');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('treinador', 'TreinadorInexistente');
        expect(res.body).toHaveProperty('pokemons');
        expect(res.body).toHaveProperty('total', 0);
        expect(res.body.pokemons).toHaveLength(0);
    });
}); 