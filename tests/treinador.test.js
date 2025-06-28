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

    beforeEach(async () => {
        // Limpar tabelas antes de cada teste
        await knex('pokemons').del();
        await knex('trainers').del();
        // Inserir treinadores de teste (exceto TrainerTest)
        const treinadores = await knex('trainers').insert([
          { nome: 'Ash', senha_hash: 'dummy' },
          { nome: 'Misty', senha_hash: 'dummy' },
          { nome: 'Brock', senha_hash: 'dummy' }
        ]).returning('*');
        
        // Registrar TrainerTest via API para garantir token válido
        const registerRes = await request(app)
            .post('/auth/register')
            .send({ nome: 'TrainerTest', senha: '123456' });
        authToken = registerRes.body.token;
        
        // Buscar os IDs dos treinadores inseridos
        const ash = await knex('trainers').where({ nome: 'Ash' }).first();
        const misty = await knex('trainers').where({ nome: 'Misty' }).first();
        const brock = await knex('trainers').where({ nome: 'Brock' }).first();
        
        // Inserir pokémons de teste usando os IDs dos treinadores
        await knex('pokemons').insert([
            { tipo: 'pikachu', treinador: ash.id, nivel: 1 },
            { tipo: 'charizard', treinador: ash.id, nivel: 2 },
            { tipo: 'bulbasaur', treinador: misty.id, nivel: 1 },
            { tipo: 'squirtle', treinador: brock.id, nivel: 1 }
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
        
        // Verificar se as estatísticas estão sendo retornadas
        expect(res.body.pokemons[0]).toHaveProperty('batalhas');
        expect(res.body.pokemons[0]).toHaveProperty('vitorias');
        expect(res.body.pokemons[0]).toHaveProperty('derrotas');
        expect(res.body.pokemons[0]).toHaveProperty('winRate');
        expect(res.body.pokemons[0]).toHaveProperty('treinador_nome');
        expect(res.body.pokemons[0].treinador_nome).toBe('Ash');
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

    it('deve listar apenas treinadores online', async () => {
        const res = await request(app)
            .get('/treinadores/online')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('treinadores');
        expect(res.body).toHaveProperty('total');
        expect(res.body).toHaveProperty('message');
        expect(Array.isArray(res.body.treinadores)).toBe(true);
        
        // Como não há sockets conectados nos testes, deve retornar lista vazia
        expect(res.body.total).toBe(0);
        expect(res.body.message).toContain('Nenhum treinador online');
    });
}); 