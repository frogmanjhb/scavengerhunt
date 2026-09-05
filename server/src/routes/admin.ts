import { Router } from "express";
import { requireAdmin } from "../adminAuth.js";
import { LOCATION_COUNT, prisma } from "../db.js";

export const adminRouter = Router();

adminRouter.use(requireAdmin);

adminRouter.get("/overview", async (_req, res) => {
  try {
    const teams = await prisma.team.findMany({
      orderBy: { number: "asc" },
      select: {
        id: true,
        number: true,
        name: true,
        claimed: true,
        currentStep: true,
        startIndex: true,
      },
    });

    const finishedCount = teams.filter((t) => t.currentStep >= LOCATION_COUNT).length;

    const recent = await prisma.submission.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        team: { select: { number: true, name: true } },
        location: { select: { orderIndex: true, clueText: true } },
      },
    });

    return res.json({
      finishedCount,
      totalTeams: teams.length,
      teams: teams.map((t) => ({
        ...t,
        completed: Math.min(t.currentStep, LOCATION_COUNT),
        finished: t.currentStep >= LOCATION_COUNT,
      })),
      recentSubmissions: recent.map((s) => ({
        id: s.id,
        photoUrl: s.photoUrl,
        hidden: s.hidden,
        createdAt: s.createdAt,
        teamNumber: s.team.number,
        teamName: s.team.name || `Team ${s.team.number}`,
        locationOrderIndex: s.location.orderIndex,
        clueText: s.location.clueText,
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to load admin overview" });
  }
});

adminRouter.patch("/submissions/:id", async (req, res) => {
  const { id } = req.params;
  const hidden = req.body?.hidden;

  if (typeof hidden !== "boolean") {
    return res.status(400).json({ error: "hidden must be a boolean" });
  }

  try {
    const submission = await prisma.submission.update({
      where: { id },
      data: { hidden },
    });
    return res.json(submission);
  } catch {
    return res.status(404).json({ error: "Submission not found" });
  }
});

adminRouter.patch("/teams/:id", async (req, res) => {
  const { id } = req.params;
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";

  if (!name) {
    return res.status(400).json({ error: "Team name is required" });
  }

  try {
    const team = await prisma.team.update({
      where: { id },
      data: { name },
    });
    return res.json(team);
  } catch {
    return res.status(404).json({ error: "Team not found" });
  }
});

adminRouter.post("/teams/:id/release", async (req, res) => {
  const { id } = req.params;

  try {
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const updated = await prisma.team.update({
      where: { id },
      data: {
        claimed: false,
        name: null,
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to release team" });
  }
});
