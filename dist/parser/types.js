/**
 * SQL Schema AST Types
 * Represents parsed database schema structures
 */
// Token types for lexer
export var TokenType;
(function (TokenType) {
    TokenType["CREATE"] = "CREATE";
    TokenType["TABLE"] = "TABLE";
    TokenType["NOT"] = "NOT";
    TokenType["NULL"] = "NULL";
    TokenType["PRIMARY"] = "PRIMARY";
    TokenType["KEY"] = "KEY";
    TokenType["UNIQUE"] = "UNIQUE";
    TokenType["DEFAULT"] = "DEFAULT";
    TokenType["REFERENCES"] = "REFERENCES";
    TokenType["CHECK"] = "CHECK";
    TokenType["FOREIGN"] = "FOREIGN";
    TokenType["CONSTRAINT"] = "CONSTRAINT";
    TokenType["IDENTIFIER"] = "IDENTIFIER";
    TokenType["COMMA"] = "COMMA";
    TokenType["LPAREN"] = "LPAREN";
    TokenType["RPAREN"] = "RPAREN";
    TokenType["SEMICOLON"] = "SEMICOLON";
    TokenType["EQ"] = "EQ";
    TokenType["NUMBER"] = "NUMBER";
    TokenType["STRING"] = "STRING";
    TokenType["KEYWORD"] = "KEYWORD";
    TokenType["EOF"] = "EOF";
})(TokenType || (TokenType = {}));
// Parse error
export class ParseError extends Error {
    line;
    column;
    constructor(message, line, column) {
        super(message);
        this.line = line;
        this.column = column;
        this.name = 'ParseError';
    }
}
//# sourceMappingURL=types.js.map