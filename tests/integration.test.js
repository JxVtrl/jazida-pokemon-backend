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

describe('Testes de Integração', () => {
    beforeEach(async () => {
        await knex('pokemons').del();
    });

    describe('Fluxo Completo: CRUD + Batalha', () => {
        it('deve executar fluxo completo de criação, batalha e deleção', async () => {
            // 1. Criar pokémons
            const pokemon1 = await request(app)
                .post('/pokemons')
                .send({ tipo: 'pikachu', treinador: 'Ash' });

            const pokemon2 = await request(app)
                .post('/pokemons')
                .send({ tipo: 'charizard', treinador: 'Misty' });

            expect(pokemon1.status).toBe(201);
            expect(pokemon2.status).toBe(201);

            // 2. Listar pokémons
            const listRes = await request(app).get('/pokemons');
            expect(listRes.status).toBe(200);
            expect(listRes.body).toHaveLength(2);

            // 3. Buscar pokémon específico
            const getRes = await request(app).get(`/pokemons/${pokemon1.body.id}`);
            expect(getRes.status).toBe(200);
            expect(getRes.body.tipo).toBe('pikachu');

            // 4. Realizar batalha
            const battleRes = await request(app)
                .post(`/batalhar/${pokemon1.body.id}/${pokemon2.body.id}`);

            expect(battleRes.status).toBe(200);
            expect(battleRes.body).toHaveProperty('vencedor');
            expect(battleRes.body).toHaveProperty('perdedor');

            // 5. Verificar mudanças nos níveis
            const updatedPokemon1 = await request(app).get(`/pokemons/${pokemon1.body.id}`);
            const updatedPokemon2 = await request(app).get(`/pokemons/${pokemon2.body.id}`);

            // O primeiro pokémon pode ter sido deletado se perdeu e chegou ao nível 0
            if (updatedPokemon1.status === 200) {
                // Se ainda existe, verificar se os níveis mudaram
                expect(updatedPokemon1.body.nivel).not.toBe(pokemon1.body.nivel);
            }
            
            // O segundo pokémon pode ter sido deletado se perdeu e chegou ao nível 0
            if (updatedPokemon2.status === 200) {
                // Se ainda existe, verificar se os níveis mudaram
                expect(updatedPokemon2.body.nivel).not.toBe(pokemon2.body.nivel);
            }

            // 6. Atualizar treinador (apenas se o pokémon ainda existir)
            if (updatedPokemon1.status === 200) {
                const updateRes = await request(app)
                    .put(`/pokemons/${pokemon1.body.id}`)
                    .send({ treinador: 'New Ash' });

                expect(updateRes.status).toBe(204);
            }

            // 7. Deletar pokémons (apenas os que ainda existem)
            const deleteRes1 = await request(app).delete(`/pokemons/${pokemon1.body.id}`);
            expect([204, 404]).toContain(deleteRes1.status);

            if (updatedPokemon2.status === 200) {
                const deleteRes2 = await request(app).delete(`/pokemons/${pokemon2.body.id}`);
                expect([204, 404]).toContain(deleteRes2.status);
            }

            // 8. Verificar se foram deletados
            const finalList = await request(app).get('/pokemons');
            expect(finalList.body).toHaveLength(0);
        });
    });

    describe('Fluxo de Batalhas Múltiplas', () => {
        it('deve realizar torneio de batalhas', async () => {
            // Criar 4 pokémons para torneio
            const pokemons = [];
            for (let i = 0; i < 4; i++) {
                const res = await request(app)
                    .post('/pokemons')
                    .send({ tipo: 'pikachu', treinador: `Trainer ${i}` });
                pokemons.push(res.body);
            }

            // Primeira rodada: 0 vs 1, 2 vs 3
            const battle1 = await request(app)
                .post(`/batalhar/${pokemons[0].id}/${pokemons[1].id}`);
            const battle2 = await request(app)
                .post(`/batalhar/${pokemons[2].id}/${pokemons[3].id}`);

            expect(battle1.status).toBe(200);
            expect(battle2.status).toBe(200);

            // Segunda rodada: vencedores se enfrentam
            const winner1 = battle1.body.vencedor;
            const winner2 = battle2.body.vencedor;

            const finalBattle = await request(app)
                .post(`/batalhar/${winner1.id}/${winner2.id}`);

            expect(finalBattle.status).toBe(200);
            expect(finalBattle.body.vencedor.nivel).toBeGreaterThan(2);
        });
    });

    describe('Fluxo de Deleção por Batalha', () => {
        it('deve deletar pokémons até não sobrar nenhum', async () => {
            // Criar pokémons com níveis baixos
            const pokemon1 = await request(app)
                .post('/pokemons')
                .send({ tipo: 'pikachu', treinador: 'Weak1' });

            const pokemon2 = await request(app)
                .post('/pokemons')
                .send({ tipo: 'charizard', treinador: 'Weak2' });

            // Definir níveis baixos
            await knex('pokemons').where({ id: pokemon1.body.id }).update({ nivel: 1 });
            await knex('pokemons').where({ id: pokemon2.body.id }).update({ nivel: 1 });

            // Batalhar até deletar
            const battle1 = await request(app)
                .post(`/batalhar/${pokemon1.body.id}/${pokemon2.body.id}`);

            expect(battle1.status).toBe(200);
            expect(battle1.body.perdedor.removido).toBe(true);

            // Verificar se um foi deletado
            const remaining = await request(app).get('/pokemons');
            expect(remaining.body).toHaveLength(1);
        });
    });

    describe('Fluxo de Múltiplos Treinadores', () => {
        it('deve permitir interação entre diferentes treinadores', async () => {
            // Criar pokémons de diferentes treinadores
            const pokemon1 = await request(app)
                .post('/pokemons')
                .send({ tipo: 'pikachu', treinador: 'Trainer A' });

            const pokemon2 = await request(app)
                .post('/pokemons')
                .send({ tipo: 'charizard', treinador: 'Trainer B' });

            const pokemon3 = await request(app)
                .post('/pokemons')
                .send({ tipo: 'mewtwo', treinador: 'Trainer C' });

            expect(pokemon1.status).toBe(201);
            expect(pokemon2.status).toBe(201);
            expect(pokemon3.status).toBe(201);

            // Batalhar entre diferentes treinadores
            const battle1 = await request(app)
                .post(`/batalhar/${pokemon1.body.id}/${pokemon2.body.id}`);

            expect(battle1.status).toBe(200);

            // Verificar se pokemon2 ainda existe antes da segunda batalha
            const pokemon2Exists = await request(app).get(`/pokemons/${pokemon2.body.id}`);
            
            if (pokemon2Exists.status === 200) {
                const battle2 = await request(app)
                    .post(`/batalhar/${pokemon2.body.id}/${pokemon3.body.id}`);

                expect(battle2.status).toBe(200);
            }

            // Atualizar treinadores (apenas se o pokémon ainda existir)
            const pokemon1Exists = await request(app).get(`/pokemons/${pokemon1.body.id}`);
            if (pokemon1Exists.status === 200) {
                const updateRes = await request(app)
                    .put(`/pokemons/${pokemon1.body.id}`)
                    .send({ treinador: 'New Trainer A' });

                expect(updateRes.status).toBe(204);

                // Deletar pokémons
                const deleteRes = await request(app).delete(`/pokemons/${pokemon1.body.id}`);
                expect(deleteRes.status).toBe(204);
            }
        });
    });

    describe('Fluxo de Recuperação de Erros', () => {
        it('deve recuperar de erros e continuar funcionando', async () => {
            // Tentar operações inválidas
            const invalidGet = await request(app).get('/pokemons/99999');
            expect(invalidGet.status).toBe(404);

            const invalidDelete = await request(app).delete('/pokemons/99999');
            expect(invalidDelete.status).toBe(404);

            // Operações válidas devem continuar funcionando
            const pokemon = await request(app)
                .post('/pokemons')
                .send({ tipo: 'pikachu', treinador: 'Recovery Test' });

            expect(pokemon.status).toBe(201);

            const listRes = await request(app).get('/pokemons');
            expect(listRes.status).toBe(200);
            expect(listRes.body).toHaveLength(1);
        });
    });

    describe('Fluxo de Performance', () => {
        it('deve lidar com muitas operações consecutivas', async () => {
            // Criar muitos pokémons
            const pokemons = [];
            for (let i = 0; i < 10; i++) {
                const res = await request(app)
                    .post('/pokemons')
                    .send({ tipo: 'pikachu', treinador: `PerfTrainer ${i}` });
                pokemons.push(res.body);
            }

            expect(pokemons).toHaveLength(10);

            // Múltiplas batalhas
            const battles = [];
            for (let i = 0; i < 5; i++) {
                const battle = request(app)
                    .post(`/batalhar/${pokemons[i].id}/${pokemons[i + 1].id}`);
                battles.push(battle);
            }

            const battleResults = await Promise.all(battles);
            battleResults.forEach(res => {
                expect(res.status).toBe(200);
            });

            // Múltiplas atualizações (apenas para pokémons que ainda existem)
            const updates = [];
            for (let i = 0; i < 5; i++) {
                const update = request(app)
                    .put(`/pokemons/${pokemons[i].id}`)
                    .send({ treinador: `Updated ${i}` });
                updates.push(update);
            }

            const updateResults = await Promise.all(updates);
            updateResults.forEach(res => {
                // Pode ser 204 (sucesso) ou 404 (pokémon não existe)
                expect([204, 404]).toContain(res.status);
            });

            // Múltiplas deleções (apenas para pokémons que ainda existem)
            const deletes = [];
            for (let i = 0; i < 5; i++) {
                const del = request(app).delete(`/pokemons/${pokemons[i].id}`);
                deletes.push(del);
            }

            const deleteResults = await Promise.all(deletes);
            deleteResults.forEach(res => {
                // Pode ser 204 (sucesso) ou 404 (pokémon não existe)
                expect([204, 404]).toContain(res.status);
            });
        });
    });

    describe('Fluxo de Validação de Dados', () => {
        it('deve manter consistência dos dados durante operações', async () => {
            // Criar pokémon
            const pokemon = await request(app)
                .post('/pokemons')
                .send({ tipo: 'pikachu', treinador: 'ConsistencyTest' });

            expect(pokemon.status).toBe(201);
            const initialData = pokemon.body;
            expect(initialData.tipo).toBe('pikachu');
            expect(initialData.treinador).toBe('ConsistencyTest');
            expect(initialData.nivel).toBe(1);

            // Atualizar treinador
            await request(app)
                .put(`/pokemons/${pokemon.body.id}`)
                .send({ treinador: 'Updated ConsistencyTest' });

            // Verificar se apenas o treinador mudou
            const updatedRes = await request(app).get(`/pokemons/${pokemon.body.id}`);
            expect(updatedRes.body.tipo).toBe('pikachu');
            expect(updatedRes.body.treinador).toBe('Updated ConsistencyTest');
            expect(updatedRes.body.nivel).toBe(1);

            // Realizar batalha
            const opponent = await request(app)
                .post('/pokemons')
                .send({ tipo: 'charizard', treinador: 'Opponent' });

            const battle = await request(app)
                .post(`/batalhar/${pokemon.body.id}/${opponent.body.id}`);

            expect(battle.status).toBe(200);

            // Verificar se tipo e treinador não mudaram após batalha
            const afterBattle = await request(app).get(`/pokemons/${pokemon.body.id}`);
            
            // O pokémon pode ter sido deletado se perdeu e chegou ao nível 0
            if (afterBattle.status === 200) {
                expect(afterBattle.body.tipo).toBe('pikachu');
                expect(afterBattle.body.treinador).toBe('Updated ConsistencyTest');
            }
        });
    });
}); 