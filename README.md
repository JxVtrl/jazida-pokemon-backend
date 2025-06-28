# 🔁 Backend - API Pokémon Battle

API REST em Node.js para gerenciamento de Pokémons e sistema de batalhas probabilísticas.

## 📋 Endpoints (100% compatível com o desafio)

### CRUD de Pokémons

#### 1. Criar Pokémon
**POST** `/pokemons`

**Body:**
```json
{
  "tipo": "pikachu", // pikachu, charizard ou mewtwo
  "treinador": "Thiago"
}
```
**Retorno 201:**
```json
{
  "id": 1,
  "tipo": "pikachu",
  "treinador": "Thiago",
  "nivel": 1
}
```

#### 2. Alterar Treinador
**PUT** `/pokemons/:id`

**Body:**
```json
{
  "treinador": "Novo Nome"
}
```
**Retorno 204:**

#### 3. Deletar Pokémon
**DELETE** `/pokemons/:id`
**Retorno 204:**

#### 4. Carregar Pokémon
**GET** `/pokemons/:id`
**Retorno 200:**
```json
{
  "id": 1,
  "tipo": "pikachu",
  "treinador": "Thiago",
  "nivel": 1
}
```

#### 5. Listar Pokémons
**GET** `/pokemons`
**Retorno 200:**
```json
[
  { "id": 1, "tipo": "pikachu", "treinador": "Thiago", "nivel": 1 },
  { "id": 2, "tipo": "charizard", "treinador": "Renato", "nivel": 1 }
]
```

---

### Batalha

**POST** `/batalhar/:pokemonAId/:pokemonBId`

- O vencedor ganha +1 nível
- O perdedor perde -1 nível (se chegar a 0, é deletado)
- Probabilidade de vitória proporcional ao nível

**Retorno 200:**
```json
{
  "vencedor": {
    "id": 1,
    "tipo": "pikachu",
    "treinador": "Thiago",
    "nivel": 2
  },
  "perdedor": {
    "id": 2,
    "tipo": "charizard",
    "treinador": "Renato",
    "nivel": 0
  }
}
```

---

## 🧪 Testes Automatizados

- Testes unitários e de integração cobrindo todos os fluxos do desafio
- Basta rodar:
```bash
npm test
```
- Testes de batalha cobrem: vitória, derrota, empate, deleção automática, erros, edge cases
- Testes CRUD cobrem: criação, alteração, deleção, busca, listagem, validação

---

## 🚀 Como rodar localmente

```bash
# Instale dependências
npm install

# Configure o banco (Postgres ou SQLite)
cp .env.example .env

# Rode as migrations e seeds
npm run migrate && npm run seed

# Rode o servidor
npm run dev
```

---

## 🌐 Deploy

- Docker e docker-compose prontos para uso
- Deploy automatizado via GitHub Actions (ver .github/workflows/deploy.yml)

---

## 📚 Documentação automática

- Swagger disponível em `/api-docs` quando rodando localmente

---

## 🏆 Diferenciais implementados

- [x] Testes unitários e integração
- [x] Documentação automática (Swagger)
- [x] Deploy online
- [x] CI/CD
- [x] Interface frontend moderna (ver pasta /frontend)

---

## 👨‍💻 Autor

Desenvolvido por João Vinicius Vitral
- GitHub: [@JxVtrl](https://github.com/JxVtrl)
- LinkedIn: [João Vinicius Vitral](https://www.linkedin.com/in/joao-vinicius-vitral/)

---

<div align="center">
Gotta code 'em all! 🎮⚡
</div>
