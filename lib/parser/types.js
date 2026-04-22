/**
 * SQL Schema AST Types
 */

const TokenType = {
  CREATE: 'CREATE',
  TABLE: 'TABLE',
  NOT: 'NOT',
  NULL: 'NULL',
  PRIMARY: 'PRIMARY',
  KEY: 'KEY',
  UNIQUE: 'UNIQUE',
  DEFAULT: 'DEFAULT',
  REFERENCES: 'REFERENCES',
  CHECK: 'CHECK',
  FOREIGN: 'FOREIGN',
  CONSTRAINT: 'CONSTRAINT',
  IDENTIFIER: 'IDENTIFIER',
  COMMA: 'COMMA',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  SEMICOLON: 'SEMICOLON',
  EQ: 'EQ',
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  KEYWORD: 'KEYWORD',
  EOF: 'EOF',
};

class ParseError extends Error {
  constructor(message, line, column) {
    super(message);
    this.name = 'ParseError';
    this.line = line;
    this.column = column;
  }
}

module.exports = { TokenType, ParseError };