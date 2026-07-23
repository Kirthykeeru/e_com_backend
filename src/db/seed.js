require('dotenv').config();
const bcrypt = require('bcryptjs');
const migrate = require('./migrate');
const { get, run } = require('./index');

const SAMPLE_PRODUCTS = [
  { name: 'LED Bulb 9W', description: 'Energy-efficient cool white LED bulb', image_url: '', base_price: 4.99, quantity: 200 },
  { name: 'Modular Switch (1-gang)', description: 'White modular light switch, single gang', image_url: '', base_price: 2.49, quantity: 500 },
  { name: 'Ceiling Fan 48in', description: '3-blade ceiling fan with remote', image_url: '', base_price: 39.99, quantity: 60 },
  { name: 'Extension Board (4-socket)', description: '6A extension board with surge protection', image_url: '', base_price: 12.5, quantity: 150 },
  { name: 'MCB 32A', description: 'Single pole miniature circuit breaker', image_url: '', base_price: 6.75, quantity: 300 },
  { name: 'Smart Plug', description: 'Wi-Fi smart plug, app + voice control', image_url: '', base_price: 14.99, quantity: 90 },
];

function seed() {
  migrate();

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@electric.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';

  const existingAdmin = get('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (!existingAdmin) {
    const passwordHash = bcrypt.hashSync(adminPassword, 10);
    run(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Admin', adminEmail, passwordHash, 'admin']
    );
    console.log(`Seeded admin user: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log('Admin user already exists, skipping.');
  }

  const productCount = get('SELECT COUNT(*) AS count FROM products').count;
  if (productCount === 0) {
    for (const p of SAMPLE_PRODUCTS) {
      run(
        'INSERT INTO products (name, description, image_url, base_price, quantity, active) VALUES (?, ?, ?, ?, ?, 1)',
        [p.name, p.description, p.image_url, p.base_price, p.quantity]
      );
    }
    console.log(`Seeded ${SAMPLE_PRODUCTS.length} products.`);
  } else {
    console.log('Products already exist, skipping.');
  }
}

seed();

if (require.main === module) {
  console.log('Seed complete.');
}

module.exports = seed;
