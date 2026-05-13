const express = require('express');
const { startEngine, Table } = require('./database-engine');
const app = express();
const port = 3000;

/**
 * Endpoints de exemplo para testar a funcionalidade do banco de dados simples.
 */
app.get('/', (req, res) => {
  const usersTable = new Table('users');
  // Exemplo de inserção, atualização e exclusão de um usuário
  const insertedUsers = usersTable.insert({ email: 'john.doe@gmail.com' });
  usersTable.updateById(insertedUsers.id, { name: 'John Doe Updated' });
  usersTable.deleteById(insertedUsers.id);

  res.json({
    message: 'Serviço iniciado com sucesso!',
    users: usersTable.getAll(),
  });
});

/**
 * Endpoint para buscar um usuário por ID. Exemplo: GET /users/1778684260844
 */
app.get('/users/:id', (req, res) => {
  const usersTable = new Table('users');
  const user = usersTable.findById(parseInt(req.params.id));

  if (user) {
    return res.json(user);
  }

  res.status(404).json({ message: 'Usuário não encontrado' });
});

app.listen(port, () => {
  startEngine();
  console.log(`Server is running on http://localhost:${port}`);
});
