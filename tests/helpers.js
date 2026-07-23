const request = require('supertest');
const bcrypt = require('bcryptjs');
const userModel = require('../src/models/userModel');

async function createAdminAndLogin(app, { email = 'admin@test.com', password = 'AdminPass123' } = {}) {
  const passwordHash = await bcrypt.hash(password, 10);
  userModel.createUser({ name: 'Admin', email, passwordHash, role: 'admin' });
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return { token: res.body.token, user: res.body.user };
}

async function registerBuyerAndLogin(app, { name = 'Buyer', email = 'buyer@test.com', password = 'BuyerPass123' } = {}) {
  const res = await request(app).post('/api/auth/register').send({ name, email, password });
  return { token: res.body.token, user: res.body.user };
}

module.exports = { createAdminAndLogin, registerBuyerAndLogin };
