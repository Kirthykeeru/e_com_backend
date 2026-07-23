require('./testSetup');
const request = require('supertest');
require('../src/db/migrate');
const app = require('../src/app');
const productModel = require('../src/models/productModel');

describe('products', () => {
  test('GET /api/products excludes inactive products', async () => {
    const active = productModel.createProduct({ name: 'Active Product', basePrice: 10, quantity: 5, active: 1 });
    const inactive = productModel.createProduct({ name: 'Inactive Product', basePrice: 20, quantity: 5, active: 0 });

    const res = await request(app).get('/api/products');
    const ids = res.body.map((p) => p.id);

    expect(ids).toContain(active.id);
    expect(ids).not.toContain(inactive.id);
  });

  test('GET /api/admin/products (as admin) includes inactive products', async () => {
    const inactive = productModel.createProduct({ name: 'Hidden Product', basePrice: 20, quantity: 5, active: 0 });

    const bcrypt = require('bcryptjs');
    const userModel = require('../src/models/userModel');
    const passwordHash = await bcrypt.hash('AdminPass123', 10);
    userModel.createUser({ name: 'Admin', email: 'admin-products@test.com', passwordHash, role: 'admin' });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin-products@test.com', password: 'AdminPass123' });

    const res = await request(app)
      .get('/api/admin/products')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    const ids = res.body.map((p) => p.id);
    expect(ids).toContain(inactive.id);
  });
});
