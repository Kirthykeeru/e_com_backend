const express = require('express');
const { get } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await get('SELECT 1 AS ok');
    res.json({ status: 'ok', db: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'error' });
  }
});

module.exports = router;
