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
    let treinadorId;

    beforeAll(async () => {
        // Criar um treinador para autenticação
        const registerRes = await request(app)
            .post('/auth/register')
            .send({ nome: 'TestTrainer', senha: '123456' });

        authToken = registerRes.body.token;
        treinadorId = registerRes.body.treinador.id;
    });

    it('deve criar um novo pokémon válido', async () => {
        const res = await request(app)
            .post('/pokemons')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ tipo: 'pikachu' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.nivel).toBe(1);
        expect(res.body.treinador_id).toBe(treinadorId);

        pokemonId = res.body.id;
    });

    it('deve retornar erro se tipo for inválido', async () => {
        const res = await request(app)
            .post('/pokemons')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ tipo: 'bulbasaur' });

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
        // Primeiro criar outro treinador
        const outroTreinadorRes = await request(app)
            .post('/auth/register')
            .send({ nome: 'OutroTreinador', senha: '123456' });

        const res = await request(app)
            .put(`/pokemons/${pokemonId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ treinador_id: outroTreinadorRes.body.treinador.id });

        expect(res.status).toBe(204);
    });

    it('deve retornar erro se treinador_id não for fornecido', async () => {
        const res = await request(app)
            .put(`/pokemons/${pokemonId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("O campo 'treinador_id' é obrigatório.");
    });

    it('deve retornar erro se pokémon não existir', async () => {
        const res = await request(app)
            .put('/pokemons/99999')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ treinador_id: treinadorId });

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
        const outroTreinadorRes = await request(app)
            .post('/auth/register')
            .send({ nome: 'OutroTreinador', senha: '123456' });

        await request(app)
            .post('/pokemons')
            .set('Authorization', `Bearer ${outroTreinadorRes.body.token}`)
            .send({ tipo: 'charizard' });

        // Criar pokémon para o treinador autenticado
        await request(app)
            .post('/pokemons')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ tipo: 'mewtwo' });

        // Buscar pokémons do treinador autenticado
        const res = await request(app)
            .get('/me/pokemons')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);

        // Verificar que todos os pokémons retornados pertencem ao treinador autenticado
        res.body.forEach(pokemon => {
            expect(pokemon.treinador_id).toBe(treinadorId);
        });
    });

    it('deve listar pokémons do treinador autenticado com estatísticas', async () => {
        // Criar pokémon para o treinador autenticado
        await request(app)
            .post('/pokemons')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ tipo: 'mewtwo' });

        // Buscar pokémons com estatísticas
        const res = await request(app)
            .get('/me/pokemons/estatisticas')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);

        // Verificar que todos os pokémons retornados pertencem ao treinador autenticado
        res.body.forEach(pokemon => {
            expect(pokemon.treinador_id).toBe(treinadorId);
            // Verificar se as estatísticas estão presentes
            expect(pokemon).toHaveProperty('batalhas');
            expect(pokemon).toHaveProperty('vitorias');
            expect(pokemon).toHaveProperty('derrotas');
            expect(pokemon).toHaveProperty('winRate');
            // Verificar se os valores são números
            expect(typeof pokemon.batalhas).toBe('number');
            expect(typeof pokemon.vitorias).toBe('number');
            expect(typeof pokemon.derrotas).toBe('number');
            expect(typeof pokemon.winRate).toBe('number');
        });
    });
});
