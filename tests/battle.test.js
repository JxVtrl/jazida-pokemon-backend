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

describe('BattleController - Batalhar Pokémons', () => {
    let pokemonAId, pokemonBId, pokemonCId;
    let authToken;

    beforeAll(async () => {
        // Criar um treinador para autenticação
        const registerRes = await request(app)
            .post('/auth/register')
            .send({ nome: 'BattleTrainer', senha: '123456' });

        authToken = registerRes.body.token;
    });

    beforeEach(async () => {
        // Criar pokémons para teste
        const [pokemonA] = await knex('pokemons').insert([
            { tipo: 'pikachu', treinador: 'Ash', nivel: 1 }
        ]).returning('*');

        const [pokemonB] = await knex('pokemons').insert([
            { tipo: 'charizard', treinador: 'Misty', nivel: 2 }
        ]).returning('*');

        const [pokemonC] = await knex('pokemons').insert([
            { tipo: 'mewtwo', treinador: 'Brock', nivel: 1 }
        ]).returning('*');

        pokemonAId = pokemonA.id;
        pokemonBId = pokemonB.id;
        pokemonCId = pokemonC.id;
    });

    it('deve realizar uma batalha entre dois pokémons válidos', async () => {
        const res = await request(app)
            .post(`/batalhar/${pokemonAId}/${pokemonBId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('vencedor');
        expect(res.body).toHaveProperty('perdedor');
        expect(res.body).toHaveProperty('batalha');

        // Verificar estrutura do vencedor
        expect(res.body.vencedor).toHaveProperty('id');
        expect(res.body.vencedor).toHaveProperty('tipo');
        expect(res.body.vencedor).toHaveProperty('treinador');
        expect(res.body.vencedor).toHaveProperty('nivel');

        // Verificar estrutura do perdedor
        expect(res.body.perdedor).toHaveProperty('id');
        expect(res.body.perdedor).toHaveProperty('tipo');
        expect(res.body.perdedor).toHaveProperty('treinador');
        expect(res.body.perdedor).toHaveProperty('nivel');
        expect(res.body.perdedor).toHaveProperty('removido');

        // Verificar estrutura da batalha
        expect(res.body.batalha).toHaveProperty('vencedor');
        expect(res.body.batalha).toHaveProperty('perdedor');
        expect(res.body.batalha).toHaveProperty('probabilidadeVencedor');
        expect(res.body.batalha).toHaveProperty('probabilidadePerdedor');

        // Verificar que os níveis foram atualizados corretamente
        expect(res.body.vencedor.nivel).toBeGreaterThan(1);
        expect(res.body.perdedor.nivel).toBeGreaterThanOrEqual(0);
    });

    it('deve retornar erro 404 quando pokémon A não existe', async () => {
        const res = await request(app)
            .post(`/batalhar/99999/${pokemonBId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Pokémon não encontrado.');
        expect(res.body).toHaveProperty('details');
    });

    it('deve retornar erro 404 quando pokémon B não existe', async () => {
        const res = await request(app)
            .post(`/batalhar/${pokemonAId}/99999`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Pokémon não encontrado.');
        expect(res.body).toHaveProperty('details');
    });

    it('deve retornar erro 400 quando tenta batalhar pokémon contra ele mesmo', async () => {
        const res = await request(app)
            .post(`/batalhar/${pokemonAId}/${pokemonAId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'Não é possível batalhar um pokémon contra ele mesmo.');
    });

    it('deve remover pokémon quando nível chega a 0', async () => {
        // Criar um pokémon com nível 1 para perder
        const [pokemonFraco] = await knex('pokemons').insert([
            { tipo: 'pikachu', treinador: 'Teste', nivel: 1 }
        ]).returning('*');

        const res = await request(app)
            .post(`/batalhar/${pokemonFraco.id}/${pokemonBId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);

        // Se o pokémon fraco perdeu, deve ter sido removido
        if (res.body.perdedor.id === pokemonFraco.id) {
            expect(res.body.perdedor.removido).toBe(true);
            expect(res.body.perdedor.nivel).toBe(0);

            // Verificar se foi realmente removido do banco
            const pokemonRemovido = await knex('pokemons').where({ id: pokemonFraco.id }).first();
            expect(pokemonRemovido).toBeUndefined();
        }
    });

    it('deve calcular probabilidades corretamente baseadas nos níveis', async () => {
        const res = await request(app)
            .post(`/batalhar/${pokemonAId}/${pokemonBId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);

        // Verificar que as probabilidades somam 1 (100%)
        const probVencedor = res.body.batalha.probabilidadeVencedor;
        const probPerdedor = res.body.batalha.probabilidadePerdedor;

        expect(probVencedor + probPerdedor).toBeCloseTo(1, 5);
        expect(probVencedor).toBeGreaterThan(0);
        expect(probPerdedor).toBeGreaterThan(0);
    });

    it('deve atualizar níveis corretamente após a batalha', async () => {
        const res = await request(app)
            .post(`/batalhar/${pokemonAId}/${pokemonBId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);

        // Verificar que o vencedor ganhou +1 nível
        expect(res.body.vencedor.nivel).toBeGreaterThan(1);

        // Verificar que o perdedor perdeu -1 nível (ou foi removido se nível 0)
        if (!res.body.perdedor.removido) {
            expect(res.body.perdedor.nivel).toBeGreaterThanOrEqual(0);
        }

        // Verificar se as mudanças foram persistidas no banco
        const vencedorNoBanco = await knex('pokemons').where({ id: res.body.vencedor.id }).first();
        expect(vencedorNoBanco.nivel).toBe(res.body.vencedor.nivel);

        if (!res.body.perdedor.removido) {
            const perdedorNoBanco = await knex('pokemons').where({ id: res.body.perdedor.id }).first();
            expect(perdedorNoBanco.nivel).toBe(res.body.perdedor.nivel);
        }
    });
}); 