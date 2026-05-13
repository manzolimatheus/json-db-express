# estudo_node — Database Engine Simples com Node.js

Um banco de dados baseado em arquivos JSON com suporte a schema, validação e operações CRUD, integrado a uma API REST com Express.

---

## Sumário

- [Estrutura do projeto](#estrutura-do-projeto)
- [Instalação](#instalação)
- [Iniciando o servidor](#iniciando-o-servidor)
- [Criando tabelas (database.json)](#criando-tabelas-databasejson)
  - [Propriedades do campo](#propriedades-do-campo)
- [Usando a classe Table](#usando-a-classe-table)
  - [Instanciando](#instanciando)
  - [insert](#insert)
  - [getAll](#getall)
  - [findById](#findbyid)
  - [searchByField](#searchbyfield)
  - [updateById](#updatebyid)
  - [deleteById](#deletebyid)
- [Exemplos completos](#exemplos-completos)

---

## Estrutura do projeto

```
app.js               # Servidor Express com exemplos de uso
database-engine.js   # Motor do banco de dados (startEngine + classe Table)
database.json        # Definição de tabelas e schemas
database/
  users.json         # Dados persistidos da tabela "users"
  posts.json         # Dados persistidos da tabela "posts"
```

---

## Instalação

```bash
npm install
```

---

## Iniciando o servidor

```bash
node app.js
# ou, com hot reload:
node --watch app.js
```

O servidor sobe em `http://localhost:3000`.

---

## Criando tabelas (database.json)

Todas as tabelas são definidas no arquivo `database.json`, na raiz do projeto. Cada entrada do array representa uma tabela, onde a chave é o nome da tabela e o valor é um array de campos (schema).

Ao chamar `startEngine()` na inicialização do servidor, os arquivos de dados em `database/` são criados automaticamente caso ainda não existam.

**Formato:**

```json
[
  {
    "nomeDaTabela": [
      {
        "field": "nomeDoCampo",
        "type": "string | number | boolean",
        "required": true,
        "unique": false
      }
    ]
  }
]
```

**Exemplo — tabelas `users` e `posts`:**

```json
[
  {
    "users": [
      {
        "field": "email",
        "type": "string",
        "required": true,
        "unique": true
      }
    ]
  },
  {
    "posts": [
      {
        "field": "title",
        "type": "string",
        "required": true,
        "unique": false
      },
      {
        "field": "content",
        "type": "string",
        "required": true,
        "unique": false
      },
      {
        "field": "authorId",
        "type": "number",
        "required": true,
        "unique": false
      }
    ]
  }
]
```

### Propriedades do campo

| Propriedade | Tipo                                    | Descrição                                                            |
|-------------|-----------------------------------------|----------------------------------------------------------------------|
| `field`     | `string`                                | Nome do campo                                                        |
| `type`      | `"string"` \| `"number"` \| `"boolean"` | Tipo esperado do valor                                               |
| `required`  | `boolean`                               | Se `true`, o campo deve estar presente em todo registro inserido     |
| `unique`    | `boolean`                               | Se `true`, não permite dois registros com o mesmo valor para o campo |

> O campo `id` é gerado automaticamente pelo engine (valor `Date.now()`) e não precisa ser declarado no schema.

---

## Usando a classe Table

Importe `startEngine` e `Table` do engine:

```js
const { startEngine, Table } = require('./database-engine');
```

Chame `startEngine()` uma vez na inicialização para garantir que os arquivos de dados existam:

```js
startEngine();
```

### Instanciando

```js
const usersTable = new Table('users');
const postsTable = new Table('posts');
```

O nome passado deve corresponder exatamente a uma chave definida em `database.json`.

---

### insert

Insere um novo registro. Valida os campos conforme o schema antes de persistir.
Retorna o registro inserido (com `id` gerado automaticamente).

```js
const user = usersTable.insert({ email: 'john@example.com' });
console.log(user);
// { email: 'john@example.com', id: 1715000000000 }
```

Lança um erro se alguma validação falhar:

```js
// Campo required ausente
usersTable.insert({});
// Error: Field "email" is required.

// Valor duplicado em campo unique
usersTable.insert({ email: 'john@example.com' });
// Error: Field "email" must be unique. Value "john@example.com" already exists.

// Tipo incorreto
usersTable.insert({ email: 123 });
// Error: Field "email" must be of type string.
```

---

### getAll

Retorna todos os registros da tabela como array.

```js
const users = usersTable.getAll();
console.log(users);
// [ { email: 'john@example.com', id: 1715000000000 } ]
```

---

### findById

Busca um único registro pelo `id`. Retorna o objeto ou `undefined` se não encontrado.

```js
const user = usersTable.findById(1715000000000);
console.log(user);
// { email: 'john@example.com', id: 1715000000000 }
```

---

### searchByField

Retorna um array com todos os registros em que o campo informado possui o valor especificado.

```js
const results = usersTable.searchByField('email', 'john@example.com');
console.log(results);
// [ { email: 'john@example.com', id: 1715000000000 } ]
```

---

### updateById

Atualiza um registro existente pelo `id`. Somente os campos declarados no schema são persistidos; campos extras são ignorados.

```js
usersTable.updateById(1715000000000, { email: 'john.updated@example.com' });
```

---

### deleteById

Remove um registro pelo `id`.

```js
usersTable.deleteById(1715000000000);
```

---

## Exemplos completos

### Fluxo básico (insert → update → delete)

```js
const { startEngine, Table } = require('./database-engine');
startEngine();

const usersTable = new Table('users');

// Inserir
const newUser = usersTable.insert({ email: 'jane@example.com' });
console.log('Inserido:', newUser);

// Atualizar
usersTable.updateById(newUser.id, { email: 'jane.updated@example.com' });
console.log('Após update:', usersTable.findById(newUser.id));

// Deletar
usersTable.deleteById(newUser.id);
console.log('Após delete:', usersTable.getAll());
```

### Relacionamento entre tabelas (posts de um usuário)

```js
const usersTable = new Table('users');
const postsTable = new Table('posts');

const user = usersTable.insert({ email: 'author@example.com' });

postsTable.insert({
  title: 'Meu primeiro post',
  content: 'Conteúdo do post.',
  authorId: user.id,
});

// Buscar todos os posts do usuário
const userPosts = postsTable.searchByField('authorId', user.id);
console.log(userPosts);
```

### Endpoint REST com Express

```js
// GET /users/:id — busca usuário por ID
app.get('/users/:id', (req, res) => {
  const usersTable = new Table('users');
  const user = usersTable.findById(parseInt(req.params.id));

  if (user) {
    return res.json(user);
  }

  res.status(404).json({ message: 'Usuário não encontrado' });
});
```
