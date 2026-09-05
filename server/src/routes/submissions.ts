import { Router } from "express";
import multer from "multer";
import {
  currentOrderIndex,
  isFinished,
  LOCATION_COUNT,
  prisma,
} from "../db.js";
import { uploadPhoto } from "../supabase.js";

export const submissionsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

submissionsRouter.get("/recent", async (req, res) => {
  try {
    const afterRaw = typeof req.query.after === "string" ? req.query.after : undefined;
    const after = afterRaw ? new Date(afterRaw) : new Date(0);

    if (Number.isNaN(after.getTime())) {
      return res.status(400).json({ error: "Invalid after timestamp" });
    }

    const submissions = await prisma.submission.findMany({
      where: {
        hidden: false,
        createdAt: { gt: after },
      },
      orderBy: { createdAt: "asc" },
      include: {
        team: { select: { number: true, name: true } },
        location: { select: { orderIndex: true, clueText: true } },
      },
    });

    return res.json(
      submissions.map((s) => ({
        id: s.id,
        photoUrl: s.photoUrl,
        caption: s.location.clueText,
        createdAt: s.createdAt,
        teamNumber: s.team.number,
        teamName: s.team.name || `Team ${s.team.number}`,
        locationOrderIndex: s.location.orderIndex,
      })),
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to load recent submissions" });
  }
});

submissionsRouter.post("/", upload.single("photo"), async (req, res) => {
  const teamId = typeof req.body?.teamId === "string" ? req.body.teamId : "";
  const file = req.file;

  if (!teamId) {
    return res.status(400).json({ error: "teamId is required" });
  }
  if (!file) {
    return res.status(400).json({ error: "photo file is required" });
  }

  try {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }
    if (!team.claimed) {
      return res.status(400).json({ error: "Team is not claimed yet" });
    }
    if (isFinished(team.currentStep)) {
      return res.status(400).json({ error: "Team has already finished" });
    }

    const orderIndex = currentOrderIndex(team.startIndex, team.currentStep);
    const location = await prisma.location.findUnique({ where: { orderIndex } });
    if (!location) {
      return res.status(500).json({ error: "Location not found" });
    }

    const existing = await prisma.submission.findUnique({
      where: {
        teamId_locationId: { teamId: team.id, locationId: location.id },
      },
    });
    if (existing) {
      return res.status(409).json({ error: "Already submitted for this question" });
    }

    const ext = file.mimetype === "image/png" ? "png" : "jpg";
    const contentType = file.mimetype || "image/jpeg";
    const path = `${team.id}/${location.id}-${Date.now()}.${ext}`;
    const photoUrl = await uploadPhoto(file.buffer, path, contentType);

    const result = await prisma.$transaction(async (tx) => {
      try {
        const submission = await tx.submission.create({
          data: {
            teamId: team.id,
            locationId: location.id,
            photoUrl,
            caption: location.clueText,
          },
        });

        const updatedTeam = await tx.team.update({
          where: { id: team.id },
          data: { currentStep: { increment: 1 } },
        });

        return { submission, updatedTeam };
      } catch (err) {
        const code =
          typeof err === "object" && err && "code" in err
            ? String((err as { code: unknown }).code)
            : "";
        if (code === "P2002") {
          throw new Error("Already submitted for this question");
        }
        throw err;
      }
    });

    const { updatedTeam } = result;

    if (isFinished(updatedTeam.currentStep)) {
      return res.json({
        ok: true,
        finished: true,
        submissionId: result.submission.id,
        photoUrl,
        team: {
          id: updatedTeam.id,
          number: updatedTeam.number,
          name: updatedTeam.name,
          currentStep: updatedTeam.currentStep,
          total: LOCATION_COUNT,
        },
      });
    }

    const nextOrder = currentOrderIndex(
      updatedTeam.startIndex,
      updatedTeam.currentStep,
    );
    const nextLocation = await prisma.location.findUnique({
      where: { orderIndex: nextOrder },
    });

    return res.json({
      ok: true,
      finished: false,
      submissionId: result.submission.id,
      photoUrl,
      team: {
        id: updatedTeam.id,
        number: updatedTeam.number,
        name: updatedTeam.name,
        currentStep: updatedTeam.currentStep,
        total: LOCATION_COUNT,
      },
      nextQuestion: nextLocation
        ? {
            locationId: nextLocation.id,
            orderIndex: nextLocation.orderIndex,
            clueText: nextLocation.clueText,
            hint: nextLocation.hint,
            progressLabel: `${updatedTeam.currentStep + 1} of ${LOCATION_COUNT}`,
          }
        : null,
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Upload failed";
    if (message.includes("Already submitted")) {
      return res.status(409).json({ error: message });
    }
    return res.status(500).json({ error: message });
  }
});
