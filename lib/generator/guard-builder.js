/**
 * Guard Builder - Generates TypeScript type guards from parsed schema AST
 */

const TYPE_MAP = {
  INT: 'number',
  INTEGER: 'number',
  BIGINT: 'number',
  SMALLINT: 'number',
  SERIAL: 'number',
  BIGSERIAL: 'number',
  REAL: 'number',
  DOUBLE: 'number',
  FLOAT: 'number',
  DECIMAL: 'number',
  NUMERIC: 'number',
  VARCHAR: 'string',
  CHAR: 'string',
  CHARACTER: 'string',
  TEXT: 'string',
  BOOLEAN: 'boolean',
  BOOL: 'boolean',
  DATE: 'string',
  TIMESTAMP: 'string',
  TIMESTAMPTZ: 'string',
  TIME: 'string',
  TIMETZ: 'string',
  UUID: 'string',
  JSON: 'object',
  JSONB: 'object',
  BYTEA: 'Uint8Array',
  // Prisma scalar types
  STRING: 'string',
  DATETIME: 'string',
  BYTES: 'Uint8Array',
};

function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function toPascalCase(str) {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function mapSqlType(sqlType) {
  const upper = sqlType.toUpperCase();
  
  if (TYPE_MAP[upper]) {
    return TYPE_MAP[upper];
  }
  
  const baseType = upper.replace(/\(.*\)/, '');
  if (TYPE_MAP[baseType]) {
    return TYPE_MAP[baseType];
  }
  
  return 'unknown';
}

function generateTypeGuard(table) {
  const { columns } = table;
  const typeName = toPascalCase(table.name);
  
  // Generate type definition
  const typeLines = columns.map(f => {
    const fieldName = toCamelCase(f.name);
    const tsType = mapSqlType(f.dataType);
    const optional = f.nullable ? '?' : '';
    return `  ${fieldName}${optional}: ${tsType};`;
  });
  
  // Generate type guard function
  const checks = columns.map(f => {
    const fieldName = toCamelCase(f.name);
    const fieldAccess = `o.${fieldName}`;
    const tsType = mapSqlType(f.dataType);
    
    if (f.nullable) {
      return `${fieldAccess} === undefined || ${fieldAccess} === null || typeof ${fieldAccess} === "${tsType === 'object' ? 'object' : tsType}"`;
    }
    
    if (tsType === 'object') {
      return `${fieldAccess} !== undefined && ${fieldAccess} !== null && typeof ${fieldAccess} === "object"`;
    }
    
    return `typeof ${fieldAccess} === "${tsType}"`;
  });
  
  const output = [
    `export type ${typeName} = {`,
    ...typeLines,
    '};',
    '',
    `export const is${typeName} = (obj: unknown): obj is ${typeName} => {`,
    '  if (!obj || typeof obj !== "object") return false;',
    '  const o = obj as Record<string, unknown>;',
    '  return (',
    checks.map(c => `    ${c}`).join(' &&\n'),
    '  );',
    '};',
  ];
  
  return output.join('\n');
}

function generateAllTypes(tables) {
  // Split tables and enums
  const tablesList = tables.filter(t => t.type !== 'enum');
  const enums = tables.filter(t => t.type === 'enum');
  
  const guards = tablesList.map(t => generateTypeGuard(t));
  
  // Generate enum types
  for (const e of enums) {
    const typeName = toPascalCase(e.name);
    const values = e.values.map(v => `  '${v}'`).join(' |\n');
    guards.push(`export type ${typeName} = \n${values};`);
    guards.push(`export const is${typeName} = (v: unknown): v is ${typeName} => \n  ${e.values.map(v => `v === '${v}'`).join(' || ')};`);
  }
  
  return guards.join('\n\n');
}

module.exports = {
  generateTypeGuard,
  generateAllTypes,
  mapSqlType,
  toCamelCase,
  toPascalCase,
};