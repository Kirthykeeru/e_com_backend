const defaultDb = require('../db');

async function createOrder({ buyerId, total, status = 'pending' }, db = defaultDb) {
  const result = await db.run('INSERT INTO orders (buyer_id, total, status) VALUES (?, ?, ?)', [buyerId, total, status]);
  return getOrderById(result.lastInsertRowid, db);
}

async function createOrderItem({ orderId, productId, price, quantity }, db = defaultDb) {
  await db.run('INSERT INTO order_items (order_id, product_id, price, quantity) VALUES (?, ?, ?, ?)', [
    orderId,
    productId,
    price,
    quantity,
  ]);
}

async function getOrderById(id, db = defaultDb) {
  return db.get('SELECT id, buyer_id, total, status, created_at FROM orders WHERE id = ?', [id]);
}

async function getOrdersByBuyer(buyerId) {
  return defaultDb.all(
    'SELECT id, buyer_id, total, status, created_at FROM orders WHERE buyer_id = ? ORDER BY created_at DESC',
    [buyerId]
  );
}

async function getAllOrders() {
  return defaultDb.all(`
    SELECT o.id, o.buyer_id, o.total, o.status, o.created_at, u.name AS buyer_name, u.email AS buyer_email
    FROM orders o
    JOIN users u ON u.id = o.buyer_id
    ORDER BY o.created_at DESC
  `);
}

async function getOrderItems(orderId) {
  return defaultDb.all(
    `SELECT oi.id, oi.product_id, p.name, p.image_url, oi.price, oi.quantity
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?`,
    [orderId]
  );
}

async function updateOrderStatus(id, status) {
  await defaultDb.run('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
  return getOrderById(id);
}

module.exports = {
  createOrder,
  createOrderItem,
  getOrderById,
  getOrdersByBuyer,
  getAllOrders,
  getOrderItems,
  updateOrderStatus,
};
