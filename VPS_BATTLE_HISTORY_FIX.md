# 🔧 Correção do Histórico de Batalhas na VPS

## Problema
O histórico de batalhas não está sendo retornado na consulta, mesmo sendo salvo corretamente no banco.

## Solução

### 1. Acesse a VPS
```bash
ssh root@69.62.92.66
cd /root/jazida-pokemon-desafio/backend
```

### 2. Aplique as correções no BattleHistoryController

Edite o arquivo `src/controllers/BattleHistoryController.js` e substitua a função `getBattleHistory`:

```javascript
async function getBattleHistory(req, res) {
    const treinadorId = req.treinadorId || req.user?.id || req.userId;

    if (!treinadorId) {
        return res.status(401).json({ error: 'Não autenticado.' });
    }

    try {
        console.log(`🔍 Buscando histórico de batalhas do treinador ID: ${treinadorId}`);

        // Debug: verificar se há dados na tabela
        const totalBattles = await knex('battle_history').count('* as total');
        console.log(`📊 Total de batalhas na tabela: ${totalBattles[0].total}`);

        // Buscar batalhas onde o treinador participou
        const battles = await knex('battle_history')
            .where(function() {
                this.where('trainer_a_id', treinadorId)
                    .orWhere('trainer_b_id', treinadorId);
            })
            .orderBy('finished_at', 'desc')  // MUDANÇA: usar finished_at em vez de created_at
            .limit(50);

        console.log(`📊 Encontradas ${battles.length} batalhas para o treinador ${treinadorId}`);
        if (battles.length > 0) {
            console.log(`📊 Primeira batalha encontrada:`, {
                battle_id: battles[0].battle_id,
                trainer_a_id: battles[0].trainer_a_id,
                trainer_b_id: battles[0].trainer_b_id,
                finished_at: battles[0].finished_at
            });
        }

        // Formatar dados para o frontend
        const formattedBattles = battles.map(battle => {
            const isTrainerA = battle.trainer_a_id === treinadorId;
            const isWinner = battle.winner_trainer_id === treinadorId;
            
            return {
                id: battle.battle_id,
                data: battle.finished_at,  // MUDANÇA: usar finished_at em vez de created_at
                rounds: battle.rounds_played || 1,
                euSouA: isTrainerA,
                meuPokemon: isTrainerA ? battle.pokemon_a_type : battle.pokemon_b_type,
                meuNivelAntes: isTrainerA ? battle.pokemon_a_level_before : battle.pokemon_b_level_before,
                meuNivelDepois: isTrainerA ? battle.pokemon_a_level_after : battle.pokemon_b_level_after,
                adversario: isTrainerA ? battle.trainer_b_name : battle.trainer_a_name,
                pokemonAdversario: isTrainerA ? battle.pokemon_b_type : battle.pokemon_a_type,
                vencedor: isWinner ? 'eu' : 'adversario',
                resultado: isWinner ? 'victory' : 'defeat'
            };
        });

        console.log(`✅ Formatadas ${formattedBattles.length} batalhas para o frontend`);

        return res.status(200).json(formattedBattles);

    } catch (error) {
        console.error('❌ Erro ao buscar histórico:', error);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}
```

### 3. Aplique as correções no ProfileController

Edite o arquivo `src/controllers/ProfileController.js` e adicione logs de debug na função `getProfile`:

```javascript
async function getProfile(req, res) {
    const treinadorId = req.treinadorId || req.user?.id || req.userId;

    if (!treinadorId) {
        return res.status(401).json({ error: 'Não autenticado.' });
    }

    try {
        console.log(`🔍 Buscando perfil do treinador ID: ${treinadorId}`);

        // Debug: verificar se o treinador existe
        const treinador = await knex('trainers')
            .where({ id: treinadorId })
            .select([
                'id', 'nome', 'avatar_url', 'status_message',
                'total_battles', 'wins', 'losses', 'level', 'experience'
            ])
            .first();

        if (!treinador) {
            console.log(`❌ Treinador ID ${treinadorId} não encontrado`);
            return res.status(404).json({ error: 'Treinador não encontrado.' });
        }

        console.log(`📊 Dados brutos do treinador:`, treinador);

        // Calcular estatísticas
        const winRate = treinador.total_battles > 0 
            ? Math.round((treinador.wins / treinador.total_battles) * 100) 
            : 0;

        // Calcular experiência para próximo nível
        const expForNextLevel = treinador.level * 100;
        const expProgress = treinador.experience % 100;

        const profile = {
            ...treinador,
            winRate,
            nextLevelExp: expForNextLevel,
            expProgress
        };

        console.log(`✅ Perfil encontrado:`, profile);

        return res.status(200).json(profile);

    } catch (error) {
        console.error('❌ Erro ao buscar perfil:', error);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}
```

### 4. Reinicie o container

```bash
docker-compose restart backend
```

### 5. Verifique os logs

```bash
docker-compose logs -f backend
```

### 6. Teste

1. Faça uma nova batalha
2. Acesse o histórico no frontend
3. Verifique os logs para ver se as consultas estão funcionando

## Logs Esperados

Após as correções, você deve ver logs como:

```
🔍 Buscando histórico de batalhas do treinador ID: 5
📊 Total de batalhas na tabela: 2
📊 Encontradas 2 batalhas para o treinador 5
📊 Primeira batalha encontrada: { battle_id: "...", trainer_a_id: 1, trainer_b_id: 5, finished_at: "..." }
✅ Formatadas 2 batalhas para o frontend
```

## Rollback (se necessário)

Se algo der errado, você pode restaurar o backup:

```bash
rm -rf src
mv src.backup.* src
docker-compose restart backend
``` 