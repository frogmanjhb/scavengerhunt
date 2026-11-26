import "./loadEnv.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { adminRouter } from "./routes/admin.js";
import { leaderboardRouter } from "./routes/leaderboard.js";
import { partyAdminRouter } from "./routes/partyAdmin.js";
import { partyPhotosRouter } from "./routes/partyPhotos.js";
import { submissionsRouter } from "./routes/submissions.js";
import { teamsRouter } from "./routes/teams.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === "production";

app.use(
  cors({
    origin: isProd ? true : process.env.CLIENT_ORIGIN || "http://localhost:5173",
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/party", partyPhotosRouter);
app.use("/api/party/admin", partyAdminRouter);

// Shelved scavenger hunt API (client routes under /hunt)
app.use("/api/teams", teamsRouter);
app.use("/api/submissions", submissionsRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/admin", adminRouter);

if (isProd) {
  const clientDist = path.resolve(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ error: err.message || "Internal server error" });
  },
);

const server = app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use. Stop the other process or set PORT in .env.`,
    );
  } else {
    console.error("Server failed to start:", err.message);
  }
  process.exit(1);
});
