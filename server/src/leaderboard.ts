import { LOCATION_COUNT, prisma } from "./db.js";

export type LeaderboardEntry = {
  rank: number;
  id: string;
  number: number;
  name: string;
  completed: number;
  total: number;
  finished: boolean;
  lastSubmissionAt: string | null;
};

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const teams = await prisma.team.findMany({
    where: { claimed: true },
    select: {
      id: true,
      number: true,
      name: true,
      currentStep: true,
      submissions: {
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const sorted = teams
    .map((team) => {
      const completed = Math.min(team.currentStep, LOCATION_COUNT);
      const lastAt = team.submissions[0]?.createdAt ?? null;
      return {
        id: team.id,
        number: team.number,
        name: team.name || `Team ${team.number}`,
        completed,
        total: LOCATION_COUNT,
        finished: team.currentStep >= LOCATION_COUNT,
        lastSubmissionAt: lastAt ? lastAt.toISOString() : null,
        lastMs: lastAt ? lastAt.getTime() : Number.POSITIVE_INFINITY,
      };
    })
    .sort((a, b) => {
      if (b.completed !== a.completed) return b.completed - a.completed;
      if (a.lastMs !== b.lastMs) return a.lastMs - b.lastMs;
      return a.number - b.number;
    });

  return sorted.map(({ lastMs: _lastMs, ...entry }, index) => ({
    ...entry,
    rank: index + 1,
  }));
}
