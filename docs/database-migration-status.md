# Database migration status

## Current state verified on 2026-11-16

- The live project has four application tables: `profiles`, `user_roles`, `customers`, and `audit_logs`.
- Row Level Security is enabled on all four tables.
- The repository contains one historical Drizzle SQL migration at `drizzle/migrations/0000_phase1_core_schema.sql`.
- The live database contains one corresponding Drizzle migration journal entry.
- `supabase/config.toml` identifies the connected Supabase project.
- There is currently no `supabase/migrations/` directory.
- `drizzle/schema.ts` is intentionally blank and the initial Drizzle snapshot has no tables.

## Deployment guardrails

Do not enable automatic production database deployment yet.

Do not copy the Drizzle SQL file into `supabase/migrations/` and apply it as a new migration: the schema already exists in the live database, so that would attempt to recreate existing objects unless a deliberate baseline/repair procedure is performed first.

Do not run `drizzle-kit generate` while `drizzle/schema.ts` and its snapshot are empty. First reconstruct and validate the Drizzle schema against the live database, then regenerate a consistent snapshot without applying DDL to production.

## Recommended next sequence

1. Reconstruct `drizzle/schema.ts` from the live schema, including enums, columns, defaults, indexes, constraints, and relations.
2. Generate and review a Drizzle snapshot in an isolated branch; verify that it produces no unintended schema changes.
3. Choose exactly one migration authority:
   - continue with Drizzle and keep Supabase GitHub database deployment disabled; or
   - deliberately baseline the existing database for Supabase CLI, mark the baseline as already applied, and move future migrations to `supabase/migrations/`.
4. Test the chosen workflow against a disposable development/staging database.
5. Only after successful review, enable production deployment.

## Authentication

The database contains a trigger that creates a profile when an Auth user is created, but does not grant a role. This is not equivalent to disabling public signup. Public signup must be disabled in the Supabase Auth project settings and then verified independently. No Auth setting was changed by this repository change.
