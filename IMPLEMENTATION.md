# SchemaGuard - Implementation Plan

## Project Overview
- **Name:** SchemaGuard
- **Type:** TypeScript CLI tool for generating runtime type guards from database schemas
- **Mission:** Bridge the gap between SQL database schemas and TypeScript type safety

---

## Architecture

```
Input (SQL/Prisma/JSON) → Parser → AST → Guard Builder → TypeScript Output
```

### Directory Structure (Proposed)
```
schemaguard/
├── src/
│   ├── parser/
│   │   ├── sql-lexer.ts      # Tokenize SQL input
│   │   ├── sql-parser.ts    # Parse tokens to AST
│   │   └── types.ts        # AST type definitions
│   ├── generator/
│   │   ├── guard-builder.ts # Build type guard functions
│   │   └── templates.ts   # Output templates
│   ├── cli/
│   │   └── index.ts        # CLI entry point
│   └── index.ts           # Library entry
├── bin/
│   └── schemaguard       # CLI executable
├── package.json
├── tsconfig.json
└── README.md
```

---

## Phase 1: Project Setup (v0.1)

### Tasks
- [ ] Initialize Node.js project with `npm init`
- [ ] Install TypeScript and dev dependencies
- [ ] Configure tsconfig.json
- [ ] Set up build scripts (tsup or tsc)
- [ ] Create basic project structure

### Dependencies
- `typescript` (dev)
- `tsup` or `tsx` (dev)
- `vitest` (dev, optional for testing)

---

## Phase 2: SQL DDL Parser (v0.1)

### Tasks
- [ ] Create `src/parser/types.ts` - Define AST types:
  ```typescript
  interface TableSchema {
    name: string;
    columns: Column[];
    constraints: Constraint[];
  }
  interface Column {
    name: string;
    type: string;
    nullable: boolean;
    isPrimaryKey: boolean;
    isUnique: boolean;
  }
  ```
- [ ] Create `src/parser/sql-lexer.ts` - Tokenize SQL (keywords, identifiers, types, symbols)
- [ ] Create `src/parser/sql-parser.ts` - Parse tokens into TableSchema AST
- [ ] Support: CREATE TABLE, column definitions, PRIMARY KEY, NOT NULL, UNIQUE

### Example Input → AST
```sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100),
  is_active BOOLEAN DEFAULT true
);
```
→ AST with table name "users", 4 columns with their types/constraints

---

## Phase 3: Type Guard Generator (v0.2)

### Tasks
- [ ] Create `src/generator/guard-builder.ts` - Transform AST to TypeScript
- [ ] Generate type definition: `type User = {...}`
- [ ] Generate type guard: `const isUser = (obj: unknown): obj is User => {...}`
- [ ] Handle nullable fields (accept null/undefined)
- [ ] Handle primary key validation

### Output Example
```typescript
export type User = {
  id: number;
  email: string;
  name?: string;
  isActive: boolean;
};

export const isUser = (obj: unknown): obj is User => {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as User;
  return (
    typeof o.id === "number" &&
    typeof o.email === "string" &&
    (o.name === undefined || typeof o.name === "string") &&
    typeof o.isActive === "boolean"
  );
};
```

---

## Phase 4: CLI Interface (v0.3)

### Tasks
- [ ] Create `src/cli/index.ts` with commander or minimal CLI
- [ ] Define CLI options:
  - `--input, -i <file>` - Input SQL file (required)
  - `--output, -o <file>` - Output file (optional)
  - `--format, -f esm|cjs` - Output format (default: esm)
  - `--verbose, -v` - Verbose output
- [ ] Create executable bin script
- [ ] Add build configuration for package.json

### CLI Usage
```bash
schemaguard generate -i schema.sql -o guards.ts
schemaguard generate -i schema.sql --format cjs
cat schema.sql | schemaguard generate
```

---

## Phase 5: Documentation & Publishing (v0.4)

### Tasks
- [ ] Write comprehensive README.md with:
  - Installation instructions
  - Usage examples
  - Supported SQL types mapping
- [ ] Add license (MIT or Apache 2.0)
- [ ] Publish to npm (requires npm account + token)

---

## Supported SQL Types Mapping

| SQL Type | TypeScript Type |
|----------|-----------------|
| INT, INTEGER | number |
| BIGINT | number |
| VARCHAR(n), CHAR(n) | string |
| TEXT | string |
| BOOLEAN | boolean |
| TIMESTAMP, DATETIME | Date |
| DATE | string (ISO date) |
| DECIMAL, NUMERIC | number |
| JSON, JSONB | object |
| UUID | string |
| SERIAL | number |

---

## Dependencies (Minimal)

| Package | Purpose | Type |
|---------|---------|------|
| typescript | Type checking | dev |
| tsx | Execute TypeScript | dev |
| commander | CLI parsing | runtime |
| sql-parser (custom) | DDL parsing | src |

---

## Development Workflow

1. **Setup:** `npm install && npm run build`
2. **Develop:** Edit source → `npm run build` → test CLI
3. **Test:** Run parser against sample SQL files
4. **Distribute:** `npm publish` (requires auth)

---

## Future Enhancements (Post-MVP)

- Prisma schema input support
- MySQL dialect support  
- Zod schema output option
- Database introspection (connect directly to DB)
- GitHub Action for CI integration
- VS Code extension

---

*Implementation Plan created: 2026-04-22*