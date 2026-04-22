/**
 * SQL Schema AST Types
 * Represents parsed database schema structures
 */
export interface TableSchema {
    name: string;
    columns: ColumnDefinition[];
    constraints: TableConstraint[];
}
export interface ColumnDefinition {
    name: string;
    dataType: string;
    nullable: boolean;
    isPrimaryKey: boolean;
    isUnique: boolean;
    isSerial: boolean;
    defaultValue?: string;
}
export interface TableConstraint {
    type: 'PRIMARY KEY' | 'UNIQUE' | 'CHECK' | 'FOREIGN KEY';
    columns: string[];
    referencedTable?: string;
    referencedColumns?: string[];
}
export interface Dialect {
    readonly name: string;
    readonly parser: (sql: string) => TableSchema[];
}
export declare enum TokenType {
    CREATE = "CREATE",
    TABLE = "TABLE",
    NOT = "NOT",
    NULL = "NULL",
    PRIMARY = "PRIMARY",
    KEY = "KEY",
    UNIQUE = "UNIQUE",
    DEFAULT = "DEFAULT",
    REFERENCES = "REFERENCES",
    CHECK = "CHECK",
    FOREIGN = "FOREIGN",
    CONSTRAINT = "CONSTRAINT",
    IDENTIFIER = "IDENTIFIER",
    COMMA = "COMMA",
    LPAREN = "LPAREN",
    RPAREN = "RPAREN",
    SEMICOLON = "SEMICOLON",
    EQ = "EQ",
    NUMBER = "NUMBER",
    STRING = "STRING",
    KEYWORD = "KEYWORD",
    EOF = "EOF"
}
export interface Token {
    type: TokenType;
    value: string;
    line: number;
    column: number;
}
export declare class ParseError extends Error {
    line?: number | undefined;
    column?: number | undefined;
    constructor(message: string, line?: number | undefined, column?: number | undefined);
}
//# sourceMappingURL=types.d.ts.map