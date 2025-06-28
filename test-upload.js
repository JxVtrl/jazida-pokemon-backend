const fs = require('fs-extra');
const path = require('path');

async function testUploadSetup() {
    console.log('🧪 Testando configuração de upload...');
    
    try {
        // Verificar se a pasta uploads existe
        const uploadsDir = path.join(__dirname, 'uploads');
        const avatarsDir = path.join(uploadsDir, 'avatars');
        
        console.log('📁 Verificando pasta uploads...');
        if (!await fs.pathExists(uploadsDir)) {
            console.log('📁 Criando pasta uploads...');
            await fs.ensureDir(uploadsDir);
        }
        
        console.log('📁 Verificando pasta avatars...');
        if (!await fs.pathExists(avatarsDir)) {
            console.log('📁 Criando pasta avatars...');
            await fs.ensureDir(avatarsDir);
        }
        
        // Verificar permissões
        const stats = await fs.stat(uploadsDir);
        console.log(`📊 Permissões da pasta uploads: ${stats.mode.toString(8)}`);
        
        // Criar arquivo de teste
        const testFile = path.join(avatarsDir, 'test.txt');
        await fs.writeFile(testFile, 'Teste de upload');
        console.log('✅ Arquivo de teste criado com sucesso');
        
        // Verificar se o arquivo foi criado
        if (await fs.pathExists(testFile)) {
            console.log('✅ Upload de arquivo funcionando');
            await fs.remove(testFile);
            console.log('🗑️ Arquivo de teste removido');
        }
        
        console.log('🎉 Teste de upload concluído com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro no teste de upload:', error);
        process.exit(1);
    }
}

testUploadSetup(); 