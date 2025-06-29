# 🔁 Backend - API Pokémon Battle

API REST em Node.js para gerenciamento de Pokémons e sistema de batalhas com lógica probabilística.

## 🌐 Ambiente de Produção

- **URL da API:** [https://jazida.api.majorssolutions.com.br](https://jazida.api.majorssolutions.com.br)
- **Documentação Swagger:** [https://jazida.api.majorssolutions.com.br/api-docs](https://jazida.api.majorssolutions.com.br/api-docs)

**CORS configurado para aceitar:**
- https://jazida.pokemon.majorssolutions.com.br
- https://jazida.api.majorssolutions.com.br
- https://jazida-pokemon-frontend.vercel.app

**Exemplo de variável de ambiente:**
```env
PORT=4002
NODE_ENV=production
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=jazida
```

## 🛠️ Tecnologias

- **Node.js** + **Express.js**
- **Socket.IO** para comunicação em tempo real
- **PostgreSQL** ou **SQLite** (configurável)
- **Jest** para testes unitários
- **Swagger** para documentação da API

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
```

## ⚙️ Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
# Servidor
PORT=4002
NODE_ENV=development

# Banco de dados
DB_TYPE=postgresql  # ou sqlite
DATABASE_URL=postgresql://user:password@localhost:5432/pokemon_battle
# ou para SQLite: DATABASE_URL=file:./dev.db

# Socket.IO
SOCKET_CORS_ORIGIN=http://localhost:3000
```

## 🚀 Executando o projeto

```bash
# Desenvolvimento
npm run dev

# Produção
npm start

# Testes
npm test

# Testes com coverage
npm run test:coverage
```

## 📚 Endpoints da API

### 🎮 Pokémons

#### `GET /api/pokemons`
Lista todos os Pokémons cadastrados.

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tipo": "pikachu",
      "treinador": "Ash",
      "nivel": 5,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### `GET /api/pokemons/:id`
Busca um Pokémon específico por ID.

#### `POST /api/pokemons`
Cria um novo Pokémon.

**Body:**
```json
{
  "tipo": "charizard",
  "treinador": "Red",
  "nivel": 1
}
```

**Validações:**
- `tipo`: deve ser `pikachu`, `charizard` ou `mewtwo`
- `treinador`: string obrigatória
- `nivel`: número inteiro positivo

#### `PUT /api/pokemons/:id`
Atualiza um Pokémon existente.

#### `DELETE /api/pokemons/:id`
Remove um Pokémon do sistema.

### ⚔️ Batalhas

#### `POST /api/battles`
Inicia uma batalha entre dois Pokémons.

**Body:**
```json
{
  "pokemon1_id": 1,
  "pokemon2_id": 2
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "battle_id": "battle_123",
    "pokemon1": {
      "id": 1,
      "tipo": "pikachu",
      "treinador": "Ash",
      "nivel": 5
    },
    "pokemon2": {
      "id": 2,
      "tipo": "charizard",
      "treinador": "Red",
      "nivel": 3
    },
    "winner": {
      "id": 1,
      "tipo": "pikachu",
      "treinador": "Ash",
      "nivel": 6
    },
    "loser": {
      "id": 2,
      "tipo": "charizard",
      "treinador": "Red",
      "nivel": 2
    },
    "battle_log": [
      "Pikachu usa Thunderbolt!",
      "Charizard usa Flamethrower!",
      "Pikachu vence a batalha!"
    ]
  }
}
```

## 🧮 Lógica de Batalha

### Probabilidade de Vitória
A chance de vitória é calculada baseada no nível dos Pokémons:

```
probabilidade = nivel_pokemon1 / (nivel_pokemon1 + nivel_pokemon2)
```

**Exemplos:**
- Nível 2 vs Nível 1: 66.7% vs 33.3%
- Nível 5 vs Nível 3: 62.5% vs 37.5%
- Nível 1 vs Nível 1: 50% vs 50%

### Consequências da Batalha
- **Vencedor**: +1 nível
- **Perdedor**: -1 nível (deletado se chegar a 0)

## 🔌 Socket.IO Events

### `battle:start`
Emitido quando uma batalha inicia.

### `battle:update`
Atualizações em tempo real durante a batalha.

### `battle:end`
Resultado final da batalha.

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Testes com watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Testes de integração
npm run test:integration
```

## 📊 Estrutura do Banco

### Tabela `pokemons`
```sql
CREATE TABLE pokemons (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('pikachu', 'charizard', 'mewtwo')),
  treinador VARCHAR(100) NOT NULL,
  nivel INTEGER NOT NULL DEFAULT 1 CHECK (nivel > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela `battles`
```sql
CREATE TABLE battles (
  id SERIAL PRIMARY KEY,
  pokemon1_id INTEGER REFERENCES pokemons(id),
  pokemon2_id INTEGER REFERENCES pokemons(id),
  winner_id INTEGER REFERENCES pokemons(id),
  battle_log JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 Deploy

### Docker
```bash
# Build da imagem
docker build -t pokemon-backend .

# Executar container
docker run -p 4002:4002 pokemon-backend
```

### Vercel/Railway
Configure as variáveis de ambiente e faça deploy diretamente.

## 📝 Scripts Disponíveis

```json
{
  "dev": "nodemon src/server.js",
  "start": "node src/server.js",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "db:migrate": "knex migrate:latest",
  "db:seed": "knex seed:run"
}
```

## 🔗 Integração com Frontend

O backend está configurado para aceitar requisições do frontend em `http://localhost:3000` e estabelecer conexões WebSocket para atualizações em tempo real das batalhas.

---

<div align="center">

**Backend pronto para batalhas épicas!** ⚔️🔥

</div>
