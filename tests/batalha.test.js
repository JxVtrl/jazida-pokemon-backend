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
    let treinadorId;

    beforeAll(async () => {
        // Criar um treinador para autenticação
        const registerRes = await request(app)
            .post('/auth/register')
            .send({ nome: 'BatalhaTest', senha: '123456' });

        authToken = registerRes.body.token;
        treinadorId = registerRes.body.treinador.id;
    });

    beforeEach(async () => {
        // Limpar pokémons antes de cada teste
        await knex('pokemons').del();
        // Criar pokémons para teste usando o ID do treinador autenticado
        [pokemonA] = await knex('pokemons').insert([
            { tipo: 'pikachu', treinador: treinadorId, nivel: 1 }
        ]).returning('*');

        [pokemonB] = await knex('pokemons').insert([
            { tipo: 'charizard', treinador: treinadorId, nivel: 2 }
        ]).returning('*');
    });

    it('deve retornar vencedor e perdedor corretamente', async () => {
        const res = await request(app)
            .post(`/batalha/${pokemonA.id}/${pokemonB.id}`)
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
            await request(app).post(`/batalha/${pokemonA.id}/${pokemonB.id}`).set('Authorization', `Bearer ${authToken}`);
        }

        const exists = await knex('pokemons').where({ id: pokemonB.id }).first();
        if (exists) {
            expect(exists.nivel).toBeGreaterThan(0);
        } else {
            expect(exists).toBeUndefined();
        }
    });
});

