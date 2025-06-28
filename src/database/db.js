const knex = require('knex');
const knexConfig = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

console.log('🔧 Configuração do banco de dados:');
console.log('   - Ambiente:', environment);
console.log('   - Configuração:', JSON.stringify(config, null, 2));

// Log das variáveis de ambiente (sem senhas)
console.log('🌍 Variáveis de ambiente:');
console.log('   - DB_HOST:', process.env.DB_HOST);
console.log('   - DB_USER:', process.env.DB_USER);
console.log('   - DB_NAME:', process.env.DB_NAME);
console.log('   - DB_PORT:', process.env.DB_PORT);
console.log('   - DB_PASSWORD:', process.env.DB_PASSWORD ? '[HIDDEN]' : 'undefined');

const knexInstance = knex(config);

// Testar conexão
knexInstance.raw('SELECT 1')
    .then(() => {
        console.log('✅ Conexão com banco de dados estabelecida com sucesso!');
    })
    .catch((error) => {
        console.error('❌ Erro ao conectar com banco de dados:', error);
    });

module.exports = knexInstance;
