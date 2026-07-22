const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const { getUsers, createUser, updateUser } = require('../models/userModel');
const { getPriceOverridesForUser, upsertPriceOverride } = require('../models/priceOverrideModel');
const { getProducts, createProduct, updateProduct } = require('../models/productModel');
const { createAuditLog, getAuditLogs } = require('../models/auditLogModel');

const router = express.Router();

router.use(requireAuth, requireAdmin);

const logAction = (req, { action, targetType, targetId, details }) =>
  createAuditLog({
    actorId: req.user.id,
    actorEmail: req.user.email,
    action,
    targetType,
    targetId,
    details,
  });

router.get('/users', async (req, res, next) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/users',
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['buyer', 'admin']),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password, role } = req.body;
      const user = await createUser({
        name,
        email,
        passwordHash: await bcrypt.hash(password, 10),
        role,
      });
      await logAction(req, { action: 'user.create', targetType: 'user', targetId: user.id, details: { name, email, role } });
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/users/:id',
  body('name').notEmpty(),
  body('email').isEmail(),
  body('role').isIn(['buyer', 'admin']),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const updated = await updateUser(req.params.id, req.body);
      await logAction(req, { action: 'user.update', targetType: 'user', targetId: Number(req.params.id), details: req.body });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/users/:id/price-overrides', async (req, res, next) => {
  try {
    const overrides = await getPriceOverridesForUser(req.params.id);
    res.json(overrides);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/price-overrides',
  body('userId').isInt(),
  body('productId').isInt(),
  body('overridePrice').isFloat({ gt: 0 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const override = await upsertPriceOverride(req.body);
      await logAction(req, {
        action: 'price_override.set',
        targetType: 'product',
        targetId: req.body.productId,
        details: { userId: req.body.userId, overridePrice: req.body.overridePrice },
      });
      res.status(201).json(override);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/products', async (req, res, next) => {
  try {
    const products = await getProducts({ activeOnly: false });
    res.json(products);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/products',
  body('name').notEmpty(),
  body('basePrice').isFloat({ gt: 0 }),
  body('quantity').isInt({ min: 0 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, imageUrl, basePrice, quantity, active } = req.body;
      const product = await createProduct({
        name,
        description,
        imageUrl,
        basePrice,
        quantity,
        active: active !== false,
      });
      await logAction(req, { action: 'product.create', targetType: 'product', targetId: product.id, details: req.body });
      res.status(201).json(product);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/products/:id',
  body('name').notEmpty(),
  body('basePrice').isFloat({ gt: 0 }),
  body('quantity').isInt({ min: 0 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, imageUrl, basePrice, quantity, active } = req.body;
      const product = await updateProduct(req.params.id, {
        name,
        description,
        imageUrl,
        basePrice,
        quantity,
        active: active !== false,
      });
      await logAction(req, { action: 'product.update', targetType: 'product', targetId: Number(req.params.id), details: req.body });
      res.json(product);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/audit-logs', async (req, res, next) => {
  try {
    const logs = await getAuditLogs();
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
