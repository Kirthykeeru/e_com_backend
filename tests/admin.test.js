require('./testSetup');
const request = require('supertest');
const migrate = require('../src/db/migrate');
const app = require('../src/app');
const { createAdminAndLogin, registerBuyerAndLogin } = require('./helpers');

beforeAll(async () => {
  await migrate();
});

describe('admin', () => {
  test('admin can create a product, set a price override, and both are audit logged', async () => {
    const { token } = await createAdminAndLogin(app);

    const productRes = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Product', basePrice: 15, quantity: 10 });
    expect(productRes.status).toBe(201);

    const { user: buyer } = await registerBuyerAndLogin(app, { email: 'buyer3@test.com' });

    const overrideRes = await request(app)
      .post('/api/admin/price-overrides')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: buyer.id, productId: productRes.body.id, overridePrice: 9 });
    expect(overrideRes.status).toBe(201);

    const logsRes = await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', `Bearer ${token}`);

    const actions = logsRes.body.logs.map((l) => l.action);
    expect(actions).toContain('product.create');
    expect(actions).toContain('price_override.set');
  });

  test('non-admin buyers are forbidden from admin routes', async () => {
    const { token } = await registerBuyerAndLogin(app, { email: 'buyer4@test.com' });
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('unauthenticated requests are rejected', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });
});
