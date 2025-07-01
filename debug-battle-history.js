const knex = require('./src/database/db');

async function debugBattleHistory() {
    try {
        console.log('🔍 Debug completo do histórico de batalhas...');
        
        // 1. Verificar se a tabela existe
        const tableExists = await knex.schema.hasTable('battle_history');
        console.log(`📋 Tabela battle_history existe: ${tableExists}`);
        
        if (!tableExists) {
            console.log('❌ Tabela battle_history não existe!');
            return;
        }
        
        // 2. Verificar estrutura da tabela
        const columns = await knex.raw(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'battle_history' 
            ORDER BY ordinal_position
        `);
        
        console.log('\n📋 Estrutura da tabela battle_history:');
        columns.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
        });
        
        // 3. Verificar total de registros
        const totalBattles = await knex('battle_history').count('* as total');
        console.log(`\n📊 Total de batalhas na tabela: ${totalBattles[0].total}`);
        
        // 4. Testar inserção de uma batalha de teste
        console.log('\n🧪 Testando inserção de batalha...');
        
        const testBattle = {
            battle_id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            trainer_a_id: 1,
            trainer_b_id: 5,
            trainer_a_name: 'joao',
            trainer_b_name: 'jjj',
            pokemon_a_id: 36,
            pokemon_b_id: 40,
            pokemon_a_type: 'mewtwo',
            pokemon_b_type: 'charizard',
            pokemon_a_level_before: 5,
            pokemon_b_level_before: 1,
            pokemon_a_level_after: 6,
            pokemon_b_level_after: 0,
            winner_trainer_id: 1,
            loser_trainer_id: 5,
            winner_pokemon_type: 'mewtwo',
            loser_pokemon_type: 'charizard',
            rounds_played: 5,
            finished_at: new Date()
        };
        
        try {
            const [insertedBattle] = await knex('battle_history')
                .insert(testBattle)
                .returning('*');
            
            console.log('✅ Inserção de teste bem-sucedida:', insertedBattle.id);
            
            // 5. Verificar se foi inserido
            const newTotal = await knex('battle_history').count('* as total');
            console.log(`📊 Novo total de batalhas: ${newTotal[0].total}`);
            
            // 6. Buscar a batalha inserida
            const foundBattle = await knex('battle_history')
                .where({ battle_id: testBattle.battle_id })
                .first();
            
            if (foundBattle) {
                console.log('✅ Batalha encontrada após inserção');
                
                // 7. Testar consulta por treinador
                const trainer1Battles = await knex('battle_history')
                    .where(function() {
                        this.where('trainer_a_id', 1)
                            .orWhere('trainer_b_id', 1);
                    })
                    .orderBy('finished_at', 'desc');
                
                console.log(`📊 Batalhas para treinador 1: ${trainer1Battles.length}`);
                
                // 8. Limpar batalha de teste
                await knex('battle_history')
                    .where({ battle_id: testBattle.battle_id })
                    .del();
                
                console.log('🧹 Batalha de teste removida');
            } else {
                console.log('❌ Batalha não encontrada após inserção');
            }
            
        } catch (insertError) {
            console.error('❌ Erro na inserção de teste:', insertError.message);
            console.error('Detalhes:', insertError);
        }
        
        // 9. Verificar outras tabelas relacionadas
        console.log('\n🔍 Verificando tabelas relacionadas...');
        
        const trainersCount = await knex('trainers').count('* as total');
        console.log(`📊 Total de treinadores: ${trainersCount[0].total}`);
        
        const pokemonsCount = await knex('pokemons').count('* as total');
        console.log(`📊 Total de pokémons: ${pokemonsCount[0].total}`);
        
        // 10. Verificar se há batalhas na tabela battles (se existir)
        const battlesTableExists = await knex.schema.hasTable('battles');
        if (battlesTableExists) {
            const battlesCount = await knex('battles').count('* as total');
            console.log(`📊 Total de batalhas na tabela battles: ${battlesCount[0].total}`);
        }
        
        console.log('\n✅ Debug concluído!');
        
    } catch (error) {
        console.error('❌ Erro durante o debug:', error);
        console.error('Stack:', error.stack);
    } finally {
        await knex.destroy();
    }
}

debugBattleHistory(); 