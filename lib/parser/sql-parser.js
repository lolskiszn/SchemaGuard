/**
 * SQL Parser - Builds AST from tokenized PostgreSQL DDL
 */

const { tokenize } = require('./sql-lexer.js');
const { TokenType, ParseError } = require('./types.js');

class SqlParser {
  constructor(tokens_) {
    this.tokens = tokens_;
    this.pos = 0;
  }

  parse() {
    const tables = [];
    const enums = [];
    while (!this.isEof()) {
      if (this.check(TokenType.CREATE)) {
        // Check if this is CREATE TYPE (ENUM)
        // Look ahead: CREATE TYPE name AS ENUM
        const savedPos = this.pos;
        this.advance(); // skip CREATE
        const isType = this.checkKeyword('TYPE');
        this.pos = savedPos; // reset
        if (isType) {
          const enumDef = this.parseCreateType();
          if (enumDef) enums.push(enumDef);
        } else {
          const table = this.parseCreateTable();
          if (table) tables.push(table);
        }
      } else {
        // Skip unknown statements
        this.advance();
      }
    }
    return [...tables, ...enums];
  }

  checkKeyword(kw) {
    return this.peek().type === TokenType.IDENTIFIER && 
           this.peek().value.toUpperCase() === kw;
  }

  parseCreateType() {
    this.consume(TokenType.CREATE); // CREATE
    this.consume(TokenType.IDENTIFIER); // TYPE
    const name = this.consume(TokenType.IDENTIFIER).value;
    this.consume(TokenType.IDENTIFIER); // AS
    this.consume(TokenType.IDENTIFIER); // ENUM
    this.consume(TokenType.LPAREN);
    const values = [];
    while (!this.check(TokenType.RPAREN)) {
      if (this.check(TokenType.STRING)) {
        values.push(this.consume(TokenType.STRING).value.replace(/'/g, ''));
      }
      if (this.check(TokenType.COMMA)) this.advance();
    }
    this.consume(TokenType.RPAREN);
    return { type: 'enum', name, values };
  }

  parseCreateTable() {
    if (this.peek().type !== TokenType.CREATE) {
      while (!this.isEof() && this.peek().type !== TokenType.CREATE) {
        this.advance();
      }
      if (this.isEof()) return null;
    }

    this.consume(TokenType.CREATE);
    if (this.peek().type === TokenType.KEYWORD && this.peek().value === 'TEMPORARY') {
      this.advance();
    }
    this.consume(TokenType.TABLE);
    if (this.peek().type === TokenType.KEYWORD && this.peek().value === 'IF') {
      this.advance();
      this.consume(TokenType.NOT);
      this.consume(TokenType.KEYWORD);
    }

    const tableName = this.consume(TokenType.IDENTIFIER).value;
    this.consume(TokenType.LPAREN);

    const columns = [];
    const constraints = [];

    while (!this.check(TokenType.RPAREN)) {
      const first = this.peek();
      if (first.type === TokenType.CONSTRAINT || first.type === TokenType.PRIMARY ||
          first.type === TokenType.UNIQUE || first.type === TokenType.FOREIGN) {
        constraints.push(this.parseTableConstraint());
      } else if (first.type === TokenType.IDENTIFIER) {
        columns.push(this.parseColumnDefinition());
      } else {
        throw new ParseError(`Unexpected token in table: ${first.type} (${first.value})`, first.line, first.column);
      }
      if (this.check(TokenType.COMMA)) this.advance();
    }

    this.consume(TokenType.RPAREN);
    this.consume(TokenType.SEMICOLON);

    for (const pk of constraints.filter(c => c.type === 'PRIMARY KEY')) {
      for (const colName of pk.columns) {
        const col = columns.find(c => c.name === colName);
        if (col) { col.isPrimaryKey = true; col.nullable = false; }
      }
    }
    for (const un of constraints.filter(c => c.type === 'UNIQUE')) {
      for (const colName of un.columns) {
        const col = columns.find(c => c.name === colName);
        if (col) col.isUnique = true;
      }
    }

    return { name: tableName, columns, constraints };
  }

  parseColumnDefinition() {
    const name = this.consume(TokenType.IDENTIFIER).value;
    // Type can be IDENTIFIER (e.g., VARCHAR, TEXT) or KEYWORD (e.g., SERIAL, TEXT)
    let typeToken = this.peek();
    let dataType = '';
    if (typeToken.type === TokenType.IDENTIFIER) {
      dataType = this.advance().value.toUpperCase();
    } else if (typeToken.type === TokenType.KEYWORD) {
      dataType = this.advance().value.toUpperCase();
    } else {
      throw new ParseError(`Expected column type but got ${typeToken.type}`, typeToken.line, typeToken.column);
    }

    let typeWithSize = dataType;
    if (this.check(TokenType.LPAREN)) {
      this.advance();
      const sizeParts = [];
      while (!this.check(TokenType.RPAREN)) {
        if (this.check(TokenType.NUMBER)) {
          sizeParts.push(this.consume(TokenType.NUMBER).value);
        } else if (this.check(TokenType.IDENTIFIER)) {
          sizeParts.push(this.consume(TokenType.IDENTIFIER).value);
        } else if (this.check(TokenType.STRING)) {
          sizeParts.push(this.consume(TokenType.STRING).value.replace(/['"]/g, ''));
        } else if (this.check(TokenType.COMMA)) {
          this.advance();
        } else {
          throw new ParseError(`Unexpected token in type size: ${this.peek().type}`, this.peek().line, this.peek().column);
        }
      }
      this.consume(TokenType.RPAREN);
      typeWithSize = sizeParts.length > 0 ? dataType + '(' + sizeParts.join(',') + ')' : dataType;
    }

    const column = {
      name,
      dataType: typeWithSize,
      nullable: true,
      isPrimaryKey: false,
      isUnique: false,
      isSerial: dataType === 'SERIAL',
    };

    while (!this.check(TokenType.RPAREN) && !this.check(TokenType.COMMA)) {
      const token = this.peek();
      if (token.type === TokenType.NOT) {
        this.advance();
        this.consume(TokenType.NULL);
        column.nullable = false;
      } else if (token.type === TokenType.PRIMARY) {
        this.advance();
        if (this.check(TokenType.KEY)) this.advance();
        column.isPrimaryKey = true;
        column.nullable = false;
      } else if (token.type === TokenType.KEYWORD && token.value.toUpperCase() === 'AUTO_INCREMENT') {
        this.advance();
        column.isSerial = true;
        // Handle chained constraint like AUTO_INCREMENT PRIMARY KEY
        if (this.check(TokenType.PRIMARY)) {
          this.advance();
          if (this.check(TokenType.KEY)) this.advance();
          column.isPrimaryKey = true;
          column.nullable = false;
        }
      } else if (token.type === TokenType.UNIQUE) {
        this.advance();
        column.isUnique = true;
      } else if (token.type === TokenType.DEFAULT) {
        this.advance();
        column.defaultValue = this.peek().value;
        this.advance();
      } else if (token.type === TokenType.REFERENCES) {
        throw new ParseError(`Inline FOREIGN KEY references are not supported. Use table-level FOREIGN KEY constraint instead.`, token.line, token.column);
      } else {
        break;
      }
    }
    return column;
  }

  parseTableConstraint() {
    if (this.peek().type === TokenType.CONSTRAINT) {
      this.advance();
      this.consume(TokenType.IDENTIFIER);
    }
    const token = this.peek();
    if (token.type === TokenType.PRIMARY) {
      this.advance();
      this.consume(TokenType.KEY);
      this.consume(TokenType.LPAREN);
      return { type: 'PRIMARY KEY', columns: this.parseColumnList() };
    }
    if (token.type === TokenType.UNIQUE) {
      this.advance();
      if (this.check(TokenType.LPAREN)) {
        this.advance();
        return { type: 'UNIQUE', columns: this.parseColumnList() };
      }
      return { type: 'UNIQUE', columns: [] };
    }
    if (token.type === TokenType.FOREIGN) {
      this.advance();
      this.consume(TokenType.KEY);
      this.consume(TokenType.LPAREN);
      const cols = this.parseColumnList();
      this.consume(TokenType.REFERENCES);
      const refTable = this.consume(TokenType.IDENTIFIER).value;
      this.consume(TokenType.LPAREN);
      const refCols = this.parseColumnList();
      return { type: 'FOREIGN KEY', columns: cols, referencedTable: refTable, referencedColumns: refCols };
    }
    // Unknown constraint - skip it
    this.advance();
    return null;
  }

  parseColumnList() {
    const cols = [this.consume(TokenType.IDENTIFIER).value];
    while (this.check(TokenType.COMMA)) {
      this.advance();
      cols.push(this.consume(TokenType.IDENTIFIER).value);
    }
    this.consume(TokenType.RPAREN);
    return cols;
  }

  peek() { return this.tokens[this.pos] || { type: TokenType.EOF, value: '', line: 0, column: 0 }; }
  advance() { return this.tokens[this.pos++]; }
  consume(expectedType) {
    const token = this.peek();
    if (token.type !== expectedType) {
      throw new ParseError(`Expected ${expectedType} but got ${token.type} (${token.value}) at line ${token.line}:${token.column}`, token.line, token.column);
    }
    return this.advance();
  }
  check(expectedType) { return this.peek().type === expectedType; }
  isEof() { return this.pos >= this.tokens.length || this.peek().type === TokenType.EOF; }
}

function parse(tokens) { return new SqlParser(tokens).parse(); }
function parseSql(sql) { return new SqlParser(tokenize(sql)).parse(); }

module.exports = { parse, parseSql, SqlParser, TokenType, ParseError };