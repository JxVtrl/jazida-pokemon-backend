const knex = require('./src/database/db');

async function checkBattleHistory() {
    try {
        console.log('🔍 Verificando dados do histórico de batalhas...');
        
        // 1. Verificar total de batalhas
        const totalBattles = await knex('battle_history').count('* as total');
        console.log(`📊 Total de batalhas na tabela: ${totalBattles[0].total}`);
        
        if (totalBattles[0].total > 0) {
            // 2. Verificar algumas batalhas
            const battles = await knex('battle_history')
                .select(['id', 'battle_id', 'trainer_a_id', 'trainer_b_id', 'finished_at', 'created_at'])
                .orderBy('id', 'desc')
                .limit(5);
            
            console.log('\n📊 Últimas 5 batalhas:');
            battles.forEach(battle => {
                console.log(`  - ID: ${battle.id}, Battle ID: ${battle.battle_id}`);
                console.log(`    Trainers: ${battle.trainer_a_id} vs ${battle.trainer_b_id}`);
                console.log(`    Finished: ${battle.finished_at}`);
                console.log(`    Created: ${battle.created_at}`);
                console.log('');
            });
            
            // 3. Testar consulta para treinador 1
            const trainer1Battles = await knex('battle_history')
                .where(function() {
                    this.where('trainer_a_id', 1)
                        .orWhere('trainer_b_id', 1);
                })
                .orderBy('finished_at', 'desc')
                .limit(3);
            
            console.log(`📊 Batalhas para treinador 1: ${trainer1Battles.length}`);
            
            // 4. Testar consulta para treinador 5
            const trainer5Battles = await knex('battle_history')
                .where(function() {
                    this.where('trainer_a_id', 5)
                        .orWhere('trainer_b_id', 5);
                })
                .orderBy('finished_at', 'desc')
                .limit(3);
            
            console.log(`📊 Batalhas para treinador 5: ${trainer5Battles.length}`);
            
            // 5. Verificar estrutura da tabela
            const tableInfo = await knex.raw(`
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'battle_history' 
                ORDER BY ordinal_position
            `);
            
            console.log('\n📋 Estrutura da tabela battle_history:');
            tableInfo.rows.forEach(col => {
                console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
            });
        }
        
        console.log('\n✅ Verificação concluída!');
        
    } catch (error) {
        console.error('❌ Erro durante a verificação:', error);
    } finally {
        await knex.destroy();
    }
}

checkBattleHistory(); 