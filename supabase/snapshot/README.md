# Supabase Snapshot — Pre-Bookings State

**Captured:** 2026-03-17  
**Purpose:** Restore point before deploying the `bookings` table and new edge functions.

## Contents

- `schema.sql` — Full DDL to recreate all public tables, indexes, constraints, functions, triggers, RLS policies, and grants.
- `edge-functions/` — Source code for every deployed edge function at the time of snapshot.

## How to Restore

1. **Database:** Run `schema.sql` against a fresh Supabase project (after dropping existing public tables).
2. **Edge functions:** Deploy each function from `edge-functions/<slug>/index.ts` using `supabase functions deploy <slug>`.
