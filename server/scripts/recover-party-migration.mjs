/**
 * Clears a failed 20260327120000_party_photos deploy when the schema is already
 * present (db push) or so migrate deploy can retry with idempotent SQL.
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const MIGRATION = "20260327120000_party_photos";
const serverRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function runPrisma(args) {
  execSync(`npx prisma ${args}`, {
    cwd: serverRoot,
    stdio: "inherit",
    env: process.env,
  });
}

async function main() {
  const prisma = new PrismaClient();

  try {
    const failed = await prisma.$queryRaw`
      SELECT migration_name
      FROM "_prisma_migrations"
      WHERE migration_name = ${MIGRATION}
        AND finished_at IS NULL
        AND rolled_back_at IS NULL
      LIMIT 1
    `;

    if (!Array.isArray(failed) || failed.length === 0) {
      return;
    }

    const table = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'PartyPhoto'
      ) AS "exists"
    `;

    const hasPartyPhoto = Boolean(table?.[0]?.exists);

    if (hasPartyPhoto) {
      console.log(
        `[migrate] PartyPhoto already exists — marking ${MIGRATION} as applied.`,
      );
      runPrisma(`migrate resolve --applied ${MIGRATION}`);
    } else {
      console.log(
        `[migrate] Recovering failed ${MIGRATION} — will retry idempotent migration.`,
      );
      runPrisma(`migrate resolve --rolled-back ${MIGRATION}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("[migrate] recover-party-migration failed:", err);
  process.exit(1);
});