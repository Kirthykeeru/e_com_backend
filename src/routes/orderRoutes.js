const express = require('express');
const { body, validationResult } = require('express-validator');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const { createOrder, createOrderItem, getOrders, getOrdersByBuyer, getOrderItems } = require('../models/orderModel');
const { getProductById, decrementProductQuantity } = require('../models/productModel');
const { getOverrideForUserProduct } = require('../models/priceOverrideModel');

const router = express.Router();

router.post(
  '/',
  requireAuth,
  body('items').isArray({ min: 1 }),
  body('items.*.productId').isInt(),
  body('items.*.quantity').isInt({ min: 1 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const buyerId = req.user.id;
      const items = req.body.items;

      let total = 0;
      const prepared = [];

      for (const item of items) {
        const product = await getProductById(item.productId);
        if (!product) {
          return res.status(404).json({ message: `Product ${item.productId} not found` });
        }
        if (item.quantity > product.quantity) {
          return res.status(400).json({ message: `Insufficient quantity for ${product.name}` });
        }
        const override = await getOverrideForUserProduct(buyerId, item.productId);
        const price = override ? override.override_price : product.base_price;
        total += price * item.quantity;
        prepared.push({ productId: item.productId, quantity: item.quantity, price });
      }

      const order = await createOrder({ buyerId, total });
      await Promise.all(
        prepared.map(async (item) => {
          await createOrderItem({ orderId: order.id, ...item });
          await decrementProductQuantity(item.productId, item.quantity);
        })
      );

      const io = req.app.get('io');
      if (io) {
        io.emit('newOrder', { orderId: order.id, buyerId, total });
      }

      res.status(201).json(order);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const orders = await getOrdersByBuyer(req.user.id);
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const orders = await getOrders();
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

router.get('/:orderId/items', requireAuth, async (req, res, next) => {
  try {
    const items = await getOrderItems(req.params.orderId);
    res.json(items);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