describe('Sistema de Desafios', () => {
    let challengerToken, challengedToken;
    let challengerId, challengedId;

    beforeAll(async () => {
        // Criar dois treinadores para teste
        const challengerRes = await request(app)
            .post('/auth/register')
            .send({ nome: 'Challenger', senha: '123456' });

        const challengedRes = await request(app)
            .post('/auth/register')
            .send({ nome: 'Challenged', senha: '123456' });

        challengerToken = challengerRes.body.token;
        challengedToken = challengedRes.body.token;
        challengerId = challengerRes.body.treinador.id;
        challengedId = challengedRes.body.treinador.id;
    });

    it('deve enviar um desafio para outro treinador', async () => {
        const res = await request(app)
            .post(`/batalha/desafiar/${challengedId}`)
            .set('Authorization', `Bearer ${challengerToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'Desafio enviado com sucesso!');
        expect(res.body).toHaveProperty('challengeId');
        expect(res.body.challengeId).toMatch(/^challenge_/);
    });

    it('deve retornar erro ao tentar desafiar a si mesmo', async () => {
        const res = await request(app)
            .post(`/batalha/desafiar/${challengerId}`)
            .set('Authorization', `Bearer ${challengerToken}`);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'Não é possível desafiar a si mesmo.');
    });

    it('deve retornar erro ao tentar desafiar treinador inexistente', async () => {
        const res = await request(app)
            .post('/batalha/desafiar/99999')
            .set('Authorization', `Bearer ${challengerToken}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Treinador não encontrado.');
    });

    it('deve aceitar um desafio válido', async () => {
        // Primeiro enviar um desafio
        const challengeRes = await request(app)
            .post(`/batalha/desafiar/${challengedId}`)
            .set('Authorization', `Bearer ${challengerToken}`);

        const challengeId = challengeRes.body.challengeId;

        // Depois aceitar o desafio
        const acceptRes = await request(app)
            .post(`/batalha/aceitar/${challengeId}`)
            .set('Authorization', `Bearer ${challengedToken}`);

        expect(acceptRes.status).toBe(200);
        expect(acceptRes.body).toHaveProperty('message', 'Desafio aceito! Redirecionando para batalha...');
        expect(acceptRes.body).toHaveProperty('battleId');
        expect(acceptRes.body.battleId).toMatch(/^battle_/);
    });

    it('deve retornar erro ao aceitar desafio inexistente', async () => {
        const res = await request(app)
            .post('/batalha/aceitar/challenge_inexistente')
            .set('Authorization', `Bearer ${challengedToken}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Desafio não encontrado ou expirado.');
    });

    it('deve retornar erro ao aceitar desafio de outro treinador', async () => {
        // Enviar desafio do challenger para o challenged
        const challengeRes = await request(app)
            .post(`/batalha/desafiar/${challengedId}`)
            .set('Authorization', `Bearer ${challengerToken}`);

        const challengeId = challengeRes.body.challengeId;

        // Tentar aceitar com o token do challenger (que não deveria poder aceitar)
        const acceptRes = await request(app)
            .post(`/batalha/aceitar/${challengeId}`)
            .set('Authorization', `Bearer ${challengerToken}`);

        expect(acceptRes.status).toBe(403);
        expect(acceptRes.body).toHaveProperty('error', 'Você não pode aceitar este desafio.');
    });
});

describe('BattleController - Batalhar Pokémons (detalhado)', () => {
    let pokemonAId, pokemonBId, pokemonCId;
    let authToken;
    let treinadorId;

    beforeAll(async () => {
        // Criar um treinador para autenticação
        const registerRes = await request(app)
            .post('/auth/register')
            .send({ nome: 'BattleTrainer', senha: '123456' });

        authToken = registerRes.body.token;
        treinadorId = registerRes.body.treinador.id;
    });

    beforeEach(async () => {
        // Limpar pokémons antes de cada teste
        await knex('pokemons').del();
        // Criar pokémons para teste usando o ID do treinador autenticado
        const [pokemonA] = await knex('pokemons').insert([
            { tipo: 'pikachu', treinador: treinadorId, nivel: 1 }
        ]).returning('*');

        const [pokemonB] = await knex('pokemons').insert([
            { tipo: 'charizard', treinador: treinadorId, nivel: 2 }
        ]).returning('*');

        const [pokemonC] = await knex('pokemons').insert([
            { tipo: 'mewtwo', treinador: treinadorId, nivel: 1 }
        ]).returning('*');

        pokemonAId = pokemonA.id;
        pokemonBId = pokemonB.id;
        pokemonCId = pokemonC.id;
    });

    it('deve realizar uma batalha entre dois pokémons válidos', async () => {
        const res = await request(app)
            .post(`/batalha/${pokemonAId}/${pokemonBId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('vencedor');
        expect(res.body).toHaveProperty('perdedor');
        expect(res.body).toHaveProperty('batalha');
    });

    it('deve retornar erro 404 quando pokémon A não existe', async () => {
        const res = await request(app)
            .post(`/batalha/99999/${pokemonBId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Pokémon não encontrado.');
        expect(res.body).toHaveProperty('details');
    });

    it('deve retornar erro 404 quando pokémon B não existe', async () => {
        const res = await request(app)
            .post(`/batalha/${pokemonAId}/99999`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Pokémon não encontrado.');
        expect(res.body).toHaveProperty('details');
    });

    it('deve retornar erro 400 quando tenta batalhar pokémon contra ele mesmo', async () => {
        const res = await request(app)
            .post(`/batalha/${pokemonAId}/${pokemonAId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'Não é possível batalhar um pokémon contra ele mesmo.');
    });

    it('deve remover pokémon quando nível chega a 0', async () => {
        // Criar um pokémon com nível 1 para perder
        const [pokemonFraco] = await knex('pokemons').insert([
            { tipo: 'pikachu', treinador: treinadorId, nivel: 1 }
        ]).returning('*');

        const res = await request(app)
            .post(`/batalha/${pokemonFraco.id}/${pokemonBId}`)
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
            .post(`/batalha/${pokemonAId}/${pokemonBId}`)
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
            .post(`/batalha/${pokemonAId}/${pokemonBId}`)
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

    it('deve atualizar estatísticas dos treinadores após batalha', async () => {
        // Verificar estatísticas iniciais
        const trainerBefore = await knex('trainers')
            .where({ id: treinadorId })
            .select(['total_battles', 'wins', 'losses', 'experience', 'level'])
            .first();

        // Realizar batalha
        const res = await request(app)
            .post(`/batalha/${pokemonAId}/${pokemonBId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);

        // Verificar estatísticas após batalha
        const trainerAfter = await knex('trainers')
            .where({ id: treinadorId })
            .select(['total_battles', 'wins', 'losses', 'experience', 'level'])
            .first();

        // Verificar que as estatísticas foram atualizadas
        expect(trainerAfter.total_battles).toBeGreaterThan(trainerBefore.total_battles);
        
        // Verificar que ou vitórias ou derrotas aumentaram
        const totalWinsLosses = trainerAfter.wins + trainerAfter.losses;
        const previousTotalWinsLosses = trainerBefore.wins + trainerBefore.losses;
        expect(totalWinsLosses).toBeGreaterThan(previousTotalWinsLosses);
        
        // Verificar que a experiência aumentou
        expect(trainerAfter.experience).toBeGreaterThan(trainerBefore.experience);
    });

    it('deve atualizar estatísticas dos pokémons após batalha', async () => {
        // Realizar batalha
        const res = await request(app)
            .post(`/batalha/${pokemonAId}/${pokemonBId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);

        // Buscar pokémons atualizados
        const pokemonsAfter = await request(app)
            .get('/pokemons')
            .set('Authorization', `Bearer ${authToken}`);

        expect(pokemonsAfter.status).toBe(200);

        // Verificar que os pokémons têm estatísticas
        const pokemonA = pokemonsAfter.body.find(p => p.id === pokemonAId);
        const pokemonB = pokemonsAfter.body.find(p => p.id === pokemonBId);

        if (pokemonA) {
            expect(pokemonA).toHaveProperty('batalhas');
            expect(pokemonA).toHaveProperty('vitorias');
            expect(pokemonA).toHaveProperty('derrotas');
            expect(pokemonA).toHaveProperty('winRate');
            expect(pokemonA.batalhas).toBeGreaterThan(0);
        }

        if (pokemonB) {
            expect(pokemonB).toHaveProperty('batalhas');
            expect(pokemonB).toHaveProperty('vitorias');
            expect(pokemonB).toHaveProperty('derrotas');
            expect(pokemonB).toHaveProperty('winRate');
            expect(pokemonB.batalhas).toBeGreaterThan(0);
        }
    });
});
