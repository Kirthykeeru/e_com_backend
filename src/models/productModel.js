const { get, all, run } = require('../db');

const COLUMNS = 'id, name, description, image_url, base_price, quantity, active, created_at';

function getProducts({ activeOnly = false } = {}) {
  if (activeOnly) {
    return all(`SELECT ${COLUMNS} FROM products WHERE active = 1 ORDER BY name ASC`);
  }
  return all(`SELECT ${COLUMNS} FROM products ORDER BY name ASC`);
}

function getProductById(id) {
  return get(`SELECT ${COLUMNS} FROM products WHERE id = ?`, [id]);
}

function createProduct({ name, description, imageUrl, basePrice, quantity, active = 1 }) {
  const result = run(
    'INSERT INTO products (name, description, image_url, base_price, quantity, active) VALUES (?, ?, ?, ?, ?, ?)',
    [name, description || '', imageUrl || '', basePrice, quantity, active ? 1 : 0]
  );
  return getProductById(result.lastInsertRowid);
}

function updateProduct(id, { name, description, imageUrl, basePrice, quantity }) {
  run(
    'UPDATE products SET name = ?, description = ?, image_url = ?, base_price = ?, quantity = ? WHERE id = ?',
    [name, description || '', imageUrl || '', basePrice, quantity, id]
  );
  return getProductById(id);
}

function setProductActive(id, active) {
  run('UPDATE products SET active = ? WHERE id = ?', [active ? 1 : 0, id]);
  return getProductById(id);
}

function decrementProductQuantity(id, amount) {
  run('UPDATE products SET quantity = quantity - ? WHERE id = ?', [amount, id]);
  return getProductById(id);
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  setProductActive,
  decrementProductQuantity,
};
