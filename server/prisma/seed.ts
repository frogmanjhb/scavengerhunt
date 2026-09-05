import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { LOCATIONS } from "../src/locations.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

async function main() {
  for (let number = 1; number <= 25; number++) {
    await prisma.team.upsert({
      where: { number },
      update: {},
      create: {
        number,
        name: null,
        claimed: false,
        startIndex: 0,
        currentStep: 0,
      },
    });
  }

  for (let orderIndex = 0; orderIndex < LOCATIONS.length; orderIndex++) {
    await prisma.location.upsert({
      where: { orderIndex },
      update: { clueText: LOCATIONS[orderIndex].clueText },
      create: {
        orderIndex,
        clueText: LOCATIONS[orderIndex].clueText,
      },
    });
  }

  console.log(`Seeded 25 teams and ${LOCATIONS.length} locations.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
