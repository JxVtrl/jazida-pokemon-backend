const fs = require('fs');
const path = require('path');

function applyBattleFix() {
    console.log('🔧 Aplicando correção da ordem das operações na batalha...');
    
    // 1. Fazer backup dos arquivos
    console.log('📦 Fazendo backup dos arquivos...');
    const filesToBackup = [
        'src/routes/battle.js',
        'src/controllers/BattleController.js'
    ];
    
    filesToBackup.forEach(file => {
        if (fs.existsSync(file)) {
            const backupName = `${file}.backup.${Date.now()}`;
            fs.copyFileSync(file, backupName);
            console.log(`✅ Backup criado: ${backupName}`);
        }
    });
    
    // 2. Corrigir src/routes/battle.js
    console.log('🔧 Corrigindo src/routes/battle.js...');
    const battleFile = 'src/routes/battle.js';
    
    if (fs.existsSync(battleFile)) {
        let content = fs.readFileSync(battleFile, 'utf8');
        
        // Encontrar e corrigir a seção problemática
        const oldPattern = /\/\/ Atualizar níveis no banco PRIMEIRO[\s\S]*?\/\/ Remover pokémon perdedor POR ÚLTIMO \(se nível 0\)[\s\S]*?if \(perdedorFinal\.nivel <= 0\) \{[\s\S]*?await db\('pokemons'\)\.where\(\{ id: perdedor\.id \}\)\.del\(\);/;
        
        const newContent = `            // Atualizar níveis no banco PRIMEIRO
            await db('pokemons').where({ id: vencedor.id }).update({ nivel: vencedor.nivel + 1 });
            let perdedorFinal = { ...perdedor, nivel: perdedor.nivel - 1 };
            
            // Salvar histórico da batalha ANTES de remover pokémon
            const battleHistory = {
                battle_id: battleId,
                trainer_a_id: treinadorAId,
                trainer_b_id: treinadorBId,
                trainer_a_name: treinadorANome,
                trainer_b_name: treinadorBNome,
                pokemon_a_id: battlePokemonA.id,
                pokemon_b_id: battlePokemonB.id,
                pokemon_a_type: battlePokemonA.tipo,
                pokemon_b_type: battlePokemonB.tipo,
                pokemon_a_level_before: battlePokemonA.nivel,
                pokemon_b_level_before: battlePokemonB.nivel,
                pokemon_a_level_after: battlePokemonA.id === vencedor.id ? battlePokemonA.nivel + 1 : Math.max(0, battlePokemonA.nivel - 1),
                pokemon_b_level_after: battlePokemonB.id === vencedor.id ? battlePokemonB.nivel + 1 : Math.max(0, battlePokemonB.nivel - 1),
                winner_trainer_id: vencedor.treinador_id,
                loser_trainer_id: perdedor.treinador_id,
                winner_pokemon_type: vencedor.tipo,
                loser_pokemon_type: perdedor.tipo,
                rounds_played: roundAtual - 1,
                finished_at: new Date()
            };
            console.log(\`[BATALHA][\${battleId}] Dados do histórico:\`, JSON.stringify(battleHistory, null, 2));
            const savedBattle = await saveBattleHistory(battleHistory);
            console.log(\`[BATALHA][\${battleId}] ✅ Histórico salvo com sucesso:\`, savedBattle.id);
            
            // Remover pokémon perdedor POR ÚLTIMO (se nível 0)
            if (perdedorFinal.nivel <= 0) {
                await db('pokemons').where({ id: perdedor.id }).del();
                console.log(\`[BATALHA][\${battleId}] 💀 Pokémon \${perdedor.tipo} removido (nível 0)\`);
            } else {
                await db('pokemons').where({ id: perdedor.id }).update({ nivel: perdedorFinal.nivel });
                console.log(\`[BATALHA][\${battleId}] ⬇️ Pokémon \${perdedor.tipo} atualizado para nível \${perdedorFinal.nivel}\`);
            }`;
        
        if (content.includes('// Atualizar níveis no banco PRIMEIRO')) {
            content = content.replace(oldPattern, newContent);
            fs.writeFileSync(battleFile, content, 'utf8');
            console.log('✅ src/routes/battle.js corrigido');
        } else {
            console.log('⚠️ Padrão não encontrado em src/routes/battle.js - verificação manual necessária');
        }
    }
    
    // 3. Corrigir src/controllers/BattleController.js
    console.log('🔧 Corrigindo src/controllers/BattleController.js...');
    const controllerFile = 'src/controllers/BattleController.js';
    
    if (fs.existsSync(controllerFile)) {
        let content = fs.readFileSync(controllerFile, 'utf8');
        
        // Encontrar e corrigir a seção problemática
        const oldControllerPattern = /\/\/ Atualizar vencedor[\s\S]*?await knex\('pokemons'\)\.where\(\{ id: vencedor\.id \}\)\.update\(\{ nivel: novoNivelVencedor \}\);/;
        
        const newControllerContent = `        // Atualizar vencedor
        await knex('pokemons')
            .where({ id: vencedor.id })
            .update({ nivel: novoNivelVencedor });

        console.log(\`⬆️ \${vencedor.tipo} subiu para nível \${novoNivelVencedor}\`);

        // Salvar histórico da batalha ANTES de remover pokémon
        const battleHistory = {
            battle_id: \`battle_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
            trainer_a_id: pokemonA.treinador_id,
            trainer_b_id: pokemonB.treinador_id,
            trainer_a_name: pokemonA.trainer_name,
            trainer_b_name: pokemonB.trainer_name,
            pokemon_a_id: pokemonA.id,
            pokemon_b_id: pokemonB.id,
            pokemon_a_type: pokemonA.tipo,
            pokemon_b_type: pokemonB.tipo,
            pokemon_a_level_before: pokemonA.nivel,
            pokemon_b_level_before: pokemonB.nivel,
            pokemon_a_level_after: pokemonA.id === vencedor.id ? novoNivelVencedor : Math.max(0, novoNivelPerdedor),
            pokemon_b_level_after: pokemonB.id === vencedor.id ? novoNivelVencedor : Math.max(0, novoNivelPerdedor),
            winner_trainer_id: vencedor.treinador_id,
            loser_trainer_id: perdedor.treinador_id,
            winner_pokemon_type: vencedor.tipo,
            loser_pokemon_type: perdedor.tipo,
            rounds_played: 1,
            finished_at: new Date()
        };

        // Salvar histórico da batalha
        await saveBattleHistory(battleHistory);

        // Verificar se o perdedor ficou com nível 0 ou menor
        if (novoNivelPerdedor <= 0) {
            // Remover pokémon do banco DEPOIS de salvar histórico
            await knex('pokemons').where({ id: perdedor.id }).del();
            console.log(\`💀 \${perdedor.tipo} foi removido do banco (nível 0)\`);

            const resultado = {
                vencedor: {
                    ...vencedor,
                    nivel: novoNivelVencedor
                },
                perdedor: {
                    ...perdedor,
                    nivel: 0,
                    removido: true
                },
                batalha: {
                    vencedor: vencedor.tipo,
                    perdedor: perdedor.tipo,
                    probabilidadeVencedor: vencedor.id === pokemonA.id ? chanceA : chanceB,
                    probabilidadePerdedor: perdedor.id === pokemonA.id ? chanceA : chanceB
                }
            };

            return res.status(200).json(resultado);
        } else {
            // Atualizar perdedor
            await knex('pokemons')
                .where({ id: perdedor.id })
                .update({ nivel: novoNivelPerdedor });

            console.log(\`⬇️ \${perdedor.tipo} caiu para nível \${novoNivelPerdedor}\`);

            const resultado = {
                vencedor: {
                    ...vencedor,
                    nivel: novoNivelVencedor
                },
                perdedor: {
                    ...perdedor,
                    nivel: novoNivelPerdedor,
                    removido: false
                },
                batalha: {
                    vencedor: vencedor.tipo,
                    perdedor: perdedor.tipo,
                    probabilidadeVencedor: vencedor.id === pokemonA.id ? chanceA : chanceB,
                    probabilidadePerdedor: perdedor.id === pokemonA.id ? chanceA : chanceB
                }
            };

            return res.status(200).json(resultado);
        }`;
        
        if (content.includes('// Atualizar vencedor')) {
            content = content.replace(oldControllerPattern, newControllerContent);
            fs.writeFileSync(controllerFile, content, 'utf8');
            console.log('✅ src/controllers/BattleController.js corrigido');
        } else {
            console.log('⚠️ Padrão não encontrado em src/controllers/BattleController.js - verificação manual necessária');
        }
    }
    
    console.log('\n✅ Correções aplicadas!');
    console.log('🔄 Reinicie o container com: docker-compose restart backend');
    console.log('🧪 Teste uma nova batalha para verificar se o histórico é salvo corretamente');
}

applyBattleFix(); 