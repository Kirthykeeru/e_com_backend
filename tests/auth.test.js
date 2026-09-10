require('./testSetup');
const request = require('supertest');
const migrate = require('../src/db/migrate');
const app = require('../src/app');

beforeAll(async () => {
  await migrate();
});

describe('auth', () => {
  test('register succeeds and never leaks password_hash', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'regtest@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('regtest@example.com');
    expect(res.body.user.role).toBe('buyer');
    expect(res.body.user.password_hash).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toMatch(/password_hash/);
  });

  test('register rejects a client-supplied admin role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Hacker', email: 'hacker@example.com', password: 'password123', role: 'admin' });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('buyer');
  });

  test('login succeeds and never leaks password_hash', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Login User', email: 'logintest@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'logintest@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.password_hash).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toMatch(/password_hash/);
  });

  test('login rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'logintest@example.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });
});
