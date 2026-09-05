import { Router } from "express";
import { currentOrderIndex, isFinished, LOCATION_COUNT, prisma } from "../db.js";

export const teamsRouter = Router();

teamsRouter.get("/", async (_req, res) => {
  const teams = await prisma.team.findMany({
    orderBy: { number: "asc" },
    select: { id: true, number: true, name: true, claimed: true },
  });
  res.json(teams);
});

teamsRouter.post("/:id/claim", async (req, res) => {
  const { id } = req.params;
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";

  if (!name) {
    return res.status(400).json({ error: "Team name is required" });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const team = await tx.team.findUnique({ where: { id } });
      if (!team) {
        return { status: 404 as const, body: { error: "Team not found" } };
      }
      if (team.claimed) {
        return { status: 409 as const, body: { error: "Team already claimed" } };
      }

      const claimedCount = await tx.team.count({ where: { claimed: true } });
      const shouldReassignStart = team.currentStep === 0;
      const startIndex = shouldReassignStart
        ? claimedCount % LOCATION_COUNT
        : team.startIndex;

      const updated = await tx.team.update({
        where: { id },
        data: {
          name,
          claimed: true,
          startIndex,
        },
      });

      return { status: 200 as const, body: updated };
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to claim team" });
  }
});

teamsRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";

  if (!name) {
    return res.status(400).json({ error: "Team name is required" });
  }

  try {
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }
    if (!team.claimed) {
      return res.status(400).json({ error: "Team is not claimed yet" });
    }

    const updated = await prisma.team.update({
      where: { id },
      data: { name },
    });

    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update team" });
  }
});

teamsRouter.get("/:id/current-question", async (req, res) => {
  const { id } = req.params;

  try {
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }
    if (!team.claimed) {
      return res.status(400).json({ error: "Team is not claimed yet" });
    }

    if (isFinished(team.currentStep)) {
      return res.json({
        finished: true,
        team: {
          id: team.id,
          number: team.number,
          name: team.name,
          currentStep: team.currentStep,
          total: LOCATION_COUNT,
        },
      });
    }

    const orderIndex = currentOrderIndex(team.startIndex, team.currentStep);
    const location = await prisma.location.findUnique({ where: { orderIndex } });
    if (!location) {
      return res.status(500).json({ error: "Location not found for current step" });
    }

    return res.json({
      finished: false,
      team: {
        id: team.id,
        number: team.number,
        name: team.name,
        currentStep: team.currentStep,
        total: LOCATION_COUNT,
      },
      question: {
        locationId: location.id,
        orderIndex: location.orderIndex,
        clueText: location.clueText,
        hint: location.hint,
        progressLabel: `${team.currentStep + 1} of ${LOCATION_COUNT}`,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to load current question" });
  }
});
