/**
 * SQL Lexer - Tokenizes PostgreSQL DDL statements
 */

const { TokenType } = require('./types.js');

const KEYWORDS = new Set([
  'CREATE', 'TABLE', 'NOT', 'NULL', 'PRIMARY', 'KEY', 'UNIQUE',
  'DEFAULT', 'REFERENCES', 'CHECK', 'FOREIGN', 'CONSTRAINT',
  'IF', 'EXISTS', 'ALTER', 'DROP', 'ADD', 'COLUMN',
  'TEMPORARY', 'TEMP', 'SERIAL', 'BIGSERIAL', 'ENUM', 'AS',
  'AUTO_INCREMENT', 'ENUM', 'DOUBLE', 'PRECISION', 'WITH', 'TIME', 'ZONE', 'WITHOUT', 'WITH', 'ZONE',
]);

class SqlLexer {
  constructor(input) {
    this.input = input;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
  }

  tokenize() {
    const tokens = [];
    
    while (!this.isEof()) {
      this.skipWhitespace();
      if (this.isEof()) break;
      
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
      
      throw new Error(`Unexpected character: ${char} at line ${this.line}, col ${this.column}`);
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
      } else if (char === '-' && this.peekAt(1) === '-') {
        while (!this.isEof() && this.peek() !== '\n') {
          this.advance();
        }
      } else if (char === '/' && this.peekAt(1) === '*') {
        this.advance();
        this.advance();
        while (!this.isEof()) {
          if (this.peek() === '*' && this.peekAt(1) === '/') {
            this.advance();
            this.advance();
            break;
          }
          this.advance();
        }
      } else {
        break;
      }
    }
  }

  readIdentifier() {
    const startLine = this.line;
    const startCol = this.column;
    let value = '';
    
    while (!this.isEof() && (this.isAlphaNumeric(this.peek()) || this.peek() === '_')) {
      value += this.peek();
      this.advance();
    }
    
    const upper = value.toUpperCase();
    if (KEYWORDS.has(upper)) {
      return { type: this.keywordToTokenType(upper), value: upper, line: startLine, column: startCol };
    }
    
    return { type: TokenType.IDENTIFIER, value, line: startLine, column: startCol };
  }

  keywordToTokenType(keyword) {
    const map = {
      'CREATE': TokenType.CREATE,
      'TABLE': TokenType.TABLE,
      'NOT': TokenType.NOT,
      'NULL': TokenType.NULL,
      'PRIMARY': TokenType.PRIMARY,
      'KEY': TokenType.KEY,
      'UNIQUE': TokenType.UNIQUE,
      'DEFAULT': TokenType.DEFAULT,
      'REFERENCES': TokenType.REFERENCES,
      'CHECK': TokenType.CHECK,
      'FOREIGN': TokenType.FOREIGN,
    };
    return map[keyword] || TokenType.KEYWORD;
  }

  readString(quote) {
    const startLine = this.line;
    const startCol = this.column;
    this.advance();
    let value = '';
    
    while (!this.isEof() && this.peek() !== quote) {
      if (this.peek() === '\\') {
        this.advance();
        if (!this.isEof()) {
          value += this.peek();
          this.advance();
        }
      } else {
        value += this.peek();
        this.advance();
      }
    }
    
    if (this.isEof()) {
      throw new Error(`Unterminated string at line ${startLine}`);
    }
    
    this.advance();
    return { type: TokenType.STRING, value, line: startLine, column: startCol };
  }

  readNumber() {
    const startLine = this.line;
    const startCol = this.column;
    let value = '';
    
    while (!this.isEof() && (this.isDigit(this.peek()) || this.peek() === '.')) {
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

function tokenize(sql) {
  return new SqlLexer(sql).tokenize();
}

module.exports = { tokenize, SqlLexer };