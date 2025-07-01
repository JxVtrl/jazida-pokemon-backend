const knex = require('./src/database/db');

async function fixBattleOrder() {
    try {
        console.log('🔧 Corrigindo ordem das operações na batalha...');
        
        // 1. Verificar pokémons existentes
        const pokemons = await knex('pokemons')
            .select(['id', 'tipo', 'treinador_id', 'nivel'])
            .orderBy('id');
        
        console.log('\n📊 Pokémons existentes:');
        pokemons.forEach(p => {
            console.log(`  - ID: ${p.id}, Tipo: ${p.tipo}, Treinador: ${p.treinador_id}, Nível: ${p.nivel}`);
        });
        
        // 2. Verificar se há batalhas com referências inválidas
        const invalidBattles = await knex.raw(`
            SELECT bh.id, bh.battle_id, bh.pokemon_a_id, bh.pokemon_b_id,
                   p1.id as pokemon_a_exists, p2.id as pokemon_b_exists
            FROM battle_history bh
            LEFT JOIN pokemons p1 ON bh.pokemon_a_id = p1.id
            LEFT JOIN pokemons p2 ON bh.pokemon_b_id = p2.id
            WHERE p1.id IS NULL OR p2.id IS NULL
        `);
        
        console.log(`\n⚠️ Batalhas com referências inválidas: ${invalidBattles.rows.length}`);
        
        if (invalidBattles.rows.length > 0) {
            console.log('📋 Detalhes das batalhas inválidas:');
            invalidBattles.rows.forEach(battle => {
                console.log(`  - Battle ID: ${battle.battle_id}`);
                console.log(`    Pokemon A (${battle.pokemon_a_id}): ${battle.pokemon_a_exists ? 'EXISTE' : 'NÃO EXISTE'}`);
                console.log(`    Pokemon B (${battle.pokemon_b_id}): ${battle.pokemon_b_exists ? 'EXISTE' : 'NÃO EXISTE'}`);
            });
        }
        
        // 3. Testar inserção com pokémons válidos
        const validPokemonA = pokemons.find(p => p.treinador_id === 1);
        const validPokemonB = pokemons.find(p => p.treinador_id === 5);
        
        if (validPokemonA && validPokemonB) {
            console.log('\n🧪 Testando inserção com pokémons válidos...');
            
            const testBattle = {
                battle_id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                trainer_a_id: validPokemonA.treinador_id,
                trainer_b_id: validPokemonB.treinador_id,
                trainer_a_name: 'joao',
                trainer_b_name: 'jjj',
                pokemon_a_id: validPokemonA.id,
                pokemon_b_id: validPokemonB.id,
                pokemon_a_type: validPokemonA.tipo,
                pokemon_b_type: validPokemonB.tipo,
                pokemon_a_level_before: validPokemonA.nivel,
                pokemon_b_level_before: validPokemonB.nivel,
                pokemon_a_level_after: validPokemonA.nivel + 1,
                pokemon_b_level_after: Math.max(0, validPokemonB.nivel - 1),
                winner_trainer_id: validPokemonA.treinador_id,
                loser_trainer_id: validPokemonB.treinador_id,
                winner_pokemon_type: validPokemonA.tipo,
                loser_pokemon_type: validPokemonB.tipo,
                rounds_played: 5,
                finished_at: new Date()
            };
            
            try {
                const [insertedBattle] = await knex('battle_history')
                    .insert(testBattle)
                    .returning('*');
                
                console.log('✅ Inserção com pokémons válidos bem-sucedida:', insertedBattle.id);
                
                // Limpar teste
                await knex('battle_history')
                    .where({ battle_id: testBattle.battle_id })
                    .del();
                
                console.log('🧹 Teste removido');
                
            } catch (insertError) {
                console.error('❌ Erro na inserção com pokémons válidos:', insertError.message);
            }
        }
        
        console.log('\n✅ Análise concluída!');
        
    } catch (error) {
        console.error('❌ Erro durante a análise:', error);
    } finally {
        await knex.destroy();
    }
}

fixBattleOrder(); 