const db = require('../db');

const createOrder = async ({ buyerId, total }) => {
  const result = await db.query(
    'INSERT INTO orders (buyer_id, total, status) VALUES (?, ?, ?)',
    [buyerId, total, 'pending']
  );
  const order = await db.query('SELECT id, buyer_id, total, status, created_at FROM orders WHERE id = ?', [result.lastID]);
  return order.rows[0];
};

const createOrderItem = async ({ orderId, productId, price, quantity }) => {
  await db.query(
    'INSERT INTO order_items (order_id, product_id, price, quantity) VALUES (?, ?, ?, ?)',
    [orderId, productId, price, quantity]
  );
  const item = await db.query('SELECT id, order_id, product_id, price, quantity FROM order_items WHERE rowid = last_insert_rowid()');
  return item.rows[0];
};

const getOrders = async () => {
  const result = await db.query(
    `SELECT o.id, o.buyer_id, u.name as buyer_name, u.email as buyer_email, o.total, o.status, o.created_at
     FROM orders o
     JOIN users u ON o.buyer_id = u.id
     ORDER BY o.created_at DESC`
  );
  return result.rows;
};

const getOrdersByBuyer = async (buyerId) => {
  const result = await db.query(
    `SELECT id, buyer_id, total, status, created_at
     FROM orders WHERE buyer_id = ? ORDER BY created_at DESC`,
    [buyerId]
  );
  return result.rows;
};

const getOrderItems = async (orderId) => {
  const result = await db.query(
    `SELECT oi.id, oi.order_id, oi.product_id, p.name, p.image_url, oi.price, oi.quantity
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [orderId]
  );
  return result.rows;
};

module.exports = { createOrder, createOrderItem, getOrders, getOrdersByBuyer, getOrderItems };
