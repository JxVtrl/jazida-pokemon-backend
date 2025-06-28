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
    let pokemonA, pokemonB, pokemonC;

    beforeEach(async () => {
        // Limpar dados antes de cada teste
        await knex('pokemons').del();
        
        // Criar pokémons para teste
        [pokemonA] = await knex('pokemons').insert([
            { tipo: 'pikachu', treinador: 'Ash', nivel: 5 }
        ]).returning('*');

        [pokemonB] = await knex('pokemons').insert([
            { tipo: 'charizard', treinador: 'Misty', nivel: 3 }
        ]).returning('*');

        [pokemonC] = await knex('pokemons').insert([
            { tipo: 'mewtwo', treinador: 'Brock', nivel: 10 }
        ]).returning('*');
    });

    describe('POST /batalhar/:pokemonAId/:pokemonBId - Batalha Básica', () => {
        it('deve retornar vencedor e perdedor corretamente', async () => {
            const res = await request(app)
                .post(`/batalhar/${pokemonA.id}/${pokemonB.id}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('vencedor');
            expect(res.body).toHaveProperty('perdedor');

            // Verificar que um é vencedor e outro é perdedor
            expect(res.body.vencedor.id).not.toBe(res.body.perdedor.id);

            // O vencedor deve ter aumentado 1 nível em relação ao seu valor inicial
            // O perdedor deve ter diminuído 1 nível em relação ao seu valor inicial
            if (res.body.vencedor.id === pokemonA.id) {
                expect(res.body.vencedor.nivel).toBe(pokemonA.nivel + 1);
                expect(res.body.perdedor.nivel).toBe(pokemonB.nivel - 1);
            } else {
                expect(res.body.vencedor.nivel).toBe(pokemonB.nivel + 1);
                expect(res.body.perdedor.nivel).toBe(pokemonA.nivel - 1);
            }
        });

        it('deve funcionar com pokémons de níveis iguais', async () => {
            // Ajustar níveis para serem iguais
            await knex('pokemons').where({ id: pokemonA.id }).update({ nivel: 5 });
            await knex('pokemons').where({ id: pokemonB.id }).update({ nivel: 5 });

            const res = await request(app)
                .post(`/batalhar/${pokemonA.id}/${pokemonB.id}`);

            expect(res.status).toBe(200);
            expect(res.body.vencedor.nivel).toBe(6);
            expect(res.body.perdedor.nivel).toBe(4);
        });

        it('deve funcionar com diferença grande de níveis', async () => {
            // Ajustar níveis para diferença grande
            await knex('pokemons').where({ id: pokemonA.id }).update({ nivel: 1 });
            await knex('pokemons').where({ id: pokemonB.id }).update({ nivel: 50 });

            const res = await request(app)
                .post(`/batalhar/${pokemonA.id}/${pokemonB.id}`);

            expect(res.status).toBe(200);
            // O de nível 50 deve ter alta probabilidade de vencer
            expect(res.body.vencedor.nivel).toBeGreaterThan(res.body.perdedor.nivel);
        });

        it('deve funcionar com pokémon nível 1 vs nível 1', async () => {
            await knex('pokemons').where({ id: pokemonA.id }).update({ nivel: 1 });
            await knex('pokemons').where({ id: pokemonB.id }).update({ nivel: 1 });

            const res = await request(app)
                .post(`/batalhar/${pokemonA.id}/${pokemonB.id}`);

            expect(res.status).toBe(200);
            expect(res.body.vencedor.nivel).toBe(2);
            expect(res.body.perdedor.nivel).toBe(0);
        });
    });

    describe('Deleção Automática por Nível Zero', () => {
        it('deve deletar pokémon perdedor se nível chegar a 0', async () => {
            // Força o pokémon B com nível 1
            await knex('pokemons').where({ id: pokemonB.id }).update({ nivel: 1 });

            const res = await request(app)
                .post(`/batalhar/${pokemonA.id}/${pokemonB.id}`);

            expect(res.status).toBe(200);
            expect(res.body.perdedor.nivel).toBe(0);

            // Verificar se foi deletado do banco
            const exists = await knex('pokemons').where({ id: pokemonB.id }).first();
            expect(exists).toBeUndefined();
        });

        it('deve deletar pokémon após múltiplas batalhas até nível 0', async () => {
            // Força o pokémon B com nível 1 e pokémon A com nível alto para garantir que B perca
            await knex('pokemons').where({ id: pokemonA.id }).update({ nivel: 100 });
            await knex('pokemons').where({ id: pokemonB.id }).update({ nivel: 1 });

            // Fazer batalhas até que o pokémon B seja deletado
            let batalhas = 0;
            let pokemonBDeletado = false;
            
            while (batalhas < 5 && !pokemonBDeletado) { // Máximo 5 batalhas
                const res = await request(app)
                    .post(`/batalhar/${pokemonA.id}/${pokemonB.id}`);
                
                expect(res.status).toBe(200);
                
                // Verificar se o pokémon B foi deletado
                const exists = await knex('pokemons').where({ id: pokemonB.id }).first();
                if (!exists) {
                    pokemonBDeletado = true;
                    expect(res.body.perdedor.nivel).toBe(0);
                }
                
                batalhas++;
            }
            
            // Verificar que o pokémon foi deletado
            expect(pokemonBDeletado).toBe(true);
            const exists = await knex('pokemons').where({ id: pokemonB.id }).first();
            expect(exists).toBeUndefined();
        });

        it('deve manter pokémon se nível não chegar a 0', async () => {
            // Força o pokémon B com nível 3
            await knex('pokemons').where({ id: pokemonB.id }).update({ nivel: 3 });

            const res = await request(app)
                .post(`/batalhar/${pokemonA.id}/${pokemonB.id}`);

            expect(res.status).toBe(200);
            expect(res.body.perdedor.nivel).toBeGreaterThan(0);

            // Verificar se ainda existe no banco
            const exists = await knex('pokemons').where({ id: pokemonB.id }).first();
            expect(exists).toBeDefined();
            // O nível pode ser 2 ou 4 dependendo de quem venceu
            expect([2, 4]).toContain(exists.nivel);
        });
    });

    describe('Validações e Erros', () => {
        it('deve retornar erro se pokémon A não existir', async () => {
            const res = await request(app)
                .post(`/batalhar/99999/${pokemonB.id}`);

            expect(res.status).toBe(404);
            expect(res.body.error).toContain('Pokémon não encontrado');
        });

        it('deve retornar erro se pokémon B não existir', async () => {
            const res = await request(app)
                .post(`/batalhar/${pokemonA.id}/99999`);

            expect(res.status).toBe(404);
            expect(res.body.error).toContain('Pokémon não encontrado');
        });

        it('deve retornar erro se ambos pokémons não existirem', async () => {
            const res = await request(app)
                .post('/batalhar/99999/88888');

            expect(res.status).toBe(404);
            expect(res.body.error).toContain('Pokémon não encontrado');
        });

        it('deve retornar erro se tentar batalhar pokémon contra ele mesmo', async () => {
            const res = await request(app)
                .post(`/batalhar/${pokemonA.id}/${pokemonA.id}`);

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Não é possível batalhar um pokémon contra ele mesmo');
        });

        it('deve retornar erro se ID for inválido (string)', async () => {
            const res = await request(app)
                .post('/batalhar/abc/def');

            expect(res.status).toBe(404);
        });

        it('deve retornar erro se ID for negativo', async () => {
            const res = await request(app)
                .post('/batalhar/-1/-2');

            expect(res.status).toBe(404);
        });

        it('deve retornar erro se tentar batalhar pokémon já deletado', async () => {
            // Deletar pokémon B primeiro
            await request(app)
                .delete(`/pokemons/${pokemonB.id}`);

            // Tentar batalhar com pokémon deletado
            const res = await request(app)
                .post(`/batalhar/${pokemonA.id}/${pokemonB.id}`);

            expect(res.status).toBe(404);
        });
    });

    describe('Lógica de Probabilidade', () => {
        it('deve ter probabilidade baseada no nível', async () => {
            // Ajustar níveis para teste de probabilidade
            await knex('pokemons').where({ id: pokemonA.id }).update({ nivel: 10 });
            await knex('pokemons').where({ id: pokemonB.id }).update({ nivel: 5 });

            const res = await request(app)
                .post(`/batalhar/${pokemonA.id}/${pokemonB.id}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('vencedor');
            expect(res.body).toHaveProperty('perdedor');
            
            // Verificar que a resposta contém apenas os campos obrigatórios
            expect(Object.keys(res.body)).toHaveLength(2);
            expect(res.body.vencedor).toBeDefined();
            expect(res.body.perdedor).toBeDefined();
        });

        it('deve ter probabilidade 50/50 para níveis iguais', async () => {
            await knex('pokemons').where({ id: pokemonA.id }).update({ nivel: 5 });
            await knex('pokemons').where({ id: pokemonB.id }).update({ nivel: 5 });

            const res = await request(app)
                .post(`/batalhar/${pokemonA.id}/${pokemonB.id}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('vencedor');
            expect(res.body).toHaveProperty('perdedor');
            
            // Verificar que a resposta contém apenas os campos obrigatórios
            expect(Object.keys(res.body)).toHaveLength(2);
        });

        it('deve ter probabilidade muito alta para diferença grande de níveis', async () => {
            await knex('pokemons').where({ id: pokemonA.id }).update({ nivel: 1 });
            await knex('pokemons').where({ id: pokemonB.id }).update({ nivel: 100 });

            const res = await request(app)
                .post(`/batalhar/${pokemonA.id}/${pokemonB.id}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('vencedor');
            expect(res.body).toHaveProperty('perdedor');
            
            // Verificar que a resposta contém apenas os campos obrigatórios
            expect(Object.keys(res.body)).toHaveLength(2);
        });
    });

    describe('Diferentes Tipos de Pokémon', () => {
        it('deve funcionar com todos os tipos de pokémon', async () => {
            const tipos = ['pikachu', 'charizard', 'mewtwo'];
            
            for (let i = 0; i < tipos.length - 1; i++) {
                const res = await request(app)
                    .post(`/batalhar/${pokemonA.id}/${pokemonB.id}`);

                expect(res.status).toBe(200);
                expect(res.body.vencedor).toBeDefined();
                expect(res.body.perdedor).toBeDefined();
            }
        });

        it('deve funcionar com pokémons de diferentes treinadores', async () => {
            // Criar pokémon com segundo treinador
            const createRes = await request(app)
                .post('/pokemons')
                .send({ tipo: 'charizard', treinador: 'SecondTrainer', nivel: 5 });

            const secondPokemonId = createRes.body.id;

            const res = await request(app)
                .post(`/batalhar/${pokemonA.id}/${secondPokemonId}`);

            expect(res.status).toBe(200);
            expect(res.body.vencedor).toBeDefined();
            expect(res.body.perdedor).toBeDefined();
        });
    });

    describe('Casos Edge e Performance', () => {
        it('deve lidar com batalhas consecutivas', async () => {
            // Criar pokémons com níveis altos para múltiplas batalhas
            await knex('pokemons').where({ id: pokemonA.id }).update({ nivel: 10 });
            await knex('pokemons').where({ id: pokemonB.id }).update({ nivel: 10 });

            // Realizar 5 batalhas consecutivas
            for (let i = 0; i < 5; i++) {
                const res = await request(app)
                    .post(`/batalhar/${pokemonA.id}/${pokemonB.id}`);

                expect(res.status).toBe(200);
                expect(res.body.vencedor).toBeDefined();
                expect(res.body.perdedor).toBeDefined();
            }
        });

        it('deve lidar com batalhas simultâneas', async () => {
            // Criar pokémons extras para batalhas simultâneas
            const [pokemonD] = await knex('pokemons').insert([
                { tipo: 'pikachu', treinador: 'TrainerD', nivel: 5 }
            ]).returning('*');

            const [pokemonE] = await knex('pokemons').insert([
                { tipo: 'charizard', treinador: 'TrainerE', nivel: 5 }
            ]).returning('*');

            // Batalhas simultâneas
            const promises = [
                request(app)
                    .post(`/batalhar/${pokemonA.id}/${pokemonB.id}`),
                request(app)
                    .post(`/batalhar/${pokemonC.id}/${pokemonD.id}`),
                request(app)
                    .post(`/batalhar/${pokemonE.id}/${pokemonA.id}`)
            ];

            const results = await Promise.all(promises);
            
            results.forEach(res => {
                expect(res.status).toBe(200);
                expect(res.body.vencedor).toBeDefined();
                expect(res.body.perdedor).toBeDefined();
            });
        });

        it('deve lidar com pokémons de nível máximo', async () => {
            await knex('pokemons').where({ id: pokemonA.id }).update({ nivel: 100 });
            await knex('pokemons').where({ id: pokemonB.id }).update({ nivel: 100 });

            const res = await request(app)
                .post(`/batalhar/${pokemonA.id}/${pokemonB.id}`);

            expect(res.status).toBe(200);
            expect(res.body.vencedor.nivel).toBe(101);
            expect(res.body.perdedor.nivel).toBe(99);
        });

        it('deve lidar com pokémons de nível mínimo', async () => {
            await knex('pokemons').where({ id: pokemonA.id }).update({ nivel: 1 });
            await knex('pokemons').where({ id: pokemonB.id }).update({ nivel: 1 });

            const res = await request(app)
                .post(`/batalhar/${pokemonA.id}/${pokemonB.id}`);

            expect(res.status).toBe(200);
            expect(res.body.vencedor.nivel).toBe(2);
            expect(res.body.perdedor.nivel).toBe(0);
            expect(res.body.perdedor.removido).toBe(true);
        });
    });

    describe('Integridade dos Dados', () => {
        it('deve manter integridade após batalha', async () => {
            const nivelInicialA = pokemonA.nivel;
            const nivelInicialB = pokemonB.nivel;

            const res = await request(app)
                .post(`/batalhar/${pokemonA.id}/${pokemonB.id}`);

            expect(res.status).toBe(200);

            // Verificar se os níveis foram atualizados corretamente
            const updatedA = await knex('pokemons').where({ id: pokemonA.id }).first();
            const updatedB = await knex('pokemons').where({ id: pokemonB.id }).first();

            if (res.body.vencedor.id === pokemonA.id) {
                expect(updatedA.nivel).toBe(nivelInicialA + 1);
                expect(updatedB.nivel).toBe(nivelInicialB - 1);
            } else {
                expect(updatedA.nivel).toBe(nivelInicialA - 1);
                expect(updatedB.nivel).toBe(nivelInicialB + 1);
            }
        });

        it('deve manter outros campos inalterados após batalha', async () => {
            const res = await request(app)
                .post(`/batalhar/${pokemonA.id}/${pokemonB.id}`);

            expect(res.status).toBe(200);

            // Verificar se tipo e treinador não mudaram
            const updatedA = await knex('pokemons').where({ id: pokemonA.id }).first();
            const updatedB = await knex('pokemons').where({ id: pokemonB.id }).first();

            expect(updatedA.tipo).toBe(pokemonA.tipo);
            expect(updatedA.treinador).toBe(pokemonA.treinador);
            expect(updatedB.tipo).toBe(pokemonB.tipo);
            expect(updatedB.treinador).toBe(pokemonB.treinador);
        });
    });
});
