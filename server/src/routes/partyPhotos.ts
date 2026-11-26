import { Router } from "express";
import multer from "multer";
import { PartyPhotoStatus } from "@prisma/client";
import { prisma } from "../db.js";
import { uploadPhoto } from "../supabase.js";

export const partyPhotosRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

function mapPhoto(photo: {
  id: string;
  photoUrl: string;
  caption: string | null;
  staffName: string;
  status: PartyPhotoStatus;
  createdAt: Date;
}) {
  return {
    id: photo.id,
    photoUrl: photo.photoUrl,
    caption: photo.caption,
    staffName: photo.staffName,
    status: photo.status,
    createdAt: photo.createdAt,
  };
}

partyPhotosRouter.get("/stream", async (req, res) => {
  try {
    const afterRaw =
      typeof req.query.after === "string" ? req.query.after : undefined;
    const after = afterRaw ? new Date(afterRaw) : new Date(0);

    if (Number.isNaN(after.getTime())) {
      return res.status(400).json({ error: "Invalid after timestamp" });
    }

    const photos = await prisma.partyPhoto.findMany({
      where: {
        status: PartyPhotoStatus.APPROVED,
        createdAt: { gt: after },
      },
      orderBy: { createdAt: "asc" },
    });

    return res.json(photos.map(mapPhoto));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to load photo stream" });
  }
});

partyPhotosRouter.get("/stream/all-approved", async (_req, res) => {
  try {
    const photos = await prisma.partyPhoto.findMany({
      where: { status: PartyPhotoStatus.APPROVED },
      orderBy: { createdAt: "asc" },
    });
    return res.json(photos.map(mapPhoto));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to load photo stream" });
  }
});

partyPhotosRouter.post("/", upload.single("photo"), async (req, res) => {
  const staffName =
    typeof req.body?.staffName === "string" ? req.body.staffName.trim() : "";
  const caption =
    typeof req.body?.caption === "string" ? req.body.caption.trim() : "";
  const file = req.file;

  if (!staffName || staffName.length > 80) {
    return res.status(400).json({ error: "Your name is required (max 80 characters)" });
  }
  if (caption.length > 280) {
    return res.status(400).json({ error: "Caption is too long (max 280 characters)" });
  }
  if (!file) {
    return res.status(400).json({ error: "Photo file is required" });
  }

  try {
    const ext = file.mimetype === "image/png" ? "png" : "jpg";
    const contentType = file.mimetype || "image/jpeg";
    const path = `party/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const photoUrl = await uploadPhoto(file.buffer, path, contentType);

    const photo = await prisma.partyPhoto.create({
      data: {
        photoUrl,
        staffName,
        caption: caption || null,
        status: PartyPhotoStatus.PENDING,
      },
    });

    return res.status(201).json({
      ok: true,
      message:
        "Thanks! Your photo is waiting for approval before it appears on the big screen.",
      photo: mapPhoto(photo),
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return res.status(500).json({ error: message });
  }
});