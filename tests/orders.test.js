require('./testSetup');
const request = require('supertest');
require('../src/db/migrate');
const app = require('../src/app');
const productModel = require('../src/models/productModel');
const priceOverrideModel = require('../src/models/priceOverrideModel');
const { registerBuyerAndLogin } = require('./helpers');

describe('orders', () => {
  test('checkout decrements stock and applies the buyer price override', async () => {
    const product = productModel.createProduct({ name: 'Widget', basePrice: 10, quantity: 5, active: 1 });
    const { token, user } = await registerBuyerAndLogin(app, { email: 'buyer1@test.com' });
    priceOverrideModel.upsertPriceOverride({ userId: user.id, productId: product.id, overridePrice: 7 });

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: product.id, quantity: 2 }] });

    expect(res.status).toBe(201);
    expect(res.body.total).toBe(14);

    const updatedProduct = productModel.getProductById(product.id);
    expect(updatedProduct.quantity).toBe(3);
  });

  test('rejects an order that exceeds available stock', async () => {
    const product = productModel.createProduct({ name: 'Scarce Item', basePrice: 5, quantity: 1, active: 1 });
    const { token } = await registerBuyerAndLogin(app, { email: 'buyer2@test.com' });

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: product.id, quantity: 5 }] });

    expect(res.status).toBe(400);
  });

  test('a buyer cannot fetch another buyer order\'s items', async () => {
    const product = productModel.createProduct({ name: 'Gadget', basePrice: 5, quantity: 10, active: 1 });
    const owner = await registerBuyerAndLogin(app, { email: 'owner@test.com' });
    const intruder = await registerBuyerAndLogin(app, { email: 'intruder@test.com' });

    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ items: [{ productId: product.id, quantity: 1 }] });

    const itemsRes = await request(app)
      .get(`/api/orders/${orderRes.body.id}/items`)
      .set('Authorization', `Bearer ${intruder.token}`);

    expect(itemsRes.status).toBe(403);
  });
});
