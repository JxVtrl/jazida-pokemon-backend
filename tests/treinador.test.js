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
    let ashId, mistyId, brockId;

    beforeEach(async () => {
        // Limpar tabelas antes de cada teste
        await knex('pokemons').del();
        await knex('trainers').del();
        
        // Inserir treinadores de teste
        const [ash] = await knex('trainers').insert([
          { nome: 'Ash', senha_hash: 'dummy' }
        ]).returning('*');
        
        const [misty] = await knex('trainers').insert([
          { nome: 'Misty', senha_hash: 'dummy' }
        ]).returning('*');
        
        const [brock] = await knex('trainers').insert([
          { nome: 'Brock', senha_hash: 'dummy' }
        ]).returning('*');
        
        ashId = ash.id;
        mistyId = misty.id;
        brockId = brock.id;
        
        // Registrar TrainerTest via API para garantir token válido
        const registerRes = await request(app)
            .post('/auth/register')
            .send({ nome: 'TrainerTest', senha: '123456' });
        authToken = registerRes.body.token;
        
        // Inserir pokémons de teste com treinador_id correto
        await knex('pokemons').insert([
            { tipo: 'pikachu', treinador_id: ashId, nivel: 1 },
            { tipo: 'charizard', treinador_id: ashId, nivel: 2 },
            { tipo: 'bulbasaur', treinador_id: mistyId, nivel: 1 },
            { tipo: 'squirtle', treinador_id: brockId, nivel: 1 }
        ]);
    });

    it('deve listar todos os treinadores únicos', async () => {
        const res = await request(app)
            .get('/treinadores')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('treinadores');
        expect(res.body).toHaveProperty('total');
        expect(res.body.treinadores.some(t => t.nome === 'Ash')).toBe(true);
        expect(res.body.treinadores.some(t => t.nome === 'Misty')).toBe(true);
        expect(res.body.treinadores.some(t => t.nome === 'Brock')).toBe(true);
        expect(res.body.total).toBeGreaterThanOrEqual(3);
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

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Treinador não encontrado.');
        expect(res.body).toHaveProperty('details');
    });
}); 