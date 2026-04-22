/**
 * PostgreSQL Migration Recipe
 * Run after: knex, prisma, node-pg-migrate, db-migrate, db-migrate-pg
 * 
 * @example
 * // After your migration runs
 * const { afterMigration } = require('schemaguard/migrate');
 * await afterMigration({ schema: './schema.sql' });
 */

// Common post-migration patterns
module.exports = {
  // Prisma
  prisma: async (output = 'schema.ts') => {
    const { execSync } = require('child_process');
    execSync('npx prisma db pull --print > schema.sql', { stdio: 'inherit' });
    const { generate } = require('../lib/index.js');
    await generate({ input: 'schema.sql', output });
  },
  
  // Knex
  knex: async (knex, output = 'schema.ts') => {
    const fs = require('fs');
    fs.writeFileSync('schema.sql', await knex.raw('SELECT table_name FROM information_schema.tables'));
    const { generate } = require('../lib/index.js');
    await generate({ input: 'schema.sql', output });
  },
  
  // Raw SQL migration
  sql: async (conn, table = 'information_schema.tables', output = 'schema.ts') => {
    const { generate } = require('../lib/index.js');
    // Export from pg connection
    await generate({ input: 'schema.sql', output });
  },
};
