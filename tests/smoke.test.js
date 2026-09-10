const fs = require('fs');
const path = require('path');

// Regression guard for the historical bug where a model function (decrementProductQuantity)
// was called from a route but never exported, crashing checkout only at runtime.
// This statically checks every `<localName>.<fn>(` call in routes/*.js against the actual
// exports of the model file it was required from.

const modelsDir = path.join(__dirname, '..', 'src', 'models');
const routesDir = path.join(__dirname, '..', 'src', 'routes');

const modelFiles = fs.readdirSync(modelsDir).filter((f) => f.endsWith('.js'));
const models = {};
for (const file of modelFiles) {
  const key = file.replace('.js', '');
  models[key] = require(path.join(modelsDir, file));
}

const routeFiles = fs.existsSync(routesDir)
  ? fs.readdirSync(routesDir).filter((f) => f.endsWith('.js'))
  : [];

describe('model export completeness (guards missing-export regressions)', () => {
  if (routeFiles.length === 0) {
    test('no route files yet', () => {
      expect(true).toBe(true);
    });
    return;
  }

  for (const routeFile of routeFiles) {
    test(`${routeFile}: every referenced model function is actually exported`, () => {
      const content = fs.readFileSync(path.join(routesDir, routeFile), 'utf8');

      const requireRegex = /const\s+(\w+)\s*=\s*require\(['"]\.\.\/models\/(\w+)['"]\)/g;
      const localToModel = {};
      let reqMatch;
      while ((reqMatch = requireRegex.exec(content))) {
        localToModel[reqMatch[1]] = reqMatch[2];
      }

      const missing = [];
      for (const [localName, modelKey] of Object.entries(localToModel)) {
        const modelExports = models[modelKey];
        expect(modelExports).toBeDefined();

        const callRegex = new RegExp(`\\b${localName}\\.(\\w+)\\s*\\(`, 'g');
        let callMatch;
        while ((callMatch = callRegex.exec(content))) {
          const fnName = callMatch[1];
          if (typeof modelExports[fnName] !== 'function') {
            missing.push(`${modelKey}.${fnName}`);
          }
        }
      }

      expect(missing).toEqual([]);
    });
  }
});
