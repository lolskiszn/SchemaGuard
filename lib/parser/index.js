const { tokenize, SqlLexer } = require('./sql-lexer.js');
const { parse, parseSql, SqlParser, TokenType, ParseError } = require('./sql-parser.js');
const { parsePrisma } = require('./prisma-parser.js');

function parseSchema(input, format = 'sql') {
  if (format === 'prisma') {
    return parsePrisma(input);
  }
  return parseSql(input);
}

module.exports = {
  parse,
  parseSql,
  parseSchema,
  parsePrisma,
  tokenize,
  SqlLexer,
  SqlParser,
  TokenType,
  ParseError,
};
