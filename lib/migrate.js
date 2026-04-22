/**
 * Migrator Hooks - Run SchemaGuard after database migrations
 * Usage: require('schemaguard/migrate') after your migration
 */

module.exports = async function afterMigration(opts = {}) {
  const { generate } = require('./index.js');
  
  try {
    await generate({
      input: opts.schema || opts.input || 'schema.sql',
      output: opts.output || 'schema.ts',
      format: opts.format || 'esm',
    });
    console.log('✅ SchemaGuard: types updated after migration');
  } catch (e) {
    if (opts.silent) return;
    console.error('⚠️  SchemaGuard: type update failed:', e.message);
  }
};
