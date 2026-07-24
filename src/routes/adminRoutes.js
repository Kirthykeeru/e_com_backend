const express = require('express');
const bcrypt = require('bcryptjs');
const { body, param } = require('express-validator');

const userModel = require('../models/userModel');
const productModel = require('../models/productModel');
const priceOverrideModel = require('../models/priceOverrideModel');
const auditLogModel = require('../models/auditLogModel');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const asyncHandler = require('../utils/asyncHandler');
const serializeUser = require('../utils/serializeUser');

const router = express.Router();

router.use(requireAuth, requireAdmin);

async function logAction(req, { action, targetType, targetId, details }) {
  await auditLogModel.createAuditLog({
    actorId: req.user.id,
    actorEmail: req.user.email,
    action,
    targetType,
    targetId,
    details,
  });
}

// ---- Users ----

router.get(
  '/users',
  asyncHandler(async (req, res) => {
    res.json(await userModel.getUsers());
  })
);

router.post(
  '/users',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['buyer', 'admin']),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    const existing = await userModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userModel.createUser({ name, email, passwordHash, role });

    await logAction(req, { action: 'user.create', targetType: 'user', targetId: user.id, details: { name, email, role } });

    res.status(201).json(serializeUser(user));
  })
);

router.put(
  '/users/:id',
  [param('id').isInt({ min: 1 }), body('name').trim().notEmpty(), body('email').isEmail().normalizeEmail(), body('role').isIn(['buyer', 'admin'])],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { name, email, role } = req.body;
    const existing = await userModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'User not found' });

    const user = await userModel.updateUser(req.params.id, { name, email, role });

    await logAction(req, { action: 'user.update', targetType: 'user', targetId: user.id, details: { name, email, role } });

    res.json(serializeUser(user));
  })
);

router.put(
  '/users/:id/password',
  [param('id').isInt({ min: 1 }), body('password').isLength({ min: 6 })],
  validateRequest,
  asyncHandler(async (req, res) => {
    const existing = await userModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'User not found' });

    const passwordHash = await bcrypt.hash(req.body.password, 10);
    await userModel.setPassword(req.params.id, passwordHash);

    // Never store the plaintext password in the audit log.
    await logAction(req, { action: 'user.password_reset', targetType: 'user', targetId: Number(req.params.id), details: {} });

    res.json({ message: 'Password updated' });
  })
);

// ---- Products ----

router.get(
  '/products',
  asyncHandler(async (req, res) => {
    res.json(await productModel.getProducts({ activeOnly: false }));
  })
);

router.post(
  '/products',
  [
    body('name').trim().notEmpty(),
    body('basePrice').isFloat({ min: 0 }),
    body('quantity').isInt({ min: 0 }),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { name, description, imageUrl, basePrice, quantity, active } = req.body;
    const product = await productModel.createProduct({ name, description, imageUrl, basePrice, quantity, active });

    await logAction(req, { action: 'product.create', targetType: 'product', targetId: product.id, details: { name, basePrice, quantity } });

    res.status(201).json(product);
  })
);

router.put(
  '/products/:id',
  [
    param('id').isInt({ min: 1 }),
    body('name').trim().notEmpty(),
    body('basePrice').isFloat({ min: 0 }),
    body('quantity').isInt({ min: 0 }),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const existing = await productModel.getProductById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Product not found' });

    const { name, description, imageUrl, basePrice, quantity } = req.body;
    const product = await productModel.updateProduct(req.params.id, { name, description, imageUrl, basePrice, quantity });

    await logAction(req, { action: 'product.update', targetType: 'product', targetId: product.id, details: { name, basePrice, quantity } });

    res.json(product);
  })
);

router.put(
  '/products/:id/active',
  [param('id').isInt({ min: 1 }), body('active').isBoolean()],
  validateRequest,
  asyncHandler(async (req, res) => {
    const existing = await productModel.getProductById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Product not found' });

    const product = await productModel.setProductActive(req.params.id, req.body.active);

    await logAction(req, {
      action: req.body.active ? 'product.activate' : 'product.deactivate',
      targetType: 'product',
      targetId: product.id,
      details: { active: req.body.active },
    });

    res.json(product);
  })
);

// ---- Price overrides ----

router.get(
  '/users/:id/price-overrides',
  [param('id').isInt({ min: 1 })],
  validateRequest,
  asyncHandler(async (req, res) => {
    res.json(await priceOverrideModel.getOverridesForUser(req.params.id));
  })
);

router.post(
  '/price-overrides',
  [body('userId').isInt({ min: 1 }), body('productId').isInt({ min: 1 }), body('overridePrice').isFloat({ min: 0 })],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { userId, productId, overridePrice } = req.body;

    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const product = await productModel.getProductById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const override = await priceOverrideModel.upsertPriceOverride({ userId, productId, overridePrice });

    await logAction(req, {
      action: 'price_override.set',
      targetType: 'price_override',
      targetId: override.id,
      details: { userId, productId, overridePrice },
    });

    res.status(201).json(override);
  })
);

router.delete(
  '/price-overrides/:id',
  [param('id').isInt({ min: 1 })],
  validateRequest,
  asyncHandler(async (req, res) => {
    await priceOverrideModel.deletePriceOverride(req.params.id);

    await logAction(req, { action: 'price_override.remove', targetType: 'price_override', targetId: Number(req.params.id) });

    res.status(204).send();
  })
);

// ---- Audit logs ----

router.get(
  '/audit-logs',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    res.json(await auditLogModel.getAuditLogs({ page, limit }));
  })
);

module.exports = router;
