# Scripts

The database scripts in this directory use `DATABASE_URL` only. They do not contain a fallback connection string.

Set the environment variable before running any script:

```bash
cp .env.example .env.local
# edit .env.local and set DATABASE_URL to your target database
```

Run a script with `tsx`:

```bash
DATABASE_URL="postgresql://..." pnpm exec tsx scripts/test-upsert.ts
DATABASE_URL="postgresql://..." pnpm exec tsx scripts/test-transaction.ts
DATABASE_URL="postgresql://..." pnpm exec tsx scripts/test-db.ts
DATABASE_URL="postgresql://..." pnpm exec tsx scripts/migrate.ts
```

Use a database you are comfortable modifying. `test-db.ts`, `test-upsert.ts`, `test-transaction.ts`, and `migrate.ts` all execute real SQL against the configured `DATABASE_URL`.
