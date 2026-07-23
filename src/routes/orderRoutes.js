const express = require('express');
const { body, param } = require('express-validator');

const orderModel = require('../models/orderModel');
const productModel = require('../models/productModel');
const userModel = require('../models/userModel');
const auditLogModel = require('../models/auditLogModel');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const asyncHandler = require('../utils/asyncHandler');
const { getEffectivePrice } = require('../utils/pricing');
const { transaction } = require('../db');
const { emitNewOrder } = require('../sockets/socket');
const { sendNewOrderEmail } = require('../utils/mailer');

const router = express.Router();

router.post(
  '/',
  requireAuth,
  [
    body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array'),
    body('items.*.productId').isInt({ min: 1 }).withMessage('productId must be a positive integer'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('quantity must be a positive integer'),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { items } = req.body;

    const lines = [];
    for (const item of items) {
      const product = productModel.getProductById(item.productId);
      if (!product || !product.active) {
        return res.status(400).json({ message: `Product ${item.productId} is not available` });
      }
      if (item.quantity > product.quantity) {
        return res.status(400).json({ message: `Insufficient stock for "${product.name}"` });
      }
      const price = getEffectivePrice(req.user, product);
      lines.push({ product, price, quantity: item.quantity });
    }

    const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

    const placeOrder = transaction(() => {
      const order = orderModel.createOrder({ buyerId: req.user.id, total });
      for (const line of lines) {
        orderModel.createOrderItem({
          orderId: order.id,
          productId: line.product.id,
          price: line.price,
          quantity: line.quantity,
        });
        productModel.decrementProductQuantity(line.product.id, line.quantity);
      }
      return order;
    });

    const order = placeOrder();

    const buyer = userModel.findById(req.user.id);
    const io = req.app.get('io');
    emitNewOrder(io, {
      orderId: order.id,
      buyerId: buyer.id,
      buyerName: buyer.name,
      total: order.total,
      createdAt: order.created_at,
    });
    sendNewOrderEmail({ orderId: order.id, buyerName: buyer.name, buyerEmail: buyer.email, total: order.total }).catch(
      () => {}
    );

    res.status(201).json(order);
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(orderModel.getOrdersByBuyer(req.user.id));
  })
);

router.get(
  '/',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json(orderModel.getAllOrders());
  })
);

router.get(
  '/:orderId/items',
  requireAuth,
  [param('orderId').isInt({ min: 1 })],
  validateRequest,
  asyncHandler(async (req, res) => {
    const order = orderModel.getOrderById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.buyer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }
    res.json(orderModel.getOrderItems(order.id));
  })
);

router.patch(
  '/:orderId/status',
  requireAuth,
  requireAdmin,
  [
    param('orderId').isInt({ min: 1 }),
    body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const order = orderModel.getOrderById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const updated = orderModel.updateOrderStatus(order.id, req.body.status);

    auditLogModel.createAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      action: 'order.status_update',
      targetType: 'order',
      targetId: order.id,
      details: { status: req.body.status },
    });

    res.json(updated);
  })
);

module.exports = router;
