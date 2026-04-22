/**
 * Mock data generator from schema
 * Usage: const { generateMock, generateAllMocks } = require('schemaguard/mock');
 */

const SEED_VALUES = {
  string: () => 'test_' + Math.random().toString(36).slice(2, 8),
  number: () => Math.floor(Math.random() * 1000),
  boolean: () => Math.random() > 0.5,
  object: () => ({ nested: 'value' }),
  Uint8Array: () => new Uint8Array([1, 2, 3]),
};

function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function generateMock(table, opts = {}) {
  const { columns } = table;
  const mock = {};
  const TYPE_MAP = { INT:'number', INTEGER:'number', BIGINT:'number', SERIAL:'number', VARCHAR:'string', TEXT:'string', BOOLEAN:'boolean', DATE:'string', TIMESTAMP:'string', UUID:'string', JSON:'object', JSONB:'object' };
  
  for (const col of columns) {
    const fieldName = toCamelCase(col.name);
    const tsType = TYPE_MAP[col.dataType?.toUpperCase()] || 'string';
    if (opts.nullable && Math.random() < 0.2) mock[fieldName] = null;
    else if (SEED_VALUES[tsType]) mock[fieldName] = SEED_VALUES[tsType]();
    else mock[fieldName] = tsType;
  }
  return mock;
}

function generateAllMocks(tables) {
  return tables.map(t => ({ name: t.name, mock: generateMock(t) }));
}

module.exports = { generateMock, generateAllMocks };
