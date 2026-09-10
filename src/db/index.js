const driver = require('./connection');

function toObject(columns, row) {
  const obj = {};
  columns.forEach((col, i) => {
    obj[col] = row[i];
  });
  return obj;
}

async function get(sql, params = []) {
  if (driver.kind === 'sqlite') {
    return driver.db.prepare(sql).get(...params);
  }
  const rs = await driver.client.execute({ sql, args: params });
  return rs.rows.length ? toObject(rs.columns, rs.rows[0]) : undefined;
}

async function all(sql, params = []) {
  if (driver.kind === 'sqlite') {
    return driver.db.prepare(sql).all(...params);
  }
  const rs = await driver.client.execute({ sql, args: params });
  return rs.rows.map((row) => toObject(rs.columns, row));
}

async function run(sql, params = []) {
  if (driver.kind === 'sqlite') {
    return driver.db.prepare(sql).run(...params);
  }
  const rs = await driver.client.execute({ sql, args: params });
  return { lastInsertRowid: Number(rs.lastInsertRowid), changes: rs.rowsAffected };
}

// Runs a raw multi-statement SQL script (used only by migrate.js for schema.sql).
async function execRaw(sql) {
  if (driver.kind === 'sqlite') {
    driver.db.exec(sql);
    return;
  }
  await driver.client.executeMultiple(sql);
}

async function transaction(fn) {
  if (driver.kind === 'sqlite') {
    driver.db.exec('BEGIN');
    try {
      const result = await fn({ get, all, run });
      driver.db.exec('COMMIT');
      return result;
    } catch (err) {
      driver.db.exec('ROLLBACK');
      throw err;
    }
  }

  const tx = await driver.client.transaction('write');
  const txGet = async (sql, params = []) => {
    const rs = await tx.execute({ sql, args: params });
    return rs.rows.length ? toObject(rs.columns, rs.rows[0]) : undefined;
  };
  const txAll = async (sql, params = []) => {
    const rs = await tx.execute({ sql, args: params });
    return rs.rows.map((row) => toObject(rs.columns, row));
  };
  const txRun = async (sql, params = []) => {
    const rs = await tx.execute({ sql, args: params });
    return { lastInsertRowid: Number(rs.lastInsertRowid), changes: rs.rowsAffected };
  };
  try {
    const result = await fn({ get: txGet, all: txAll, run: txRun });
    await tx.commit();
    return result;
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

module.exports = { get, all, run, transaction, execRaw };
