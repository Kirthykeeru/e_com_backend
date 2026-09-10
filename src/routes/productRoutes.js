const express = require('express');

const productModel = require('../models/productModel');
const { authenticateOptional } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const { getEffectivePrice } = require('../utils/pricing');

const router = express.Router();

router.get(
  '/',
  authenticateOptional,
  asyncHandler(async (req, res) => {
    const products = await productModel.getProducts({ activeOnly: true });
    const priced = await Promise.all(
      products.map(async (product) => ({ ...product, price: await getEffectivePrice(req.user, product) }))
    );
    res.json(priced);
  })
);

module.exports = router;
