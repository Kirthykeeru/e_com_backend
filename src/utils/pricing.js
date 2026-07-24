const priceOverrideModel = require('../models/priceOverrideModel');

// Single source of truth for "effective price": override price if the caller is an
// authenticated buyer with one set, else the product's base price. Used identically
// by the catalog display and checkout so they can never diverge.
async function getEffectivePrice(user, product) {
  if (user && user.role === 'buyer') {
    const override = await priceOverrideModel.getOverrideForUserProduct(user.id, product.id);
    if (override) return override.override_price;
  }
  return product.base_price;
}

module.exports = { getEffectivePrice };
