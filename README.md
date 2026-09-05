# The One Where We Had A Scavenger Hunt

Mobile-first staff scavenger hunt web app: 25 teams, 10 campus clues, photo uploads to a live projector mosaic, and a passcode-protected admin view.

## Stack

- **Client:** React, TypeScript, Vite, Tailwind CSS
- **Server:** Node, Express, Prisma
- **Database:** PostgreSQL (Railway)
- **Photos:** Supabase Storage (public bucket; Postgres stores URLs only)

## Project layout

```
client/   Vite React frontend
server/   Express API + Prisma
```

In production, Express serves `client/dist` and the `/api` routes from one Railway service.

## Prerequisites

- Node.js 20+
- PostgreSQL database (local or Railway)
- Supabase project with a **public** storage bucket named `hunt-photos` (or set `SUPABASE_BUCKET`)

## Environment variables

Copy `.env.example` to `.env` at the repo root (the server loads it automatically):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for uploads |
| `SUPABASE_BUCKET` | Bucket name (default `hunt-photos`) |
| `ADMIN_PASSCODE` | Shared organiser passcode for `/admin` |
| `PORT` | API port (default `3000`) |
| `CLIENT_ORIGIN` | Dev CORS origin (default `http://localhost:5173`) |
| `NODE_ENV` | `production` on Railway so static files are served |

Never put `SUPABASE_SERVICE_ROLE_KEY` in the Vite client.

### Supabase bucket setup

1. Create a project at [supabase.com](https://supabase.com).
2. Storage → New bucket → name `hunt-photos` → **Public**.
3. Copy the project URL and **service role** key into `.env`.

## Local setup

```bash
# From repo root
npm install
npm run setup

# Generate Prisma client, push schema (or migrate), seed
cd server
npx prisma generate
npx prisma migrate deploy
# or for a fresh local DB: npx prisma db push
npm run seed
cd ..

npm run dev
```

- App (Vite): http://localhost:5173  
- API: http://localhost:3000  
- Mosaic: http://localhost:5173/display  
- Admin: http://localhost:5173/admin  

Vite proxies `/api` to the Express server.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | API + Vite concurrently |
| `npm run build` | Build client and server |
| `npm start` | Run production server (serves API + static client) |
| `npm run seed` | Seed 25 teams and 10 locations |

## Railway deployment

1. Create a Railway project with a **PostgreSQL** plugin and one **web service** from this repo.
2. Set the env vars above on the web service. Use Railway’s `DATABASE_URL` from the Postgres plugin.
3. Build / start (Nixpacks defaults work with the root `package.json`):

   - **Build:** `npm install && npm run setup && npm run db:generate && npm run build`
   - **Start:** `cd server && npx prisma migrate deploy && NODE_ENV=production node dist/index.js`

   Prefer running seed once after first deploy (Railway shell): `cd server && npx tsx prisma/seed.ts`.

   Example Railway start without seed-on-boot:

   ```
   Start Command: cd server && npx prisma migrate deploy && NODE_ENV=production node dist/index.js
   ```

4. Ensure `NODE_ENV=production` so Express serves `client/dist`.
5. Open the public Railway URL; share it in WhatsApp. Projector uses `/display`, organiser uses `/admin`.

## Product notes

- Teams are seeded 1–25; one claim per team; name is required.
- `startIndex` is assigned at claim as `claimedCount % 10` so groups spread across locations.
- Current question is always `(startIndex + currentStep) % 10` on the server.
- Photos are compressed client-side (max 1600px long edge) before upload.
- Duplicate submissions for the same team/location are rejected.
- Admin can hide/unhide photos, rename teams, and release a mistaken claim.
