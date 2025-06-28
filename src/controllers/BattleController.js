const knex = require('../database/db');
const { saveBattleHistory } = require('./BattleHistoryController');

/**
 * Batalha entre dois pokémons
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function batalharPokemons(req, res) {
    const { pokemonAId, pokemonBId } = req.params;

    try {
        console.log(`⚔️ Iniciando batalha entre pokémons ${pokemonAId} e ${pokemonBId}`);

        // Buscar os dois pokémons pelo ID
        const pokemonA = await knex('pokemons').where({ id: pokemonAId }).first();
        const pokemonB = await knex('pokemons').where({ id: pokemonBId }).first();

        // Verificar se ambos os pokémons existem
        if (!pokemonA) {
            console.log(`❌ Pokémon A (ID: ${pokemonAId}) não encontrado`);
            return res.status(404).json({
                error: 'Pokémon não encontrado.',
                details: `Pokémon com ID ${pokemonAId} não foi encontrado.`
            });
        }

        if (!pokemonB) {
            console.log(`❌ Pokémon B (ID: ${pokemonBId}) não encontrado`);
            return res.status(404).json({
                error: 'Pokémon não encontrado.',
                details: `Pokémon com ID ${pokemonBId} não foi encontrado.`
            });
        }

        // Verificar se não é a mesma batalha
        if (pokemonAId === pokemonBId) {
            console.log(`❌ Tentativa de batalha do mesmo pokémon (ID: ${pokemonAId})`);
            return res.status(400).json({
                error: 'Não é possível batalhar um pokémon contra ele mesmo.'
            });
        }

        // Buscar nomes dos treinadores
        const treinadorA = await knex('trainers').where({ id: pokemonA.treinador }).select('id', 'nome').first();
        const treinadorB = await knex('trainers').where({ id: pokemonB.treinador }).select('id', 'nome').first();
        
        const trainerAName = treinadorA ? treinadorA.nome : `Treinador ${pokemonA.treinador}`;
        const trainerBName = treinadorB ? treinadorB.nome : `Treinador ${pokemonB.treinador}`;

        console.log(`📊 Níveis dos pokémons: ${pokemonA.tipo} (${pokemonA.nivel}) vs ${pokemonB.tipo} (${pokemonB.nivel})`);
        console.log(`👥 Treinadores: ${trainerAName} vs ${trainerBName}`);

        // Calcular probabilidades com base no nível
        const totalNivel = pokemonA.nivel + pokemonB.nivel;
        const chanceA = pokemonA.nivel / totalNivel;
        const chanceB = pokemonB.nivel / totalNivel;

        console.log(`🎲 Probabilidades: ${pokemonA.tipo} (${(chanceA * 100).toFixed(1)}%) vs ${pokemonB.tipo} (${(chanceB * 100).toFixed(1)}%)`);

        // Sortear o vencedor
        const random = Math.random();
        const vencedor = random < chanceA ? pokemonA : pokemonB;
        const perdedor = vencedor.id === pokemonA.id ? pokemonB : pokemonA;

        console.log(`🏆 Vencedor: ${vencedor.tipo} (ID: ${vencedor.id})`);
        console.log(`💔 Perdedor: ${perdedor.tipo} (ID: ${perdedor.id})`);

        // Atualizar níveis: vencedor +1, perdedor -1
        const novoNivelVencedor = vencedor.nivel + 1;
        const novoNivelPerdedor = perdedor.nivel - 1;

        // Atualizar vencedor
        await knex('pokemons')
            .where({ id: vencedor.id })
            .update({ nivel: novoNivelVencedor });

        console.log(`⬆️ ${vencedor.tipo} subiu para nível ${novoNivelVencedor}`);

        // Verificar se o perdedor ficou com nível 0 ou menor
        if (novoNivelPerdedor <= 0) {
            // CORREÇÃO: Primeiro salvar histórico com pokémon deletado como null, depois deletar
            console.log('📝 Salvando histórico da batalha antes de deletar pokémon...');
            console.log('📊 Dados da batalha:', {
                trainer_a_id: pokemonA.treinador,
                trainer_b_id: pokemonB.treinador,
                pokemon_a_id: pokemonA.id,
                pokemon_b_id: pokemonB.id
            });
            
            await saveBattleHistory({
                battle_id: `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                trainer_a_id: parseInt(pokemonA.treinador),
                trainer_b_id: parseInt(pokemonB.treinador),
                trainer_a_name: trainerAName,
                trainer_b_name: trainerBName,
                pokemon_a_id: pokemonA.id === perdedor.id ? null : pokemonA.id,
                pokemon_b_id: pokemonB.id === perdedor.id ? null : pokemonB.id,
                pokemon_a_type: pokemonA.tipo,
                pokemon_b_type: pokemonB.tipo,
                pokemon_a_level_before: pokemonA.nivel,
                pokemon_b_level_before: pokemonB.nivel,
                pokemon_a_level_after: pokemonA.id === vencedor.id ? novoNivelVencedor : 0,
                pokemon_b_level_after: pokemonB.id === vencedor.id ? novoNivelVencedor : 0,
                winner_trainer_id: parseInt(vencedor.treinador),
                loser_trainer_id: parseInt(perdedor.treinador),
                winner_pokemon_type: vencedor.tipo,
                loser_pokemon_type: perdedor.tipo,
                rounds_played: 1,
                finished_at: new Date()
            });
            
            // AGORA deletar o pokémon (após salvar o histórico)
            console.log(`💀 ${perdedor.tipo} chegou ao nível 0, removendo do banco...`);
            
            // CORREÇÃO: Primeiro atualizar todos os registros antigos do histórico que referenciam este pokémon
            console.log(`🔧 Atualizando registros antigos do histórico...`);
            await knex('battle_history')
                .where('pokemon_a_id', perdedor.id)
                .update({ pokemon_a_id: null });
            await knex('battle_history')
                .where('pokemon_b_id', perdedor.id)
                .update({ pokemon_b_id: null });
            console.log(`✅ Registros antigos atualizados`);
            
            // Agora deletar o pokémon
            await knex('pokemons').where({ id: perdedor.id }).del();
            console.log(`✅ ${perdedor.tipo} foi removido do banco com sucesso`);

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

            console.log(`⬇️ ${perdedor.tipo} caiu para nível ${novoNivelPerdedor}`);

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

            // Salvar histórico da batalha
            console.log('📝 Salvando histórico da batalha...');
            console.log('📊 Dados da batalha:', {
                trainer_a_id: pokemonA.treinador,
                trainer_b_id: pokemonB.treinador,
                pokemon_a_id: pokemonA.id,
                pokemon_b_id: pokemonB.id
            });
            
            await saveBattleHistory({
                battle_id: `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                trainer_a_id: parseInt(pokemonA.treinador),
                trainer_b_id: parseInt(pokemonB.treinador),
                trainer_a_name: trainerAName,
                trainer_b_name: trainerBName,
                pokemon_a_id: pokemonA.id === perdedor.id ? null : pokemonA.id,
                pokemon_b_id: pokemonB.id === perdedor.id ? null : pokemonB.id,
                pokemon_a_type: pokemonA.tipo,
                pokemon_b_type: pokemonB.tipo,
                pokemon_a_level_before: pokemonA.nivel,
                pokemon_b_level_before: pokemonB.nivel,
                pokemon_a_level_after: pokemonA.id === vencedor.id ? novoNivelVencedor : novoNivelPerdedor,
                pokemon_b_level_after: pokemonB.id === vencedor.id ? novoNivelVencedor : novoNivelPerdedor,
                winner_trainer_id: parseInt(vencedor.treinador),
                loser_trainer_id: parseInt(perdedor.treinador),
                winner_pokemon_type: vencedor.tipo,
                loser_pokemon_type: perdedor.tipo,
                rounds_played: 1,
                finished_at: new Date()
            });

            return res.status(200).json(resultado);
        }

    } catch (error) {
        console.error('❌ Erro ao processar batalha:', error);
        return res.status(500).json({
            error: 'Erro interno do servidor ao processar a batalha.',
            details: error.message
        });
    }
}

module.exports = {
    batalharPokemons
}; 