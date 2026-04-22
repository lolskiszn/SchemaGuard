/**
 * SQL Lexer - Tokenizes PostgreSQL DDL statements
 * Designed to be extensible for other SQL dialects
 */
import { TokenType, ParseError } from './types.js';
const KEYWORDS = new Set([
    'CREATE', 'TABLE', 'NOT', 'NULL', 'PRIMARY', 'KEY', 'UNIQUE',
    'DEFAULT', 'REFERENCES', 'CHECK', 'FOREIGN', 'CONSTRAINT',
    'IF', 'EXISTS', 'ALTER', 'DROP', 'ADD', 'COLUMN',
]);
export class SqlLexer {
    input;
    pos = 0;
    line = 1;
    column = 1;
    constructor(input) {
        this.input = input;
    }
    tokenize() {
        const tokens = [];
        while (!this.isEof()) {
            this.skipWhitespace();
            if (this.isEof())
                break;
            const char = this.peek();
            if (char === ';') {
                tokens.push(this.emitToken(TokenType.SEMICOLON, ';'));
                this.advance();
                continue;
            }
            if (char === '(') {
                tokens.push(this.emitToken(TokenType.LPAREN, '('));
                this.advance();
                continue;
            }
            if (char === ')') {
                tokens.push(this.emitToken(TokenType.RPAREN, ')'));
                this.advance();
                continue;
            }
            if (char === ',') {
                tokens.push(this.emitToken(TokenType.COMMA, ','));
                this.advance();
                continue;
            }
            if (char === '=') {
                tokens.push(this.emitToken(TokenType.EQ, '='));
                this.advance();
                continue;
            }
            if (char === "'" || char === '"') {
                tokens.push(this.readString(char));
                continue;
            }
            if (this.isAlpha(char) || char === '_') {
                tokens.push(this.readIdentifier());
                continue;
            }
            if (this.isDigit(char)) {
                tokens.push(this.readNumber());
                continue;
            }
            // Skip unknown characters but note position
            throw new ParseError(`Unexpected character: ${char}`, this.line, this.column);
        }
        tokens.push(this.emitToken(TokenType.EOF, ''));
        return tokens;
    }
    skipWhitespace() {
        while (!this.isEof()) {
            const char = this.peek();
            if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
                if (char === '\n') {
                    this.line++;
                    this.column = 1;
                }
                this.advance();
            }
            else if (char === '-' && this.peekAt(1) === '-') {
                // Skip single-line comment
                while (!this.isEof() && this.peek() !== '\n') {
                    this.advance();
                }
            }
            else if (char === '/' && this.peekAt(1) === '*') {
                // Skip block comment
                this.advance(); // /
                this.advance(); // *
                while (!this.isEof()) {
                    if (this.peek() === '*' && this.peekAt(1) === '/') {
                        this.advance();
                        this.advance();
                        break;
                    }
                    this.advance();
                }
            }
            else {
                break;
            }
        }
    }
    readIdentifier() {
        const start = this.pos;
        const startLine = this.line;
        const startCol = this.column;
        let value = '';
        while (!this.isEof() && (this.isAlphaNumeric(this.peek()) || this.peek() === '_')) {
            value += this.peek();
            this.advance();
        }
        // Check for keyword
        const upper = value.toUpperCase();
        if (KEYWORDS.has(upper)) {
            // Map to token type
            const type = this.keywordToTokenType(upper);
            return { type, value: upper, line: startLine, column: startCol };
        }
        return { type: TokenType.IDENTIFIER, value, line: startLine, column: startCol };
    }
    keywordToTokenType(keyword) {
        switch (keyword) {
            case 'CREATE': return TokenType.CREATE;
            case 'TABLE': return TokenType.TABLE;
            case 'NOT': return TokenType.NOT;
            case 'NULL': return TokenType.NULL;
            case 'PRIMARY': return TokenType.PRIMARY;
            case 'KEY': return TokenType.KEY;
            case 'UNIQUE': return TokenType.UNIQUE;
            case 'DEFAULT': return TokenType.DEFAULT;
            case 'REFERENCES': return TokenType.REFERENCES;
            case 'CHECK': return TokenType.CHECK;
            case 'FOREIGN': return TokenType.FOREIGN;
            default: return TokenType.KEYWORD;
        }
    }
    readString(quote) {
        const startLine = this.line;
        const startCol = this.column;
        this.advance(); // opening quote
        let value = '';
        while (!this.isEof() && this.peek() !== quote) {
            if (this.peek() === '\\') {
                this.advance();
                if (!this.isEof()) {
                    value += this.peek();
                    this.advance();
                }
            }
            else {
                value += this.peek();
                this.advance();
            }
        }
        if (this.isEof()) {
            throw new ParseError(`Unterminated string`, startLine, startCol);
        }
        this.advance(); // closing quote
        return { type: TokenType.STRING, value, line: startLine, column: startCol };
    }
    readNumber() {
        const startLine = this.line;
        const startCol = this.column;
        let value = '';
        while (!this.isEof() && this.isDigit(this.peek())) {
            value += this.peek();
            this.advance();
        }
        return { type: TokenType.NUMBER, value, line: startLine, column: startCol };
    }
    peek() {
        return this.input[this.pos] || '';
    }
    peekAt(offset) {
        return this.input[this.pos + offset] || '';
    }
    advance() {
        if (this.pos < this.input.length) {
            this.pos++;
            this.column++;
        }
    }
    isEof() {
        return this.pos >= this.input.length;
    }
    isAlpha(char) {
        return /[a-zA-Z_]/.test(char);
    }
    isDigit(char) {
        return /[0-9]/.test(char);
    }
    isAlphaNumeric(char) {
        return /[a-zA-Z0-9_]/.test(char);
    }
    emitToken(type, value) {
        return { type, value, line: this.line, column: this.column };
    }
}
export function tokenize(sql) {
    return new SqlLexer(sql).tokenize();
}
//# sourceMappingURL=sql-lexer.js.map