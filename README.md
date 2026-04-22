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
- **Zero config needed** - Works out of the box with PostgreSQL CREATE TABLE

## Quick Start

```bash
# Generate type guards from SQL schema
npx schemaguard generate -i schema.sql -o src/schema.ts
```

That's it! Import and validate at runtime:

```typescript
import { isUsers, isPosts } from './schema';

// API response validation
function handle UsersResponse(data: unknown): Users {
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

## Supported SQL

- **PostgreSQL** - Full support
- Column types: `SERIAL`, `VARCHAR(n)`, `TEXT`, `BOOLEAN`, `TIMESTAMP`, `UUID`, `JSONB`, `DECIMAL`
- Constraints: `PRIMARY KEY`, `NOT NULL`, `UNIQUE`, `DEFAULT`, table-level `FOREIGN KEY`

## Limitations

- Inline FOREIGN KEY (`REFERENCES`) not supported - use table-level constraints
- MySQL/Prisma schema - deferred

## License

ISC
