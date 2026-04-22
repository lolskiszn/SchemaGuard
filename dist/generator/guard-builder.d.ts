/**
 * Guard Builder - Generates TypeScript type guards from parsed schema AST
 * Internal implementation detail: builds type definitions and validation functions
 */
import { TableSchema, ColumnDefinition } from './parser/types';
export interface SchemaField {
    name: string;
    tsType: string;
    nullable: boolean;
    isPrimaryKey: boolean;
}
export declare function buildSchemaFields(columns: ColumnDefinition[]): SchemaField[];
export declare function generateTypeGuard(table: TableSchema, options?: {
    camelCase?: boolean;
}): string;
export declare function generateAllTypes(tables: TableSchema[]): string;
export declare function buildInternalSchema(columns: ColumnDefinition[]): object;
//# sourceMappingURL=guard-builder.d.ts.map