require('dotenv').config();
const bcrypt = require('bcryptjs');
const migrate = require('./migrate');
const { get, run } = require('./index');

const SAMPLE_PRODUCTS = [
  { name: 'LED Bulb 9W', description: 'Energy-efficient cool white LED bulb', image_url: '/products/led-bulb.svg', base_price: 4.99, quantity: 200 },
  { name: 'Modular Switch (1-gang)', description: 'White modular light switch, single gang', image_url: '/products/switch.svg', base_price: 2.49, quantity: 500 },
  { name: 'Ceiling Fan 48in', description: '3-blade ceiling fan with remote', image_url: '/products/ceiling-fan.svg', base_price: 39.99, quantity: 60 },
  { name: 'Extension Board (4-socket)', description: '6A extension board with surge protection', image_url: '/products/extension-board.svg', base_price: 12.5, quantity: 150 },
  { name: 'MCB 32A', description: 'Single pole miniature circuit breaker', image_url: '/products/mcb.svg', base_price: 6.75, quantity: 300 },
  { name: 'Smart Plug', description: 'Wi-Fi smart plug, app + voice control', image_url: '/products/smart-plug.svg', base_price: 14.99, quantity: 90 },
];

async function seed() {
  await migrate();

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@electric.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';

  const existingAdmin = await get('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (!existingAdmin) {
    const passwordHash = bcrypt.hashSync(adminPassword, 10);
    await run(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Admin', adminEmail, passwordHash, 'admin']
    );
    console.log(`Seeded admin user: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log('Admin user already exists, skipping.');
  }

  const { count: productCount } = await get('SELECT COUNT(*) AS count FROM products');
  if (productCount === 0) {
    for (const p of SAMPLE_PRODUCTS) {
      await run(
        'INSERT INTO products (name, description, image_url, base_price, quantity, active) VALUES (?, ?, ?, ?, ?, 1)',
        [p.name, p.description, p.image_url, p.base_price, p.quantity]
      );
    }
    console.log(`Seeded ${SAMPLE_PRODUCTS.length} products.`);
  } else {
    console.log('Products already exist, skipping.');
  }
}

module.exports = seed;

if (require.main === module) {
  seed()
    .then(() => console.log('Seed complete.'))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
