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

describe('Sistema de Autenticação', () => {
    let authToken;

    describe('POST /auth/register', () => {
        it('deve registrar um novo treinador com sucesso', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({ nome: 'Ash', senha: '123456' });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('message');
            expect(res.body).toHaveProperty('treinador');
            expect(res.body).toHaveProperty('token');
            expect(res.body.treinador.nome).toBe('Ash');
            expect(res.body.token).toBeTruthy();

            authToken = res.body.token;
        });

        it('deve retornar erro se nome for muito curto', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({ nome: 'Ab', senha: '123456' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Nome deve ter pelo menos 3 caracteres.');
        });

        it('deve retornar erro se senha for muito curta', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({ nome: 'Misty', senha: '123' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Senha deve ter pelo menos 6 caracteres.');
        });

        it('deve retornar erro se nome já existir', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({ nome: 'Ash', senha: '123456' });

            expect(res.status).toBe(409);
            expect(res.body.error).toBe('Treinador com este nome já existe.');
        });

        it('deve retornar erro se dados estiverem faltando', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({ nome: 'Brock' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Nome e senha são obrigatórios.');
        });
    });

    describe('POST /auth/login', () => {
        it('deve fazer login com credenciais válidas', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({ nome: 'Ash', senha: '123456' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message');
            expect(res.body).toHaveProperty('treinador');
            expect(res.body).toHaveProperty('token');
            expect(res.body.treinador.nome).toBe('Ash');
            expect(res.body.token).toBeTruthy();
        });

        it('deve retornar erro com credenciais inválidas', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({ nome: 'Ash', senha: 'senhaerrada' });

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Nome ou senha inválidos.');
        });

        it('deve retornar erro se treinador não existir', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({ nome: 'TreinadorInexistente', senha: '123456' });

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Nome ou senha inválidos.');
        });

        it('deve retornar erro se dados estiverem faltando', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({ nome: 'Ash' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Nome e senha são obrigatórios.');
        });
    });

    describe('POST /auth/verify', () => {
        it('deve verificar token válido', async () => {
            const res = await request(app)
                .post('/auth/verify')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('valid', true);
            expect(res.body).toHaveProperty('treinador');
            expect(res.body.treinador.nome).toBe('Ash');
        });

        it('deve retornar erro se token não for fornecido', async () => {
            const res = await request(app)
                .post('/auth/verify');

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Token de autenticação não fornecido.');
        });

        it('deve retornar erro se token for inválido', async () => {
            const res = await request(app)
                .post('/auth/verify')
                .set('Authorization', 'Bearer token_invalido');

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Token inválido.');
        });
    });

    describe('Rotas Protegidas', () => {
        it('deve permitir acesso a /pokemons com token válido', async () => {
            const res = await request(app)
                .get('/pokemons')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
        });

        it('deve negar acesso a /pokemons sem token', async () => {
            const res = await request(app)
                .get('/pokemons');

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Token de autenticação não fornecido.');
        });

        it('deve negar acesso a /pokemons com token inválido', async () => {
            const res = await request(app)
                .get('/pokemons')
                .set('Authorization', 'Bearer token_invalido');

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Token inválido.');
        });
    });
}); 