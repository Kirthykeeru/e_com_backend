const db = require('./connection');

function get(sql, params = []) {
  return db.prepare(sql).get(...params);
}

function all(sql, params = []) {
  return db.prepare(sql).all(...params);
}

function run(sql, params = []) {
  return db.prepare(sql).run(...params);
}

// node:sqlite has no built-in transaction helper (unlike better-sqlite3), so wrap
// BEGIN/COMMIT/ROLLBACK manually. Matches better-sqlite3's `db.transaction(fn)` calling
// convention: returns a function that runs fn atomically when invoked.
function transaction(fn) {
  return (...args) => {
    db.exec('BEGIN');
    try {
      const result = fn(...args);
      db.exec('COMMIT');
      return result;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  };
}

module.exports = { db, get, all, run, transaction };
