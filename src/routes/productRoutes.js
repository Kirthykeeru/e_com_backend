const express = require('express');
const { authenticateOptional } = require('../middleware/authMiddleware');
const { getProducts } = require('../models/productModel');
const { getOverrideForUserProduct } = require('../models/priceOverrideModel');

const router = express.Router();

router.get('/', authenticateOptional, async (req, res, next) => {
  try {
    const products = await getProducts({ activeOnly: true });

    if (req.user?.role === 'buyer') {
      const pricedProducts = await Promise.all(
        products.map(async (product) => {
          const override = await getOverrideForUserProduct(req.user.id, product.id);
          return {
            ...product,
            price: override ? override.override_price : product.base_price,
          };
        })
      );
      return res.json(pricedProducts);
    }

    res.json(products.map((product) => ({ ...product, price: product.base_price })));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
