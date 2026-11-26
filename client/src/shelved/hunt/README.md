# Shelved scavenger hunt UI

The staff Christmas party app is the default at `/`, `/admin`, and `/display`.

The original scavenger hunt is preserved here and still available at:

| Route | Purpose |
|-------|---------|
| `/hunt` | Team picker |
| `/hunt/claim/:teamId` | Claim team |
| `/hunt/play` | Clue + photo upload |
| `/hunt/done` | Finished screen |
| `/hunt/display` | Hunt mosaic |
| `/hunt/admin` | Hunt organiser |

Server APIs for the hunt remain at `/api/teams`, `/api/submissions`, `/api/leaderboard`, and `/api/admin` (unchanged).

To make the hunt the primary app again, point `App.tsx` routes back to these pages at `/` and retire or relocate the party routes.