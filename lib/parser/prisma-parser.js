/**
 * Prisma Schema Parser - Minimal support for basic Prisma models
 * Only handles: model blocks with scalar fields
 * Defers: relations, enums, blocks, directives
 */

function parsePrisma(schema) {
  const models = [];
  
  // Find model blocks - handle multiline or single line
  const modelRegex = /model\s+(\w+)\s*\{([^}]*)\}/g;
  let match;

  while ((match = modelRegex.exec(schema)) !== null) {
    const name = match[1];
    const body = match[2];
    const columns = [];

    // Split by whitespace or newlines, preserve structure
    const tokens = body.split(/[\s\n]+/).filter(t => t);
    
    // Parse tokens in pairs
    let i = 0;
    while (i < tokens.length) {
      let fName = tokens[i];
      let fType = '';
      
      // Skip directives  
      if (fName.startsWith('@')) {
        i++;
        continue;
      }
      
      // Next token should be type
      if (i + 1 < tokens.length) {
        fType = tokens[i + 1].replace(/\?$/, '');
      }
      
      // Skip relation fields (PascalCase type that's not a scalar)
      const scalarTypes = ['String', 'Int', 'Boolean', 'DateTime', 'Float', 'Decimal', 'Json', 'Bytes'];
      if (fType && !scalarTypes.includes(fType) && fType[0] === fType[0].toUpperCase()) {
        i += 2;
        continue;
      }
      
      // Skip internal fields
      if (fName === 'id' || fName === 'createdAt' || fName === 'updatedAt') {
        i += 2;
        continue;
      }
      
      if (fName && fType) {
        columns.push({
          name: fName,
          dataType: fType,
          nullable: tokens[i + 1] && tokens[i + 1].endsWith('?'),
          isPrimaryKey: body.includes('@id'),
          isUnique: body.includes('@unique'),
          isSerial: fType === 'Int' || fType === 'DateTime',
        });
      }
      i += 2;
    }

    if (columns.length > 0) {
      models.push({ name, columns });
    }
  }

  return models;
}

module.exports = { parsePrisma };
