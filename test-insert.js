const knex = require('./src/database/db');

async function testInsert() {
    try {
        console.log('🧪 Testando inserção na tabela battle_history...');
        
        const testData = {
            battle_id: `test_${Date.now()}`,
            trainer_a_id: 4,
            trainer_b_id: 4,
            trainer_a_name: 'TestStats2',
            trainer_b_name: 'TestStats2',
            pokemon_a_id: 4,
            pokemon_b_id: 5,
            pokemon_a_type: 'pikachu',
            pokemon_b_type: 'charizard',
            pokemon_a_level_before: 1,
            pokemon_b_level_before: 1,
            pokemon_a_level_after: 2,
            pokemon_b_level_after: 0,
            winner_trainer_id: 4,
            loser_trainer_id: 4,
            winner_pokemon_type: 'pikachu',
            loser_pokemon_type: 'charizard',
            rounds_played: 1,
            finished_at: new Date()
        };

        console.log('📊 Dados de teste:', testData);

        const result = await knex('battle_history').insert(testData).returning('*');
        console.log('✅ Inserção bem-sucedida:', result[0]);
        
    } catch (error) {
        console.error('❌ Erro na inserção:', error.message);
        console.error('📋 Detalhes completos:', error);
    } finally {
        await knex.destroy();
    }
}

testInsert(); 