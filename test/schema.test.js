/**
 * SchemaGuard End-to-End Test
 * Tests real CLI flow on sample inputs
 */

const { execSync } = require('child_process');
const { writeFileSync, unlinkSync } = require('fs');

const CLI = 'node bin/schemaguard';

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', cwd: __dirname + '/..' });
  } catch (e) {
    return e.stdout || e.message;
  }
}

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`);
    process.exitCode = 1;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

// Test: PostgreSQL generates valid types
test('PostgreSQL: generates type guards', () => {
  const sql = `CREATE TABLE users (id SERIAL PRIMARY KEY, email VARCHAR(255) NOT NULL, name VARCHAR(100));`;
  writeFileSync('/tmp/test.sql', sql);
  const out = run(`${CLI} generate -i /tmp/test.sql`);
  assert(out.includes('export type Users'), 'Missing Users type');
  assert(out.includes('export const isUsers'), 'Missing isUsers guard');
  unlinkSync('/tmp/test.sql');
});

// Test: MySQL generates valid types
test('MySQL: generates type guards', () => {
  const sql = `CREATE TABLE products (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, price DECIMAL(10,2));`;
  writeFileSync('/tmp/test.sql', sql);
  const out = run(`${CLI} generate -i /tmp/test.sql`);
  assert(out.includes('export type Products'), 'Missing Products type');
  assert(out.includes('id: number'), 'Missing id type');
  unlinkSync('/tmp/test.sql');
});

// Test: ENUM generates union type
test('ENUM: generates union type', () => {
  const sql = `CREATE TYPE status AS ENUM ('active', 'inactive', 'pending');`;
  writeFileSync('/tmp/test.sql', sql);
  const out = run(`${CLI} generate -i /tmp/test.sql`);
  assert(out.includes("'active'"), 'Missing active value');
  assert(out.includes("'inactive'"), 'Missing inactive value');
  unlinkSync('/tmp/test.sql');
});

// Test: Prisma generates type guards
test('Prisma: generates type guards', () => {
  const schema = `model User { id Int @id email String name String? }`;
  writeFileSync('/tmp/test.prisma', schema);
  const out = run(`${CLI} generate -i /tmp/test.prisma --prisma`);
  assert(out.includes('export type User'), 'Missing User type');
  assert(out.includes('email: string'), 'Missing email field');
  unlinkSync('/tmp/test.prisma');
});

// Test: Error on invalid syntax
test('Error: fails on invalid syntax', () => {
  const sql = `CREATE DATABASE test`;
  writeFileSync('/tmp/test.sql', sql);
  const result = run(`${CLI} generate -i /tmp/test.sql`);
  assert(result.includes('Error') || result.includes('Expected'), 'Should report error');
  unlinkSync('/tmp/test.sql');
});

console.log('\n✅ All tests complete!');
