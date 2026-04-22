/**
 * SQL Parser - Builds AST from tokenized PostgreSQL DDL
 * Extensible architecture to support MySQL and other dialects
 */
import { TokenType, ParseError } from './types';
import { tokenize } from './sql-lexer';
export class SqlParser {
    tokens_;
    pos = 0;
    tokens = [];
    constructor(tokens_) {
        this.tokens_ = tokens_;
        this.tokens = tokens_;
    }
    parse() {
        const tables = [];
        while (!this.isEof()) {
            const table = this.parseCreateTable();
            if (table) {
                tables.push(table);
            }
        }
        return tables;
    }
    parseCreateTable() {
        if (this.peek().type !== TokenType.CREATE) {
            // Skip to next CREATE or EOF
            while (!this.isEof() && this.peek().type !== TokenType.CREATE) {
                this.advance();
            }
            if (this.isEof())
                return null;
        }
        this.consume(TokenType.CREATE);
        // Skip "TEMPORARY" or "TEMP" if present
        if (this.peek().type === TokenType.KEYWORD && this.peek().value === 'TEMPORARY') {
            this.advance();
        }
        else if (this.peek().type === TokenType.KEYWORD && this.peek().value === 'TEMP') {
            this.advance();
        }
        this.consume(TokenType.TABLE);
        // Skip "IF NOT EXISTS" if present
        if (this.peek().type === TokenType.KEYWORD && this.peek().value === 'IF') {
            this.advance();
            this.consume(TokenType.NOT);
            this.consume(TokenType.KEYWORD); // EXISTS
        }
        // Get table name
        const tableName = this.consume(TokenType.IDENTIFIER).value;
        this.consume(TokenType.LPAREN);
        const columns = [];
        const constraints = [];
        while (!this.check(TokenType.RPAREN)) {
            // Check if this is a column definition or constraint
            const first = this.peek();
            if (first.type === TokenType.CONSTRAINT || first.type === TokenType.PRIMARY ||
                first.type === TokenType.UNIQUE || first.type === TokenType.FOREIGN ||
                first.type === TokenType.CHECK) {
                const constraint = this.parseTableConstraint();
                if (constraint)
                    constraints.push(constraint);
            }
            else if (first.type === TokenType.IDENTIFIER) {
                const column = this.parseColumnDefinition();
                columns.push(column);
            }
            else {
                // Skip unexpected token
                this.advance();
            }
            // Handle comma between items
            if (this.check(TokenType.COMMA)) {
                this.advance();
            }
        }
        this.consume(TokenType.RPAREN);
        this.consume(TokenType.SEMICOLON);
        // Apply PRIMARY KEY constraint to columns
        for (const col of columns) {
            if (col.isPrimaryKey)
                continue;
            const pkConstraint = constraints.find(c => c.type === 'PRIMARY KEY' && c.columns.includes(col.name));
            if (pkConstraint) {
                col.isPrimaryKey = true;
            }
        }
        // Apply UNIQUE constraint to columns
        for (const col of columns) {
            if (col.isUnique)
                continue;
            const uniqueConstraint = constraints.find(c => c.type === 'UNIQUE' && c.columns.includes(col.name));
            if (uniqueConstraint) {
                col.isUnique = true;
            }
        }
        return { name: tableName, columns, constraints };
    }
    parseColumnDefinition() {
        const name = this.consume(TokenType.IDENTIFIER).value;
        const dataType = this.consume(TokenType.IDENTIFIER).value.toUpperCase();
        // Check for (n) size/precision
        let typeWithSize = dataType;
        if (this.check(TokenType.LPAREN)) {
            const sizeToken = this.advance();
            if (this.check(TokenType.NUMBER)) {
                typeWithSize = `${dataType}(${this.consume(TokenType.NUMBER).value})`;
            }
            while (!this.check(TokenType.RPAREN)) {
                this.advance();
            }
            this.consume(TokenType.RPAREN);
        }
        const column = {
            name,
            dataType: typeWithSize,
            nullable: true,
            isPrimaryKey: false,
            isUnique: false,
            isSerial: dataType.toUpperCase() === 'SERIAL',
        };
        // Parse column constraints
        while (!this.check(TokenType.RPAREN) && !this.check(TokenType.COMMA)) {
            const token = this.peek();
            if (token.type === TokenType.NOT) {
                this.advance();
                this.consume(TokenType.NULL);
                column.nullable = false;
            }
            else if (token.type === TokenType.PRIMARY) {
                this.advance();
                this.consume(TokenType.KEY);
                column.isPrimaryKey = true;
                column.nullable = false; // PK implies NOT NULL in most DBs
            }
            else if (token.type === TokenType.UNIQUE) {
                this.advance();
                column.isUnique = true;
            }
            else if (token.type === TokenType.DEFAULT) {
                this.advance();
                column.defaultValue = this.peek().value;
                this.advance();
            }
            else if (token.type === TokenType.IDENTIFIER && token.value.toUpperCase() === 'REFERENCES') {
                // Foreign key - skip for now
                this.advance();
                while (!this.check(TokenType.RPAREN) && !this.check(TokenType.COMMA)) {
                    this.advance();
                }
            }
            else {
                // Stop on unknown token
                break;
            }
        }
        return column;
    }
    parseTableConstraint() {
        const token = this.peek();
        if (token.type === TokenType.CONSTRAINT) {
            this.advance(); // CONSTRAINT
            this.consume(TokenType.IDENTIFIER); // constraint name
        }
        if (token.type === TokenType.PRIMARY || (token.type === TokenType.KEYWORD && token.value === 'PRIMARY')) {
            this.consume(TokenType.PRIMARY);
            this.consume(TokenType.KEY);
            this.consume(TokenType.LPAREN);
            const cols = this.parseColumnList();
            return { type: 'PRIMARY KEY', columns: cols };
        }
        if (token.type === TokenType.UNIQUE || (token.type === TokenType.KEYWORD && token.value === 'UNIQUE')) {
            this.consume(TokenType.UNIQUE);
            let cols = [];
            if (this.check(TokenType.LPAREN)) {
                this.advance();
                cols = this.parseColumnList();
            }
            else {
                // UNIQUE applies to previous column
                cols = [];
            }
            return { type: 'UNIQUE', columns: cols };
        }
        if (token.type === TokenType.FOREIGN || (token.type === TokenType.KEYWORD && token.value === 'FOREIGN')) {
            this.consume(TokenType.FOREIGN);
            this.consume(TokenType.KEY);
            this.consume(TokenType.LPAREN);
            const cols = this.parseColumnList();
            this.consume(TokenType.REFERENCES);
            const refTable = this.consume(TokenType.IDENTIFIER).value;
            this.consume(TokenType.LPAREN);
            const refCols = this.parseColumnList();
            return { type: 'FOREIGN KEY', columns: cols, referencedTable: refTable, referencedColumns: refCols };
        }
        // Skip unknown constraint type
        this.advance();
        return null;
    }
    parseColumnList() {
        const cols = [];
        cols.push(this.consume(TokenType.IDENTIFIER).value);
        while (this.check(TokenType.COMMA)) {
            this.advance();
            cols.push(this.consume(TokenType.IDENTIFIER).value);
        }
        this.consume(TokenType.RPAREN);
        return cols;
    }
    peek() {
        return this.tokens[this.pos] || { type: TokenType.EOF, value: '', line: 0, column: 0 };
    }
    advance() {
        return this.tokens[this.pos++];
    }
    consume(expectedType) {
        const token = this.peek();
        if (token.type !== expectedType) {
            throw new ParseError(`Expected ${expectedType} but got ${token.type}`, token.line, token.column);
        }
        return this.advance();
    }
    check(expectedType) {
        return this.peek().type === expectedType;
    }
    isEof() {
        return this.pos >= this.tokens.length || this.peek().type === TokenType.EOF;
    }
}
export function parse(tokens) {
    return new SqlParser(tokens).parse();
}
export function parseSql(sql) {
    const tokens = tokenize(sql);
    return new SqlParser(tokens).parse();
}
//# sourceMappingURL=sql-parser.js.map