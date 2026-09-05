import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

const CLUES = [
  "Take a photo of everyone's left foot in a circle.",
  "Find a place where prayers are sung and voices are hushed. Take a photo and strike a pose before you go.",
  "Write the initials 'STP' without using pen or paper.",
  "They see you come, they see you go. They are in the know. Who are they?",
  "Gravity does most of the work here. Going up is considerably harder than going down.",
  "Take a selfie of your team's reflection.",
  "Find something old, tall and deeply rooted. This one holds a special message.",
  "She doesn't teach lessons, she doesn't mark books and she doesn't attend staff meetings, but has watched over the girls for years. Who is she?",
  "Find the school's feathered VIPs and gather the flock for a photo.",
  "Find love somewhere on campus. A message, a couple, a heart, an object.",
];

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

  for (let orderIndex = 0; orderIndex < CLUES.length; orderIndex++) {
    await prisma.location.upsert({
      where: { orderIndex },
      update: { clueText: CLUES[orderIndex] },
      create: {
        orderIndex,
        clueText: CLUES[orderIndex],
      },
    });
  }

  console.log("Seeded 25 teams and 10 locations.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
