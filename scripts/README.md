# Scripts

The database scripts in this directory resolve the connection string the same way as the app:

- `APP_MODE=standalone` uses `DATABASE_URL`
- `APP_MODE=integrated` uses `NNRXOS_DATABASE_URL`
- `APP_MODE=auto` prefers `NNRXOS_DATABASE_URL` and falls back to `DATABASE_URL`

Set the environment variables before running any script:

```bash
cp .env.example .env.local
# edit .env.local and set APP_MODE plus the database URL for that mode
```

Run a script with `tsx`:

```bash
APP_MODE=standalone DATABASE_URL="postgresql://..." pnpm exec tsx scripts/test-upsert.ts
APP_MODE=standalone DATABASE_URL="postgresql://..." pnpm exec tsx scripts/test-transaction.ts
APP_MODE=standalone DATABASE_URL="postgresql://..." pnpm exec tsx scripts/test-db.ts
APP_MODE=standalone DATABASE_URL="postgresql://..." pnpm exec tsx scripts/migrate.ts
```

Use a database you are comfortable modifying. `test-db.ts`, `test-upsert.ts`, `test-transaction.ts`, and `migrate.ts` all execute real SQL against the configured database URL.
