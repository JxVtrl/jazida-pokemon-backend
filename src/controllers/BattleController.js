const knex = require('../database/db');
const { saveBattleHistory } = require('./BattleHistoryController');

/**
 * Batalha entre dois pokémons
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function battleController(req, res) {
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

        console.log(`📊 Níveis dos pokémons: ${pokemonA.tipo} (${pokemonA.nivel}) vs ${pokemonB.tipo} (${pokemonB.nivel})`);

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
            // Remover pokémon do banco
            await knex('pokemons').where({ id: perdedor.id }).del();
            console.log(`💀 ${perdedor.tipo} foi removido do banco (nível 0)`);

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

            // Salvar histórico da batalha
            await saveBattleHistory({
                battle_id: `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                trainer_a_id: pokemonA.treinador,
                trainer_b_id: pokemonB.treinador,
                trainer_a_name: pokemonA.treinador, // Será atualizado com nome real
                trainer_b_name: pokemonB.treinador, // Será atualizado com nome real
                pokemon_a_id: pokemonA.id,
                pokemon_b_id: pokemonB.id,
                pokemon_a_type: pokemonA.tipo,
                pokemon_b_type: pokemonB.tipo,
                pokemon_a_level_before: pokemonA.nivel,
                pokemon_b_level_before: pokemonB.nivel,
                pokemon_a_level_after: pokemonA.id === vencedor.id ? novoNivelVencedor : 0,
                pokemon_b_level_after: pokemonB.id === vencedor.id ? novoNivelVencedor : 0,
                winner_trainer_id: vencedor.treinador,
                loser_trainer_id: perdedor.treinador,
                winner_pokemon_type: vencedor.tipo,
                loser_pokemon_type: perdedor.tipo,
                rounds_played: 1,
                finished_at: new Date()
            });

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
            await saveBattleHistory({
                battle_id: `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                trainer_a_id: pokemonA.treinador,
                trainer_b_id: pokemonB.treinador,
                trainer_a_name: pokemonA.treinador, // Será atualizado com nome real
                trainer_b_name: pokemonB.treinador, // Será atualizado com nome real
                pokemon_a_id: pokemonA.id,
                pokemon_b_id: pokemonB.id,
                pokemon_a_type: pokemonA.tipo,
                pokemon_b_type: pokemonB.tipo,
                pokemon_a_level_before: pokemonA.nivel,
                pokemon_b_level_before: pokemonB.nivel,
                pokemon_a_level_after: pokemonA.id === vencedor.id ? novoNivelVencedor : novoNivelPerdedor,
                pokemon_b_level_after: pokemonB.id === vencedor.id ? novoNivelVencedor : novoNivelPerdedor,
                winner_trainer_id: vencedor.treinador,
                loser_trainer_id: perdedor.treinador,
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
    battleController
}; 