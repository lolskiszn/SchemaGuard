# SchemaGuard - PRD

## 1. Project Overview

**Project Name:** SchemaGuard  
**Project Type:** Developer Tool / CLI / Library  
**Core Functionality:** A schema guard generator that automatically creates TypeScript type guards from database schemas, enabling type-safe database-to-TypeScript workflows.  
**Target Users:** Full-stack developers working with TypeScript backends and relational databases (PostgreSQL, MySQL, etc.)

---

## 2. Problem Statement

When building TypeScript applications with databases, developers face a gap:
- Database schemas define data structure in SQL (DDL)
- TypeScript needs type definitions for runtime validation
- Manual creation of type guards is error-prone and tedious
- Changes in DB schema require manual updates to TypeScript types

**Current Pain:** No existing tool directly generates TypeScript runtime type guards from DB schemas in an automated way.

---

## 3. Target Users & Use Cases

### Primary Users
- Full-stack TypeScript developers
- Backend developers using ORMs (Prisma, Drizzle, Knex)
- Teams with TypeScript + PostgreSQL/MySQL

### Use Cases
1. **Generate type guards from SQL DDL** - Parse CREATE TABLE statements → TypeScript guards
2. **Generate from ORM schema files** - Parse Prisma schema → TypeScript type guards
3. **Generate from database introspection** - Connect to DB → reflect schema → generate guards
4. **Integrate into CI/CD** - Auto-regenerate guards on schema changes

---

## 4. Core Features (MVP)

### F1: SQL DDL Parser
- Parse PostgreSQL/MySQL CREATE TABLE statements
- Extract column names, types, constraints (NOT NULL, PRIMARY KEY, UNIQUE)
- Support common types: INT, VARCHAR, TEXT, BOOLEAN, TIMESTAMP, DECIMAL, JSON, UUID

### F2: Type Guard Generator
- Generate TypeScript type guards for each table
- Handle nullable vs non-nullable fields
- Handle PRIMARY KEY and unique constraints
- Generate union types for enums (if detected)

### F3: CLI Interface
- Command-line tool: `schemaguard generate --input schema.sql --output guards.ts`
- Support multiple input formats (SQL, Prisma, JSON config)
- Options: single file output, per-table files, verbose mode

### F4: TypeScript Output
- Clean, readable TypeScript code
- Export `type X = ...` and `const isX = ...` patterns
- Use `zod`-like simplicity or native TypeScript type guards

---

## 5. Technical Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Input Layer   │ ──▶ │   Core Engine    │ ──▶ │  Output Layer   │
│                 │     │                  │     │                 │
│ • SQL (DDL)     │     │ • Parser         │     │ • TypeScript    │
│ • Prisma Schema │     │ • Type Resolver  │     │ • .d.ts guards  │
│ • JSON Config  │     │ • Guard Builder │     │ • ESM/CJS       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Stack
- **Language:** TypeScript (Node.js)
- **Build:** tsx or tsup for CLI distribution
- **Dependencies:** minimally required (pg-query-parser or custom SQL parser)

---

## 6. Out of Scope (v1)

- GraphQL schema support
- NoSQL databases (MongoDB)
- Graphical UI / web interface
- Auto-migration tooling
- Real-time database monitoring

---

## 7. Success Metrics

- [ ] CLI generates valid TypeScript type guards from SQL DDL
- [ ] Guards correctly validate at runtime (e.g., `isUser({ id: 1 })` → true)
- [ ] Guards reject invalid data (e.g., missing required field → false)
- [ ] MVP usable in < 5 minutes after installation

---

## 8. Roadmap / Phases

| Phase | Focus | Deliverable |
|-------|-------|-------------|
| v0.1  | Core Parsing | SQL DDL parser → AST |
| v0.2  | Guard Generation | AST → TypeScript type guards |
| v0.3  | CLI Packaging | Executable with CLI interface |
| v0.4  | Docs & Publish | README, npm publish |

---

## 9. Key Decisions Needed (from user)

1. **Which SQL dialect to prioritize?** PostgreSQL first (recommended), then MySQL?
2. **Output format preference?** Native TypeScript type guards (`const isX = ...`) or Zod-like schema objects?
3. **Input sources beyond SQL DDL?** Support Prisma schema parsing in v0.2 or defer?
4. **Package name:** `schemaguard` or `@schemaguard/cli` on npm?

---

*PRD created: 2026-04-22*