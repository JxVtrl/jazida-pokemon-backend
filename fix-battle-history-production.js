const knex = require('./src/database/db');

async function fixBattleHistory() {
    try {
        console.log('🔧 Iniciando correção do histórico de batalhas na produção...');
        
        // 1. Verificar se há dados na tabela
        const totalBattles = await knex('battle_history').count('* as total');
        console.log(`📊 Total de batalhas na tabela: ${totalBattles[0].total}`);
        
        if (totalBattles[0].total > 0) {
            // 2. Verificar algumas batalhas para debug
            const sampleBattles = await knex('battle_history')
                .select(['id', 'battle_id', 'trainer_a_id', 'trainer_b_id', 'finished_at', 'created_at'])
                .limit(5);
            
            console.log('📊 Amostra de batalhas:');
            sampleBattles.forEach(battle => {
                console.log(`  - ID: ${battle.id}, Battle ID: ${battle.battle_id}`);
                console.log(`    Trainers: ${battle.trainer_a_id} vs ${battle.trainer_b_id}`);
                console.log(`    Finished: ${battle.finished_at}, Created: ${battle.created_at}`);
            });
            
            // 3. Testar consulta para treinador 1
            const trainer1Battles = await knex('battle_history')
                .where(function() {
                    this.where('trainer_a_id', 1)
                        .orWhere('trainer_b_id', 1);
                })
                .orderBy('finished_at', 'desc')
                .limit(5);
            
            console.log(`📊 Batalhas encontradas para treinador 1: ${trainer1Battles.length}`);
            
            // 4. Testar consulta para treinador 5
            const trainer5Battles = await knex('battle_history')
                .where(function() {
                    this.where('trainer_a_id', 5)
                        .orWhere('trainer_b_id', 5);
                })
                .orderBy('finished_at', 'desc')
                .limit(5);
            
            console.log(`📊 Batalhas encontradas para treinador 5: ${trainer5Battles.length}`);
        }
        
        console.log('✅ Verificação concluída!');
        
    } catch (error) {
        console.error('❌ Erro durante a verificação:', error);
    } finally {
        await knex.destroy();
    }
}

fixBattleHistory(); 