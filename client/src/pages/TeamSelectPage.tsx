import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchTeams, type TeamSummary } from "../api";
import { getStoredTeamId } from "../session";
import { AppHeader } from "../components/AppHeader";

export function TeamSelectPage() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const storedTeamId = getStoredTeamId();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchTeams();
        if (!cancelled) setTeams(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load teams");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="page-shell bg-mesh mx-auto min-h-dvh max-w-3xl">
      <AppHeader
        subtitle="Tap the team number you were assigned. One person per team claims the spot and sets your name sign."
        showContinue={Boolean(storedTeamId)}
      />

      {loading ? (
        <p className="text-center text-navy-800/70">Loading teams…</p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-center text-red-800 ring-1 ring-sp-red/20">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5">
        {teams.map((team, index) => {
          const taken = team.claimed;
          return (
            <button
              key={team.id}
              type="button"
              disabled={taken}
              onClick={() => navigate(`/claim/${team.id}`)}
              style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
              className={`animate-fade-up flex min-h-[6.5rem] flex-col items-center justify-center rounded-2xl px-2 py-4 text-center transition active:scale-[0.98] sm:min-h-[7rem] ${
                taken
                  ? "cursor-not-allowed bg-navy-900/8 text-navy-900/40 ring-1 ring-navy-900/10"
                  : "bg-white/90 text-navy-950 shadow-sm ring-2 ring-sp-red/15 hover:bg-white hover:ring-sp-red/35"
              }`}
            >
              <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-sp-red sm:text-4xl">
                {team.number}
              </span>
              <span className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug text-navy-900/80">
                {taken ? team.name || "Taken" : "Available"}
              </span>
              {taken ? (
                <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-navy-800/45">
                  Taken
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="mt-8 pb-2 text-center text-sm text-navy-900/45">
        Organiser?{" "}
        <Link to="/admin" className="underline underline-offset-2">
          Admin
        </Link>
        {" · "}
        <Link to="/display" className="underline underline-offset-2">
          Mosaic
        </Link>
      </p>
    </div>
  );
}
