const express = require('express');
const { body, validationResult } = require('express-validator');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const { getUsers, createUser, updateUser } = require('../models/userModel');
const { getPriceOverridesForUser, upsertPriceOverride } = require('../models/priceOverrideModel');

const router = express.Router();

router.use(requireAuth, requireAdmin);

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
        passwordHash: await require('bcrypt').hash(password, 10),
        role,
      });
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
      res.status(201).json(override);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
