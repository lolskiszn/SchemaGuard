/**
 * Guard Builder - Generates TypeScript type guards from parsed schema AST
 * Internal implementation detail: builds type definitions and validation functions
 */
// SQL Type → TypeScript Type mapping
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
    BYTEA_ARRAY: 'Uint8Array',
    // With sizes
    'VARCHAR(*)': 'string',
    'CHAR(*)': 'string',
};
function mapSqlType(sqlType) {
    const upper = sqlType.toUpperCase();
    // Try exact match first
    if (TYPE_MAP[upper]) {
        return TYPE_MAP[upper];
    }
    // Try base type match (e.g., VARCHAR(255) → VARCHAR)
    const baseType = upper.replace(/\(.*\)/, '');
    if (TYPE_MAP[baseType]) {
        return TYPE_MAP[baseType];
    }
    // Default: treat as string
    return 'unknown';
}
function toCamelCase(str) {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
function toPascalCase(str) {
    const camel = toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
}
export function buildSchemaFields(columns) {
    return columns.map(col => ({
        name: toCamelCase(col.name),
        tsType: mapSqlType(col.dataType),
        nullable: col.nullable,
        isPrimaryKey: col.isPrimaryKey,
    }));
}
export function generateTypeGuard(table, options = {}) {
    const fields = buildSchemaFields(table.columns);
    const typeName = toPascalCase(table.name);
    // Generate type definition
    const typeLines = fields.map(f => {
        const optional = f.nullable ? '?' : '';
        return `  ${f.name}${optional}: ${f.tsType};`;
    });
    // Generate type guard function
    const checks = fields.map(f => {
        const fieldAccess = `o.${f.name}`;
        if (f.nullable) {
            // Accept undefined or null
            return `${fieldAccess} === undefined || ${fieldAccess} === null || typeof ${fieldAccess} === "${f.tsType === 'object' ? 'object' : f.tsType}"`;
        }
        // Required field
        if (f.tsType === 'object') {
            return `${fieldAccess} !== undefined && ${fieldAccess} !== null && typeof ${fieldAccess} === "object"`;
        }
        return `typeof ${fieldAccess} === "${f.tsType}"`;
    });
    // Build output
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
export function generateAllTypes(tables) {
    const guards = tables.map(t => generateTypeGuard(t));
    return guards.join('\n\n');
}
// Schema helper for internal use only (not exposed as output)
export function buildInternalSchema(columns) {
    return {
        __schema: columns.map(col => ({
            name: toCamelCase(col.name),
            type: mapSqlType(col.dataType),
            nullable: col.nullable,
            primaryKey: col.isPrimaryKey,
            unique: col.isUnique,
            sqlType: col.dataType,
        })),
    };
}
//# sourceMappingURL=guard-builder.js.map