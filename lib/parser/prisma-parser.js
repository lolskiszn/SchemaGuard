/**
 * Prisma Schema Parser - Fixed for single-field models
 */

function parsePrisma(schema) {
  const models = [];
  const modelRegex = /model\s+(\w+)\s*\{([^}]*)\}/g;
  let match;

  while ((match = modelRegex.exec(schema)) !== null) {
    const name = match[1];
    const body = match[2];
    const columns = [];

    // Split by whitespace, filter empty
    const tokens = body.split(/[\s\n]+/).filter(t => t && t.trim());

    // Parse each field - name, type, optional directives
    for (let i = 0; i < tokens.length; ) {
      const fName = tokens[i];
      
      // Skip if starts with @ (directive from previous parse error)
      if (!fName || fName.startsWith('@')) {
        i++;
        continue;
      }

      // Get type from next token, strip modifiers
      let fType = '';
      let fullToken = '';
      
      if (i + 1 < tokens.length) {
        fullToken = tokens[i + 1];
        // Remove ? and @ directives from type
        fType = fullToken.replace(/\?$/, '').replace(/@.+$/, '');
      }

      // Skip relation types (PascalCase but not in scalar list)
      const scalarTypes = ['String', 'Int', 'Boolean', 'DateTime', 'Float', 'Decimal', 'Json', 'Bytes'];
      if (fType && !scalarTypes.includes(fType) && /^[A-Z]/.test(fType)) {
        i += 2;
        continue;
      }

      // Add field if we have name and type
      if (fName && fType) {
        // Check for directives in third position or in fullToken
        const directivePos = i + 2 < tokens.length ? tokens[i + 2] : null;
        const dir = directivePos || (fullToken.match(/@[\w]+/)?.[0]) || '';
        
        columns.push({
          name: fName,
          dataType: fType,
          nullable: fullToken.endsWith('?'),
          isPrimaryKey: dir.includes('@id') || fullToken.includes('@id'),
          isUnique: dir.includes('@unique') || fullToken.includes('@unique'),
          isSerial: fType === 'Int' || fType === 'DateTime',
        });
      }

      // Advance by 2 (name + type) or 3 if there's a separate directive
      const hasSeparateDirective = tokens[i + 2] && tokens[i + 2].startsWith('@');
      i += hasSeparateDirective ? 3 : 2;
    }

    if (columns.length > 0) {
      models.push({ name, columns });
    }
  }

  return models;
}

module.exports = { parsePrisma };