const path = require('path');
const fs = require('fs');

function resolveLocalPath() {
  if (process.env.DB_PATH) return process.env.DB_PATH;
  const dataDir = path.join(__dirname, '..', '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  return path.join(dataDir, 'electric_shop.sqlite');
}

// Local dev/tests use node:sqlite directly against a file (or ':memory:'). Production
// points TURSO_DATABASE_URL at a hosted libSQL/Turso database for storage that survives
// restarts on free hosting tiers, where the local filesystem is wiped on every redeploy.
function createDriver() {
  if (process.env.TURSO_DATABASE_URL) {
    const { createClient } = require('@libsql/client');
    return {
      kind: 'libsql',
      client: createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }),
    };
  }

  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(resolveLocalPath());
  db.exec('PRAGMA foreign_keys = ON');
  return { kind: 'sqlite', db };
}

module.exports = createDriver();
