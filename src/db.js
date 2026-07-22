const { run, all, exec } = require('./db_sqlite');

module.exports = {
  query: async (text, params = []) => {
    const normalized = text.trim().toLowerCase();
    if (normalized.startsWith('select') || normalized.startsWith('pragma')) {
      const rows = await all(text, params);
      return { rows };
    }
    if (normalized.startsWith('create table')) {
      await exec(text);
      return { rows: [] };
    }
    const result = await run(text, params);
    return { rows: [], lastID: result.lastID, changes: result.changes };
  },
};
