/**
 * SchemaGuard - Generate TypeScript type guards from database schemas
 *
 * @example
 * import { parseSql, generateAllTypes } from 'schemaguard';
 *
 * const sql = `CREATE TABLE users (id SERIAL PRIMARY KEY, email VARCHAR(255) NOT NULL);`;
 * const tables = parseSql(sql);
 * const guards = generateAllTypes(tables);
 * console.log(guards);
 */
export { parseSql } from './parser/sql-parser';
export { generateAllTypes } from './generator/guard-builder';
//# sourceMappingURL=index.js.map