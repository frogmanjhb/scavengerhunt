import { Router } from "express";
import { PartyPhotoStatus } from "@prisma/client";
import { requireAdmin } from "../adminAuth.js";
import { prisma } from "../db.js";

export const partyAdminRouter = Router();

partyAdminRouter.use(requireAdmin);

partyAdminRouter.get("/overview", async (_req, res) => {
  try {
    const photos = await prisma.partyPhoto.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const counts = await prisma.partyPhoto.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    const countByStatus: Record<string, number> = {
      PENDING: 0,
      APPROVED: 0,
      DENIED: 0,
    };
    for (const row of counts) {
      countByStatus[row.status] = row._count._all;
    }

    return res.json({
      counts: countByStatus,
      photos: photos.map((p) => ({
        id: p.id,
        photoUrl: p.photoUrl,
        caption: p.caption,
        staffName: p.staffName,
        status: p.status,
        createdAt: p.createdAt,
        reviewedAt: p.reviewedAt,
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to load party admin overview" });
  }
});

partyAdminRouter.patch("/photos/:id", async (req, res) => {
  const { id } = req.params;
  const statusRaw = req.body?.status;

  if (
    statusRaw !== PartyPhotoStatus.APPROVED &&
    statusRaw !== PartyPhotoStatus.DENIED &&
    statusRaw !== PartyPhotoStatus.PENDING
  ) {
    return res.status(400).json({
      error: "status must be PENDING, APPROVED, or DENIED",
    });
  }

  try {
    const photo = await prisma.partyPhoto.update({
      where: { id },
      data: {
        status: statusRaw,
        reviewedAt:
          statusRaw === PartyPhotoStatus.PENDING ? null : new Date(),
      },
    });
    return res.json(photo);
  } catch {
    return res.status(404).json({ error: "Photo not found" });
  }
});