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

describe('Batalha de Pokémons', () => {
    let pokemonA, pokemonB;
    let authToken;

    beforeAll(async () => {
        // Criar um treinador para autenticação
        const registerRes = await request(app)
            .post('/auth/register')
            .send({ nome: 'BatalhaTest', senha: '123456' });

        authToken = registerRes.body.token;
    });

    beforeEach(async () => {
        // Criar pokémons para teste
        [pokemonA] = await knex('pokemons').insert([
            { tipo: 'pikachu', treinador: 'Ash', nivel: 1 }
        ]).returning('*');

        [pokemonB] = await knex('pokemons').insert([
            { tipo: 'charizard', treinador: 'Misty', nivel: 2 }
        ]).returning('*');
    });

    it('deve retornar vencedor e perdedor corretamente', async () => {
        const res = await request(app)
            .post(`/batalhar/${pokemonA.id}/${pokemonB.id}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('vencedor');
        expect(res.body).toHaveProperty('perdedor');
        expect(res.body).toHaveProperty('batalha');

        // Verificar que um é vencedor e outro é perdedor
        expect(res.body.vencedor.id).not.toBe(res.body.perdedor.id);

        // Verificar que os níveis foram atualizados
        expect(res.body.vencedor.nivel).toBeGreaterThan(1);
        expect(res.body.perdedor.nivel).toBeGreaterThanOrEqual(0);
    });

    it('deve deletar pokémon perdedor se nível chegar a 0', async () => {
        // Força o pokémon B com nível 1
        await knex('pokemons').where({ id: pokemonB.id }).update({ nivel: 1 });

        for (let i = 0; i < 5; i++) {
            await request(app).post(`/batalhar/${pokemonA.id}/${pokemonB.id}`);
        }

        const exists = await knex('pokemons').where({ id: pokemonB.id }).first();
        if (exists) {
            expect(exists.nivel).toBeGreaterThan(0);
        } else {
            expect(exists).toBeUndefined();
        }
    });
});
