const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

function resolveDbPath() {
  if (process.env.DB_PATH) return process.env.DB_PATH;
  const dataDir = path.join(__dirname, '..', '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  return path.join(dataDir, 'electric_shop.sqlite');
}

const db = new DatabaseSync(resolveDbPath());
db.exec('PRAGMA foreign_keys = ON');

module.exports = db;
