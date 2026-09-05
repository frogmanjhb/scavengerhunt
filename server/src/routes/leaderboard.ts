import { Router } from "express";
import { getLeaderboard } from "../leaderboard.js";

export const leaderboardRouter = Router();

leaderboardRouter.get("/", async (_req, res) => {
  try {
    const entries = await getLeaderboard();
    return res.json({ entries });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to load leaderboard" });
  }
});
