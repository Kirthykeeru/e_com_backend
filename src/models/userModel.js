const db = require('../db');

const findByEmail = async (email) => {
  const result = await db.query('SELECT id, name, email, password_hash, role FROM users WHERE email = ?', [email]);
  return result.rows[0];
};

const findById = async (id) => {
  const result = await db.query('SELECT id, name, email, role FROM users WHERE id = ?', [id]);
  return result.rows[0];
};

const createUser = async ({ name, email, passwordHash, role = 'buyer' }) => {
  await db.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, role]
  );
  const user = await findByEmail(email);
  return user;
};

const getUsers = async () => {
  const result = await db.query('SELECT id, name, email, role FROM users ORDER BY id');
  return result.rows;
};

const updateUser = async (id, { name, email, role }) => {
  await db.query('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?', [name, email, role, id]);
  return findById(id);
};

module.exports = { findByEmail, findById, createUser, getUsers, updateUser };
