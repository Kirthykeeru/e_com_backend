const db = require('./db');
const bcrypt = require('bcrypt');

const createTables = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'buyer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      base_price NUMERIC(10, 2) NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      buyer_id INTEGER NOT NULL,
      total NUMERIC(10,2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(buyer_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      price NUMERIC(10,2) NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS price_overrides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      override_price NUMERIC(10,2) NOT NULL,
      UNIQUE(user_id, product_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);
};

const seedData = async () => {
  const adminEmail = 'admin@electric.com';
  const passwordHash = await bcrypt.hash('admin123', 10);

  const existingAdmin = await db.query('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (existingAdmin.rows.length === 0) {
    await db.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [
      'Admin User',
      adminEmail,
      passwordHash,
      'admin',
    ]);
  }

  const products = [
    ['Smart Switch', 'WiFi-enabled switch with timer control.', 'https://via.placeholder.com/400x180?text=Switch', 29.99, 50],
    ['Ceiling Fan', 'Energy-efficient ceiling fan with remote.', 'https://via.placeholder.com/400x180?text=Fan', 79.99, 20],
    ['LED Bulb', 'Long-lasting LED bulb, 9W.', 'https://via.placeholder.com/400x180?text=Bulb', 5.99, 200],
  ];

  for (const [name, description, imageUrl, price, quantity] of products) {
    const exists = await db.query('SELECT id FROM products WHERE name = ?', [name]);
    if (exists.rows.length === 0) {
      await db.query(
        'INSERT INTO products (name, description, image_url, base_price, quantity) VALUES (?, ?, ?, ?, ?)',
        [name, description, imageUrl, price, quantity]
      );
    }
  }
};

const run = async () => {
  try {
    await createTables();
    await seedData();
    console.log('Database setup complete.');
    process.exit(0);
  } catch (err) {
    console.error('Setup error:', err);
    process.exit(1);
  }
};

run();
