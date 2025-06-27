const knex = require('knex');
const config = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
console.log('🔧 Configuração do banco de dados:');
console.log('   - Ambiente:', environment);
console.log('   - Configuração:', JSON.stringify(config[environment], null, 2));

// Log das variáveis de ambiente (sem senhas)
console.log('🌍 Variáveis de ambiente:');
console.log('   - DB_HOST:', process.env.DB_HOST);
console.log('   - DB_USER:', process.env.DB_USER);
console.log('   - DB_NAME:', process.env.DB_NAME);
console.log('   - DB_PORT:', process.env.DB_PORT);
console.log('   - DB_PASSWORD:', process.env.DB_PASSWORD ? '[HIDDEN]' : 'undefined');

const connection = knex(config[environment]);

// Teste de conexão
connection.raw('SELECT 1')
    .then(() => {
        console.log('✅ Conexão com banco de dados estabelecida com sucesso!');
    })
    .catch((err) => {
        console.error('❌ Erro ao conectar com banco de dados:');
        console.error('   - Mensagem:', err.message);
        console.error('   - Código:', err.code);
    });

module.exports = connection;
