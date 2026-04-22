/**
 * SQL Parser - Builds AST from tokenized PostgreSQL DDL
 * Extensible architecture to support MySQL and other dialects
 */
import { Token, TableSchema } from './types';
export declare class SqlParser {
    private tokens_;
    private pos;
    private tokens;
    constructor(tokens_: Token[]);
    parse(): TableSchema[];
    private parseCreateTable;
    private parseColumnDefinition;
    private parseTableConstraint;
    private parseColumnList;
    private peek;
    private advance;
    private consume;
    private check;
    private isEof;
}
export declare function parse(tokens: Token[]): TableSchema[];
export declare function parseSql(sql: string): TableSchema[];
//# sourceMappingURL=sql-parser.d.ts.map