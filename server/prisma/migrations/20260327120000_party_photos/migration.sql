-- CreateEnum (idempotent — production may already have this from db push or a partial apply)
DO $$ BEGIN
    CREATE TYPE "PartyPhotoStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "PartyPhoto" (
    "id" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "caption" TEXT,
    "staffName" TEXT NOT NULL,
    "status" "PartyPhotoStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "PartyPhoto_pkey" PRIMARY KEY ("id")
);