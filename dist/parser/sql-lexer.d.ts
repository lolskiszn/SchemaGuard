/**
 * SQL Lexer - Tokenizes PostgreSQL DDL statements
 * Designed to be extensible for other SQL dialects
 */
import { Token } from './types.js';
export declare class SqlLexer {
    private input;
    private pos;
    private line;
    private column;
    constructor(input: string);
    tokenize(): Token[];
    private skipWhitespace;
    private readIdentifier;
    private keywordToTokenType;
    private readString;
    private readNumber;
    private peek;
    private peekAt;
    private advance;
    private isEof;
    private isAlpha;
    private isDigit;
    private isAlphaNumeric;
    private emitToken;
}
export declare function tokenize(sql: string): Token[];
//# sourceMappingURL=sql-lexer.d.ts.map