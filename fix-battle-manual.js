const fs = require('fs');

function fixBattleManual() {
    console.log('🔧 Corrigindo arquivo de batalha manualmente...');
    
    // 1. Fazer backup
    const battleFile = 'src/routes/battle.js';
    if (fs.existsSync(battleFile)) {
        const backupName = `${battleFile}.backup.${Date.now()}`;
        fs.copyFileSync(battleFile, backupName);
        console.log(`✅ Backup criado: ${backupName}`);
    }
    
    // 2. Ler o arquivo atual
    let content = fs.readFileSync(battleFile, 'utf8');
    
    // 3. Encontrar a linha problemática (por volta da linha 175)
    const lines = content.split('\n');
    let fixedLines = [];
    let inBattleSection = false;
    let skipNextLines = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Procurar pela seção onde o histórico é salvo
        if (line.includes('// Atualizar níveis no banco PRIMEIRO')) {
            inBattleSection = true;
            fixedLines.push(line);
            continue;
        }
        
        if (inBattleSection && line.includes('// Salvar histórico da batalha DEPOIS de atualizar níveis')) {
            // Substituir esta seção
            fixedLines.push('            // Salvar histórico da batalha ANTES de remover pokémon');
            fixedLines.push('            const battleHistory = {');
            fixedLines.push('                battle_id: battleId,');
            fixedLines.push('                trainer_a_id: treinadorAId,');
            fixedLines.push('                trainer_b_id: treinadorBId,');
            fixedLines.push('                trainer_a_name: treinadorANome,');
            fixedLines.push('                trainer_b_name: treinadorBNome,');
            fixedLines.push('                pokemon_a_id: battlePokemonA.id,');
            fixedLines.push('                pokemon_b_id: battlePokemonB.id,');
            fixedLines.push('                pokemon_a_type: battlePokemonA.tipo,');
            fixedLines.push('                pokemon_b_type: battlePokemonB.tipo,');
            fixedLines.push('                pokemon_a_level_before: battlePokemonA.nivel,');
            fixedLines.push('                pokemon_b_level_before: battlePokemonB.nivel,');
            fixedLines.push('                pokemon_a_level_after: battlePokemonA.id === vencedor.id ? battlePokemonA.nivel + 1 : Math.max(0, battlePokemonA.nivel - 1),');
            fixedLines.push('                pokemon_b_level_after: battlePokemonB.id === vencedor.id ? battlePokemonB.nivel + 1 : Math.max(0, battlePokemonB.nivel - 1),');
            fixedLines.push('                winner_trainer_id: vencedor.treinador_id,');
            fixedLines.push('                loser_trainer_id: perdedor.treinador_id,');
            fixedLines.push('                winner_pokemon_type: vencedor.tipo,');
            fixedLines.push('                loser_pokemon_type: perdedor.tipo,');
            fixedLines.push('                rounds_played: roundAtual - 1,');
            fixedLines.push('                finished_at: new Date()');
            fixedLines.push('            };');
            fixedLines.push('            console.log(`[BATALHA][${battleId}] Dados do histórico:`, JSON.stringify(battleHistory, null, 2));');
            fixedLines.push('            const savedBattle = await saveBattleHistory(battleHistory);');
            fixedLines.push('            console.log(`[BATALHA][${battleId}] ✅ Histórico salvo com sucesso:`, savedBattle.id);');
            fixedLines.push('');
            fixedLines.push('            // Remover pokémon perdedor POR ÚLTIMO (se nível 0)');
            fixedLines.push('            if (perdedorFinal.nivel <= 0) {');
            fixedLines.push('                await db(\'pokemons\').where({ id: perdedor.id }).del();');
            fixedLines.push('                console.log(`[BATALHA][${battleId}] 💀 Pokémon ${perdedor.tipo} removido (nível 0)`);');
            fixedLines.push('            } else {');
            fixedLines.push('                await db(\'pokemons\').where({ id: perdedor.id }).update({ nivel: perdedorFinal.nivel });');
            fixedLines.push('                console.log(`[BATALHA][${battleId}] ⬇️ Pokémon ${perdedor.tipo} atualizado para nível ${perdedorFinal.nivel}`);');
            fixedLines.push('            }');
            
            // Pular as linhas antigas até encontrar o fim da seção
            skipNextLines = 50; // Pular várias linhas para evitar duplicação
            inBattleSection = false;
            continue;
        }
        
        if (skipNextLines > 0) {
            skipNextLines--;
            continue;
        }
        
        fixedLines.push(line);
    }
    
    // 4. Escrever o arquivo corrigido
    const fixedContent = fixedLines.join('\n');
    fs.writeFileSync(battleFile, fixedContent, 'utf8');
    
    console.log('✅ Arquivo corrigido!');
    console.log('🔄 Reinicie o container com: docker-compose restart backend');
}

fixBattleManual(); 