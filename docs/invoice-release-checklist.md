# Invoices & receipts: production release checklist

This feature adds the owner's invoice and receipt tools under **Admin → Invoices**
(garments with items, part payments, receipts, WhatsApp-ready image/PDF), an
**Open admin panel** banner on the profile page for staff/owner accounts, and
the home-screen app manifest.

It needs **five new database tables**. The application code and the tables must
ship in this order: **tables first, code second.** Deploying the code before the
tables exist makes `/admin/invoices` error (the rest of the site is unaffected).

Nothing in this file is permission to run against Production. Follow the
gates in `docs/database-migrations.md`.

## What is in this release

- `src/lib/schema.ts`: the new tables (`document_counters`, `invoices`,
  `invoice_sections`, `invoice_items`, `invoice_payments`) and types.
- `scripts/production-invoices/001_invoices_and_receipts.sql`: the matching
  SQL. Additive only (new tables), guarded with `IF NOT EXISTS`, one
  transaction, safe to run twice. Verified to produce the same 43 columns and
  14 constraints as the development database.
- Admin pages, actions, and components for invoices; the export/share buttons;
  `src/app/manifest.ts`; `public/brand/owner-signature.png`.
- Dependencies: `html-to-image`, `jspdf`.

It deliberately does **not** include the Operations menu page or the dashboard
trim. Those build on the separate hardening work and ship with it.

## Before touching Production

1. Confirm the Neon project, branch, and database that Vercel Production uses.
2. Create a **Neon restore point** (or branch) of Production and note how to restore it.
3. Save counts of Production's existing tables (orders, products, users) to compare afterwards.
4. Confirm none of the five table names already exist in Production:

   ```sql
   select table_name from information_schema.tables
   where table_schema = 'public'
     and table_name in ('document_counters','invoices','invoice_sections','invoice_items','invoice_payments');
   ```

   It must return no rows. If it returns any, stop and compare shapes first.
5. Rehearse on a **Neon clone** of Production first: run the SQL file, run it a
   second time (must be a no-op), then point a Vercel Preview at the clone and
   walk through the checks below.

## Release steps

1. **Apply the SQL to Production** (after the clone rehearsal passes), in the
   Neon SQL editor or `psql`, using the confirmed Production connection:
   `scripts/production-invoices/001_invoices_and_receipts.sql`.
   - This is a manual, reviewed step. It is not part of `npm run db:migrate`,
     the Vercel build, or any request path.
   - Do **not** use `npm run db:migrate` against Production until the bridge
     in `docs/production-bridge-runbook.md` has been approved.
2. Re-run the table check from step 4 above. It must now list all five tables.
3. **Merge/deploy** the `release/invoices-receipts` branch (Vercel builds it).
4. Confirm Vercel's Production environment has `DATABASE_URL`, `BETTER_AUTH_URL`,
   and `NEXT_PUBLIC_APP_URL` set to the live https address (the share button and
   the sign-in/reset links depend on it).

## Post-release checks (use a real admin account)

- Sign in, open **Profile**, confirm the **Open admin panel** button shows for
  an owner/staff account and does **not** show for a normal customer account.
- **Admin → Invoices → New invoice**: two garments, a few items each. Save.
- Open the invoice: totals and subtotals correct, amount in words correct.
- **Record a payment** (part payment, Transfer, pick a bank): a receipt is created.
- On a phone over https: **Share on WhatsApp** opens the share sheet with the image.
- Edit the invoice after the payment: allowed; the total cannot go below what
  was paid.
- Void a test receipt and a test invoice; confirm they show as void.
- Confirm orders, checkout, and payments still work as before.

## Rollback

The tables are new and unused by anything else, so rolling back the **code**
(redeploy the previous Vercel deployment) is enough; the empty tables can stay.
If invoice records were created and must be removed, restore the Neon restore
point rather than deleting rows or dropping tables by hand.
