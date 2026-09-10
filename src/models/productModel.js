const defaultDb = require('../db');

const COLUMNS = 'id, name, description, image_url, base_price, quantity, active, created_at';

async function getProducts({ activeOnly = false } = {}) {
  if (activeOnly) {
    return defaultDb.all(`SELECT ${COLUMNS} FROM products WHERE active = 1 ORDER BY name ASC`);
  }
  return defaultDb.all(`SELECT ${COLUMNS} FROM products ORDER BY name ASC`);
}

async function getProductById(id, db = defaultDb) {
  return db.get(`SELECT ${COLUMNS} FROM products WHERE id = ?`, [id]);
}

async function createProduct({ name, description, imageUrl, basePrice, quantity, active = 1 }) {
  const result = await defaultDb.run(
    'INSERT INTO products (name, description, image_url, base_price, quantity, active) VALUES (?, ?, ?, ?, ?, ?)',
    [name, description || '', imageUrl || '', basePrice, quantity, active ? 1 : 0]
  );
  return getProductById(result.lastInsertRowid);
}

async function updateProduct(id, { name, description, imageUrl, basePrice, quantity }) {
  await defaultDb.run(
    'UPDATE products SET name = ?, description = ?, image_url = ?, base_price = ?, quantity = ? WHERE id = ?',
    [name, description || '', imageUrl || '', basePrice, quantity, id]
  );
  return getProductById(id);
}

async function setProductActive(id, active) {
  await defaultDb.run('UPDATE products SET active = ? WHERE id = ?', [active ? 1 : 0, id]);
  return getProductById(id);
}

async function decrementProductQuantity(id, amount, db = defaultDb) {
  await db.run('UPDATE products SET quantity = quantity - ? WHERE id = ?', [amount, id]);
  return getProductById(id, db);
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  setProductActive,
  decrementProductQuantity,
};
