# Apex Admin CRM

Standalone multi-tenant admin panel for all ClientZones. Uses **direct Prisma → Supabase Postgres** access (same DB as `crm-platform`). Does **not** call Nest admin APIs and does **not** modify ClientZone PHP or the API.

## Features

- Staff login via `staff_users` table (any tenant)
- Cross-tenant dashboard (filter by tenant where useful)
- Clients, trading accounts, deposits, withdrawals, KYC, tickets, meetings, tenants
- Deposit **Complete** credits balance (same rules as Nest)
- Withdraw **Cancel/Fail** refunds held balance
- KYC approve/reject, ticket reply + status

## Local setup

1. Copy env from the API project:

```bash
# from admin-crm/
cp ../crm-platform/.env .env.local
```

2. Add (or keep) in `.env.local`:

```env
AUTH_SECRET=long-random-string
DATABASE_URL=...   # same as crm-platform
DIRECT_URL=...     # same as crm-platform
```

3. Install & run:

```bash
npm install
npx prisma generate
npm run dev
```

Open http://localhost:3000  
Login: existing staff (e.g. `admin@apex.ai` / your staff password).

## Deploy on Render

1. New **Web Service** → connect this `admin-crm` folder (or monorepo root with Root Directory = `admin-crm`).
2. Settings:
   - **Build:** `npm install && npx prisma generate && npm run build`
   - **Start:** `npm run start` (or `node .next/standalone/server.js` if using standalone copy)
   - **Node:** 20+
3. Environment variables (same DB as API):
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `AUTH_SECRET` (strong random)
   - Optional: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
4. After deploy, open the Render URL and sign in with staff credentials.

## Safety

- Lives only under `admin-crm/` — ClientZone (`New folder/`) and Nest API (`crm-platform/`) are untouched.
- Schema is a copy of `crm-platform/prisma/schema.prisma` (generate only; do not migrate from this app unless you intend to).
