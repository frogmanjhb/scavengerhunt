# Shelved scavenger hunt API

Party mode uses `/api/party` and `/api/party/admin`.

The scavenger hunt backend is unchanged and still mounted in `index.ts`:

- `/api/teams`
- `/api/submissions`
- `/api/leaderboard`
- `/api/admin`

Prisma models `Team`, `Location`, and `Submission` remain in the schema for hunt reuse.