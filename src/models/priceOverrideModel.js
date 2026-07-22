const db = require('../db');

const getPriceOverridesForUser = async (userId) => {
  const result = await db.query(
    'SELECT id, user_id, product_id, override_price FROM price_overrides WHERE user_id = ?',
    [userId]
  );
  return result.rows;
};

const getOverrideForUserProduct = async (userId, productId) => {
  const result = await db.query(
    'SELECT override_price FROM price_overrides WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );
  return result.rows[0];
};

const upsertPriceOverride = async ({ userId, productId, overridePrice }) => {
  await db.query(
    `INSERT INTO price_overrides (user_id, product_id, override_price)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id, product_id)
     DO UPDATE SET override_price = excluded.override_price`,
    [userId, productId, overridePrice]
  );
  const result = await db.query('SELECT id, user_id, product_id, override_price FROM price_overrides WHERE user_id = ? AND product_id = ?', [userId, productId]);
  return result.rows[0];
};

module.exports = { getPriceOverridesForUser, getOverrideForUserProduct, upsertPriceOverride };
