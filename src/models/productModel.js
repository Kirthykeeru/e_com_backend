const db = require('../db');

const getProducts = async () => {
  const result = await db.query(
    `SELECT p.id, p.name, p.description, p.image_url, p.base_price, p.quantity, p.active FROM products p ORDER BY p.id`
  );
  return result.rows;
};

const getProductById = async (id) => {
  const result = await db.query(
    'SELECT id, name, description, image_url, base_price, quantity, active FROM products WHERE id = ?',
    [id]
  );
  return result.rows[0];
};

const createProduct = async ({ name, description, imageUrl, basePrice, quantity, active = true }) => {
  await db.query(
    'INSERT INTO products (name, description, image_url, base_price, quantity, active) VALUES (?, ?, ?, ?, ?, ?)',
    [name, description, imageUrl, basePrice, quantity, active ? 1 : 0]
  );
  const result = await db.query('SELECT id, name, description, image_url, base_price, quantity, active FROM products WHERE name = ?', [name]);
  return result.rows[0];
};

const updateProduct = async (id, fields) => {
  await db.query(
    'UPDATE products SET name = ?, description = ?, image_url = ?, base_price = ?, quantity = ?, active = ? WHERE id = ?',
    [fields.name, fields.description, fields.imageUrl, fields.basePrice, fields.quantity, fields.active ? 1 : 0, id]
  );
  const result = await db.query('SELECT id, name, description, image_url, base_price, quantity, active FROM products WHERE id = ?', [id]);
  return result.rows[0];
};

const decrementProductQuantity = async (productId, quantity) => {
  await db.query('UPDATE products SET quantity = quantity - ? WHERE id = ?', [quantity, productId]);
  const result = await db.query('SELECT id, quantity FROM products WHERE id = ?', [productId]);
  return result.rows[0];
};

module.exports = { getProducts, getProductById, createProduct, updateProduct };
