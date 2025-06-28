# 🧪 Guia de Testes - Backend

Este documento descreve a estratégia de testes, cobertura e como executar os testes do backend.

## 📊 Cobertura Atual

- **Statements:** 64.73%
- **Branches:** 50%
- **Functions:** 70%
- **Lines:** 65.29%

## 🎯 Estratégia de Testes

### Testes Unitários
- **Ferramenta:** Jest + Supertest
- **Ambiente:** SQLite em memória
- **Cobertura:** Controllers, rotas, lógica de negócio

### Testes de Integração
- **Ferramenta:** Supertest
- **Ambiente:** SQLite em memória
- **Cobertura:** Endpoints completos, autenticação, banco de dados

## 📁 Estrutura dos Testes

```
backend/
├── tests/
│   ├── pokemon.test.js      # Testes CRUD de pokémons
│   └── batalha.test.js      # Testes de sistema de batalha
├── jest.config.js           # Configuração do Jest
├── jest.setup.js            # Setup global dos testes
└── knexfile.js              # Configuração do banco para testes
```

## 🚀 Comandos de Teste

```bash
# Executar todos os testes
npm test

# Testes com cobertura detalhada
npm run test:coverage

# Testes em modo watch (desenvolvimento)
npm run test:watch

# Testes com output verbose
npm run test:verbose
```

## 📋 Casos de Teste

### CRUD de Pokémons (`pokemon.test.js`)

| Teste | Descrição | Status |
|-------|-----------|--------|
| Criar pokémon válido | Valida criação com dados corretos | ✅ |
| Tipo inválido | Rejeita tipos não permitidos | ✅ |
| Listar pokémons | Retorna lista completa | ✅ |
| Buscar por ID | Encontra pokémon específico | ✅ |
| Atualizar treinador | Modifica nome do treinador | ✅ |
| Campos obrigatórios | Valida presença de campos | ✅ |
| Pokémon inexistente | Trata IDs inválidos | ✅ |
| Deletar pokémon | Remove pokémon do sistema | ✅ |

### Sistema de Batalha (`batalha.test.js`)

| Teste | Descrição | Status |
|-------|-----------|--------|
| Batalha básica | Determina vencedor/perdedor | ✅ |
| Atualização de níveis | Vencedor +1, perdedor -1 | ✅ |
| Deleção automática | Remove pokémon com nível 0 | ✅ |
| Autenticação | Valida token em todas as rotas | ✅ |

## 🔧 Configuração

### Jest (`jest.config.js`)
```javascript
module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/server.js',
        '!src/database/db.sqlite',
        '!src/database/migrations/**',
        '!src/database/seeds/**'
    ],
    coverageThreshold: {
        global: {
            branches: 40,
            functions: 70,
            lines: 65,
            statements: 64
        }
    }
};
```

### Banco de Teste (`knexfile.js`)
```javascript
test: {
    client: 'sqlite3',
    connection: {
        filename: ':memory:',
    },
    useNullAsDefault: true,
    migrations: {
        directory: path.join(__dirname, 'src/database/migrations'),
    },
    seeds: {
        directory: path.join(__dirname, 'src/database/seeds'),
    },
}
```

## 🎭 Mocks e Fixtures

### Autenticação
- Criação automática de treinador de teste
- Token JWT válido para todas as requisições
- Limpeza automática após cada teste

### Banco de Dados
- SQLite em memória para isolamento
- Migrações executadas antes de cada suite
- Rollback automático após testes

## 📈 Melhorias Futuras

### Cobertura a Aumentar
- **Middleware de autenticação:** Atualmente 10.81%
- **Tratamento de erros:** Casos edge não cobertos
- **Validações:** Campos opcionais e formatos

### Novos Testes
- **Performance:** Testes de carga
- **Segurança:** Testes de vulnerabilidades
- **API:** Testes de contratos
- **Integração:** Testes com frontend

## 🐛 Troubleshooting

### Erro: "no such file or directory, scandir migrations"
**Solução:** Verificar se o `knexfile.js` usa caminhos absolutos:
```javascript
migrations: {
    directory: path.join(__dirname, 'src/database/migrations'),
}
```

### Erro: "Test timeout"
**Solução:** Aumentar timeout no `jest.config.js`:
```javascript
testTimeout: 10000
```

### Erro: "Database connection failed"
**Solução:** Verificar variáveis de ambiente para teste:
```bash
NODE_ENV=test npm test
```

## 📚 Recursos

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Knex.js Testing](https://knexjs.org/guide/migrations.html#migration-api) 