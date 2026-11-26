# Staff Christmas party photo wall

Mobile-friendly staff uploads (photo + name + caption), organiser approval, and a big-screen slideshow with a side preview rail. Each approved photo shows for **7 seconds**.

The original scavenger hunt is **shelved** (not removed): UI at `/hunt/*`, APIs unchanged. See `client/src/shelved/hunt/README.md`.

## Stack

- **Client:** React, TypeScript, Vite, Tailwind CSS
- **Server:** Node, Express, Prisma
- **Database:** PostgreSQL (Railway)
- **Photos:** Supabase Storage

## URLs (production)

| URL | Who |
|-----|-----|
| `/` | Staff — upload link to share |
| `/admin` | Organiser — approve / deny |
| `/display` | Projector / TV — live stream |
| `/hunt` | Shelved scavenger hunt |

## Environment variables

Copy `.env.example` to `.env` at the repo root.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_BUCKET` | Photo storage |
| `ADMIN_PASSCODE` | Organiser login for `/admin` |
| `PORT` | API port (default `3000`) |
| `CLIENT_ORIGIN` | Dev CORS |
| `NODE_ENV` | `production` to serve `client/dist` |

After pulling party changes, run:

```bash
cd server
npx prisma migrate deploy
# or locally: npx prisma db push
```

If Railway shows **P3009** / `PartyPhotoStatus already exists`, redeploy after pulling latest `main` (startup runs `recover-party-migration.mjs`). To fix manually in Railway **Console**:

```bash
cd server
npx prisma migrate resolve --applied 20260327120000_party_photos
# use --rolled-back instead if PartyPhoto table does not exist, then redeploy
```

## Local dev

```bash
npm install
npm run setup
cd server && npx prisma generate && npx prisma db push && cd ..
npm run dev
```

- Staff upload: http://localhost:5173  
- Display: http://localhost:5173/display  
- Admin: http://localhost:5173/admin  

## Flow

1. Staff open the shared link (`/`), add name + optional caption, upload a photo.
2. Uploads land in **Pending** until an organiser approves or denies in `/admin`.
3. Only **Approved** photos appear on `/display` (7s spotlight + side “up next” panel).
4. Denied photos never hit the stream; organisers can move items back to the queue if needed.