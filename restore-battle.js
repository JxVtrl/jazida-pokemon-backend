const fs = require('fs');

function restoreBattle() {
    console.log('🔄 Restaurando arquivo de batalha...');
    
    // Procurar por backups
    const files = fs.readdirSync('.');
    const backups = files.filter(f => f.startsWith('src/routes/battle.js.backup.'));
    
    if (backups.length === 0) {
        console.log('❌ Nenhum backup encontrado!');
        return;
    }
    
    // Pegar o backup mais recente
    const latestBackup = backups.sort().pop();
    console.log(`📦 Restaurando de: ${latestBackup}`);
    
    // Restaurar
    fs.copyFileSync(latestBackup, 'src/routes/battle.js');
    console.log('✅ Arquivo restaurado!');
}

restoreBattle(); 