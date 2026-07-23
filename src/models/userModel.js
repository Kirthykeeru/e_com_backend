const { get, all, run } = require('../db');

// The only query allowed to select password_hash. Used only for login comparison;
// its result must never be returned directly from a route handler.
function findByEmail(email) {
  return get('SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = ?', [email]);
}

function findById(id) {
  return get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id]);
}

function getUsers() {
  return all('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
}

function createUser({ name, email, passwordHash, role = 'buyer' }) {
  const result = run(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, role]
  );
  return findById(result.lastInsertRowid);
}

function updateUser(id, { name, email, role }) {
  run('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?', [name, email, role, id]);
  return findById(id);
}

function setPassword(id, passwordHash) {
  run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
  return findById(id);
}

module.exports = {
  findByEmail,
  findById,
  getUsers,
  createUser,
  updateUser,
  setPassword,
};
