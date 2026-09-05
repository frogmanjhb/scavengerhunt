import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { claimTeam, fetchTeams } from "../api";
import { setStoredTeamId } from "../session";
import { AppHeader } from "../components/AppHeader";

export function ClaimPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [teamNumber, setTeamNumber] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!teamId) return;
    fetchTeams()
      .then((teams) => {
        const team = teams.find((t) => t.id === teamId);
        if (!team) {
          setError("Team not found");
          return;
        }
        if (team.claimed) {
          setError("This team is already claimed");
          return;
        }
        setTeamNumber(team.number);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load team"),
      );
  }, [teamId]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!teamId || !name.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      await claimTeam(teamId, name.trim());
      setStoredTeamId(teamId);
      navigate("/play", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not claim team");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-shell bg-mesh mx-auto flex min-h-dvh max-w-lg flex-col">
      <AppHeader
        compact
        subtitle="Choose a team name that matches the name sign you designed. It will appear on the live mosaic."
      />

      <form
        onSubmit={onSubmit}
        className="animate-fade-up flex flex-1 flex-col rounded-3xl bg-white/90 p-5 shadow-sm ring-2 ring-sp-red/10 sm:p-6"
      >
        <p className="text-sm font-semibold uppercase tracking-wider text-sp-red">
          Team {teamNumber ?? "…"}
        </p>
        <label className="mt-4 block">
          <span className="mb-2 block text-base font-medium text-navy-950">
            Team name
          </span>
          <input
            required
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. The Coffee Club"
            autoComplete="organization"
            enterKeyHint="done"
            className="min-h-14 w-full rounded-2xl border border-navy-900/15 bg-navy-50 px-4 text-lg outline-none transition focus:border-sp-red focus:ring-2 focus:ring-sp-gold/50"
          />
        </label>

        {error ? (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <div className="sticky-cta mt-auto pt-6">
          <button
            type="submit"
            disabled={submitting || !name.trim() || Boolean(error)}
            className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-sp-red text-lg font-semibold text-white transition active:bg-sp-red-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Claiming…" : "Claim team & start"}
          </button>

          <Link
            to="/"
            className="mt-3 flex min-h-12 items-center justify-center text-base text-navy-800/70 underline-offset-2 active:underline"
          >
            Back to team grid
          </Link>
        </div>
      </form>
    </div>
  );
}
