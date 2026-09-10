const { get, all, run } = require('../db');

async function getOverrideForUserProduct(userId, productId) {
  return get(
    'SELECT id, user_id, product_id, override_price, created_at FROM price_overrides WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );
}

async function getOverridesForUser(userId) {
  return all(
    'SELECT id, user_id, product_id, override_price, created_at FROM price_overrides WHERE user_id = ?',
    [userId]
  );
}

async function upsertPriceOverride({ userId, productId, overridePrice }) {
  await run(
    `INSERT INTO price_overrides (user_id, product_id, override_price)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id, product_id) DO UPDATE SET override_price = excluded.override_price`,
    [userId, productId, overridePrice]
  );
  return getOverrideForUserProduct(userId, productId);
}

async function deletePriceOverride(id) {
  await run('DELETE FROM price_overrides WHERE id = ?', [id]);
}

module.exports = {
  getOverrideForUserProduct,
  getOverridesForUser,
  upsertPriceOverride,
  deletePriceOverride,
};
