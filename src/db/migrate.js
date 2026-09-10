const fs = require('fs');
const path = require('path');
const { execRaw } = require('./index');

async function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await execRaw(schema);
}

module.exports = migrate;

if (require.main === module) {
  migrate()
    .then(() => console.log('Migration complete.'))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
