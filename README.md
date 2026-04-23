# SchemaGuard

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                 │
│   SCHEMA CHANGE          │          YOUR CODE                     │
│   ─────────────         │          ────────                     │
│   email VARCHAR(255)    │  email: string   ✅                    │
│        ↓               │          ↓                            │
│   email TEXT           │  email: string   ❌ Type drift!       │
│                                                                 │
│                    💥 CI FAILS - Caught before production       │
└─────────────────────────────────────────────────────────────────┘
```

**Catch schema drift in CI. Before it reaches users.**

```bash
npm install schemaguard
npx schemaguard generate -i schema.sql -o guards.ts
```

## Why SchemaGuard?

Your database schema and TypeScript types drift apart. SchemaGuard keeps them in sync:

- **Runtime validation** - Type guards generated from your actual DB schema
- **CI drift detection** - Fail your build when schema drift is detected
- **Multi-format parsing** - Works with PostgreSQL SQL, MySQL SQL, and Prisma schema inputs

## Quick Start

```bash
# Generate type guards from SQL schema
npx schemaguard generate -i schema.sql -o src/schema.ts
```

That's it! Import and validate at runtime:

```typescript
import { isUsers } from './schema';

type Users = {
  id: number;
  email: string;
  name?: string | null;
};

// API response validation
function handleUsersResponse(data: unknown): Users {
  if (!isUsers(data)) throw new Error('Invalid response');
  return data;
}
```

## Configuration

Create `.schemaguard.json` in your project root:

```json
{
  "include": ["users", "posts", "accounts"],
  "exclude": ["_prisma_migrations", "audit_log"],
  "output": {
    "format": "esm"
  }
}
```

## GitHub Action: Fail When Schema Drift Is Detected

Add to `.github/workflows/schema-guard.yml`:

```yaml
name: Schema Guard

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install SchemaGuard
        run: npm install schemaguard

      - name: Generate guards
        run: npx schemaguard generate -i schema.sql -o src/schema.ts

      - name: Check for drift
        run: |
          if ! git diff --quiet src/schema.ts; then
            echo "❌ Schema drift detected! Run schemaguard and commit changes."
            exit 1
          fi
          echo "✓ Schema is in sync"
```

This workflow fails when your database schema changes but `src/schema.ts` wasn't updated.

## Supported Inputs

- **PostgreSQL SQL** - `CREATE TABLE` parsing and type guard generation
- **MySQL SQL** - common MySQL table syntax support (`AUTO_INCREMENT`, `DECIMAL`, etc.)
- **Prisma schema** - pass `--prisma` to parse Prisma model definitions
- **Enums** - SQL `CREATE TYPE ... AS ENUM` mapped to TypeScript union literals

## Limitations

- Inline FOREIGN KEY (`REFERENCES`) not supported - use table-level constraints
- Parser coverage is broad but not exhaustive for every dialect edge-case

## License

ISC
