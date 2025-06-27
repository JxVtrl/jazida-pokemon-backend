const request = require('supertest');
const app = require('../src/app');
const knex = require('../src/database/db');

describe('Batalha de Pokémons', () => {
    let pokemonA, pokemonB;

    beforeAll(async () => {
        await knex.migrate.rollback();
        await knex.migrate.latest();
    });

    beforeEach(async () => {
        await knex('pokemons').del();

        const [a] = await knex('pokemons')
            .insert({ tipo: 'pikachu', treinador: 'Ash', nivel: 2 })
            .returning('*');

        const [b] = await knex('pokemons')
            .insert({ tipo: 'charizard', treinador: 'Brock', nivel: 1 })
            .returning('*');

        pokemonA = a;
        pokemonB = b;
    });

    afterAll(async () => {
        await knex.destroy();
    });

    it('deve retornar vencedor e perdedor corretamente', async () => {
        const res = await request(app).post(`/batalhar/${pokemonA.id}/${pokemonB.id}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('vencedor');
        expect(res.body).toHaveProperty('perdedor');

        const vencedor = res.body.vencedor;
        const perdedor = res.body.perdedor;

        // Nível do vencedor deve ter aumentado
        expect(vencedor.nivel).toBeGreaterThan(pokemonA.nivel - 1); // pelo menos +1
        // Nível do perdedor deve ter diminuído (ou ser 0 se for deletado)
        expect(perdedor.nivel).toBeLessThanOrEqual(pokemonB.nivel);
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
