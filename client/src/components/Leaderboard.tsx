import type { LeaderboardEntry } from "../api";

type LeaderboardProps = {
  entries: LeaderboardEntry[];
  highlightTeamId?: string | null;
  variant?: "light" | "display";
  className?: string;
  maxRows?: number;
};

export function Leaderboard({
  entries,
  highlightTeamId = null,
  variant = "light",
  className = "",
  maxRows,
}: LeaderboardProps) {
  const rows = maxRows ? entries.slice(0, maxRows) : entries;
  const isDisplay = variant === "display";

  return (
    <div
      className={`animate-fade-up flex flex-col overflow-hidden rounded-3xl ${
        isDisplay
          ? "bg-navy-950/90 ring-2 ring-sp-gold/50 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md"
          : "bg-white/95 ring-2 ring-sp-gold/40 shadow-sm"
      } ${className}`}
    >
      <div
        className={`shrink-0 border-b px-4 py-3 sm:px-5 ${
          isDisplay ? "border-white/10" : "border-navy-900/8"
        }`}
      >
        <p
          className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${
            isDisplay ? "text-sp-gold" : "text-sp-red"
          }`}
        >
          Leaderboard
        </p>
        <h2
          className={`mt-1 font-[family-name:var(--font-display)] text-xl leading-tight sm:text-2xl ${
            isDisplay ? "text-white" : "text-navy-950"
          }`}
        >
          Tasks completed
        </h2>
      </div>

      {rows.length === 0 ? (
        <p
          className={`px-4 py-6 text-center text-sm sm:px-5 ${
            isDisplay ? "text-white/50" : "text-navy-800/55"
          }`}
        >
          Waiting for teams to claim…
        </p>
      ) : (
        <ol className="min-h-0 flex-1 overflow-y-auto overscroll-contain max-h-[min(52dvh,28rem)] lg:max-h-none">
          {rows.map((entry) => {
            const highlighted = entry.id === highlightTeamId;
            return (
              <li
                key={entry.id}
                className={`flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0 sm:px-5 ${
                  isDisplay ? "border-white/8" : "border-navy-900/6"
                } ${
                  highlighted
                    ? isDisplay
                      ? "bg-sp-gold/15"
                      : "bg-sp-gold/20"
                    : ""
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    entry.rank === 1
                      ? "bg-sp-gold text-navy-950"
                      : entry.rank === 2
                        ? isDisplay
                          ? "bg-white/20 text-white"
                          : "bg-navy-100 text-navy-900"
                        : entry.rank === 3
                          ? isDisplay
                            ? "bg-sp-red/80 text-white"
                            : "bg-sp-red/15 text-sp-red"
                          : isDisplay
                            ? "bg-white/10 text-white/70"
                            : "bg-navy-50 text-navy-800/70"
                  }`}
                >
                  {entry.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate font-semibold ${
                      isDisplay ? "text-white" : "text-navy-950"
                    }`}
                  >
                    {entry.name}
                    {highlighted ? (
                      <span
                        className={`ml-2 text-[10px] font-semibold uppercase tracking-wider ${
                          isDisplay ? "text-sp-gold" : "text-sp-red"
                        }`}
                      >
                        you
                      </span>
                    ) : null}
                  </p>
                  <p
                    className={`text-xs ${
                      isDisplay ? "text-white/45" : "text-navy-800/50"
                    }`}
                  >
                    Team {entry.number}
                    {entry.finished ? " · finished" : ""}
                  </p>
                </div>
                <p
                  className={`shrink-0 font-[family-name:var(--font-display)] text-lg tabular-nums ${
                    isDisplay ? "text-sp-gold" : "text-navy-950"
                  }`}
                >
                  {entry.completed}
                  <span
                    className={`text-sm font-sans font-normal ${
                      isDisplay ? "text-white/40" : "text-navy-800/40"
                    }`}
                  >
                    /{entry.total}
                  </span>
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
