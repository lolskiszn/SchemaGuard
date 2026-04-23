/**
 * Interactive init flow for SchemaGuard
 * Guided onboarding:
 *  - Prompt for DB URL
 *  - Validate connection
 *  - Detect tables
 *  - Choose include/exclude sets
 *  - Generate first schema + type guards
 */

const { Client } = require('pg');
const { writeFileSync } = require('fs');
const readline = require('readline');
const { parseSql } = require('./parser/index.js');
const { generateAllTypes } = require('./generator/guard-builder.js');

function askQuestion(rl, question) {
  return new Promise(resolve => rl.question(question, answer => resolve((answer || '').trim())));
}

function parseSelection(input, items) {
  const normalized = (input || '').trim().toLowerCase();
  if (!normalized || normalized === 'all' || normalized === 'a' || normalized === '*') {
    return [...items];
  }
  if (normalized === 'none' || normalized === 'n') {
    return [];
  }

  const picked = new Set();
  for (const part of normalized.split(',')) {
    const token = part.trim();
    if (!token) continue;

    const index = Number.parseInt(token, 10);
    if (!Number.isNaN(index) && index >= 1 && index <= items.length) {
      picked.add(items[index - 1]);
      continue;
    }

    const byName = items.find(i => i.toLowerCase() === token);
    if (byName) picked.add(byName);
  }

  return [...picked];
}

function toCreateTableSQL(tableName, columns) {
  const columnDefs = columns.map(col => {
    const pieces = [`  ${col.column_name} ${col.data_type}`];

    if (col.column_default && col.column_default.includes('nextval(')) {
      pieces[0] = `  ${col.column_name} SERIAL`;
    } else if (col.column_default) {
      pieces.push(`DEFAULT ${col.column_default}`);
    }

    if (col.is_nullable === 'NO') {
      pieces.push('NOT NULL');
    }

    return pieces.join(' ');
  });

  if (columnDefs.length === 0) {
    throw new Error(`No columns discovered for table "${tableName}"`);
  }

  return `CREATE TABLE ${tableName} (\n${columnDefs.join(',\n')}\n);`;
}

async function init() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║    SchemaGuard Guided Onboarding      ║');
    console.log('╚════════════════════════════════════════╝\n');
    console.log('This wizard will:');
    console.log('  1) Connect to PostgreSQL');
    console.log('  2) Detect your tables');
    console.log('  3) Let you choose include/exclude tables');
    console.log('  4) Generate your first schema + type guards\n');

    let dbUrl = await askQuestion(
      rl,
      'Database URL (Enter for DATABASE_URL/POSTGRES_URL): '
    );
    if (!dbUrl) dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
    if (!dbUrl) {
      throw new Error('No database URL provided');
    }

    console.log('\n🔗 Validating connection...');
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    console.log('✅ Connected successfully');

    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const allTables = tablesResult.rows.map(r => r.table_name);
    if (allTables.length === 0) {
      await client.end();
      throw new Error('No tables found in public schema');
    }

    console.log(`\n📋 Detected ${allTables.length} table(s):`);
    allTables.forEach((table, index) => console.log(`  ${index + 1}. ${table}`));

    const includeInput = await askQuestion(
      rl,
      '\nInclude tables (numbers/names, comma-separated, or "all") [all]: '
    );
    const includeTables = parseSelection(includeInput, allTables);
    if (includeTables.length === 0) {
      await client.end();
      throw new Error('No tables selected for include');
    }

    const excludeInput = await askQuestion(
      rl,
      'Exclude tables from included set (numbers/names, comma-separated, or "none") [none]: '
    );
    const excludeCandidates = parseSelection(excludeInput || 'none', includeTables);
    const excludeSet = new Set(excludeCandidates);
    const chosenTables = includeTables.filter(t => !excludeSet.has(t));

    if (chosenTables.length === 0) {
      await client.end();
      throw new Error('All tables were excluded; nothing to generate');
    }

    const schemaPath = (await askQuestion(rl, 'Schema output file [schema.sql]: ')) || 'schema.sql';
    const guardsPath = (await askQuestion(rl, 'Type guards output file [schema.ts]: ')) || 'schema.ts';

    console.log(`\n✅ Include: ${includeTables.join(', ')}`);
    console.log(`✅ Exclude: ${excludeCandidates.length ? excludeCandidates.join(', ') : '(none)'}`);
    console.log(`✅ Final table set: ${chosenTables.join(', ')}`);

    const createStatements = [];
    for (const table of chosenTables) {
      const columnsResult = await client.query(
        `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position
        `,
        [table]
      );

      createStatements.push(toCreateTableSQL(table, columnsResult.rows));
    }

    await client.end();

    const sql = `${createStatements.join('\n\n')}\n`;
    const ast = parseSql(sql);
    const guards = generateAllTypes(ast);

    const config = {
      include: includeTables,
      exclude: excludeCandidates,
      output: { format: 'esm' },
    };

    writeFileSync(schemaPath, sql);
    writeFileSync('.schemaguard.json', `${JSON.stringify(config, null, 2)}\n`);
    writeFileSync(guardsPath, `// Generated by SchemaGuard\n${guards}`);

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║            🎉 All set!               ║');
    console.log('╚════════════════════════════════════════╝\n');
    console.log(`Generated files:`);
    console.log(`  • ${schemaPath}`);
    console.log('  • .schemaguard.json');
    console.log(`  • ${guardsPath}`);
    console.log('\nNext run: schemaguard generate -i schema.sql -o schema.ts\n');
  } finally {
    rl.close();
  }
}

module.exports = { init, parseSelection, toCreateTableSQL };
