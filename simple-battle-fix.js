const fs = require('fs');

function simpleBattleFix() {
    console.log('🔧 Aplicando correção simples...');
    
    // 1. Fazer backup
    const battleFile = 'src/routes/battle.js';
    if (fs.existsSync(battleFile)) {
        const backupName = `${battleFile}.backup.${Date.now()}`;
        fs.copyFileSync(battleFile, backupName);
        console.log(`✅ Backup criado: ${backupName}`);
    }
    
    // 2. Ler o arquivo
    let content = fs.readFileSync(battleFile, 'utf8');
    
    // 3. Substituição simples e específica
    const oldText = `            // Salvar histórico da batalha DEPOIS de atualizar níveis
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
            } else {
                await db('pokemons').where({ id: perdedor.id }).update({ nivel: perdedorFinal.nivel });
            }`;
    
    const newText = `            // Salvar histórico da batalha ANTES de remover pokémon
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
    
    if (content.includes('// Salvar histórico da batalha DEPOIS de atualizar níveis')) {
        content = content.replace(oldText, newText);
        fs.writeFileSync(battleFile, content, 'utf8');
        console.log('✅ Correção aplicada!');
    } else {
        console.log('⚠️ Texto não encontrado - verificação manual necessária');
    }
    
    console.log('🔄 Reinicie o container com: docker-compose restart backend');
}

simpleBattleFix(); 