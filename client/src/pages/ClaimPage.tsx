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
    <div className="bg-mesh mx-auto min-h-dvh max-w-lg px-4 py-8">
      <AppHeader subtitle="Choose a team name that matches the name sign you designed. It will appear on the live mosaic." />

      <form
        onSubmit={onSubmit}
        className="animate-fade-up rounded-3xl bg-white/85 p-6 shadow-sm ring-1 ring-teal-900/10"
      >
        <p className="text-sm font-semibold uppercase tracking-wider text-teal-800/70">
          Team {teamNumber ?? "…"}
        </p>
        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-medium text-teal-950">
            Team name
          </span>
          <input
            required
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. The Coffee Club"
            className="min-h-12 w-full rounded-2xl border border-teal-900/15 bg-sand-50 px-4 text-base outline-none ring-gold-400/0 transition focus:border-teal-700 focus:ring-2 focus:ring-gold-400/40"
          />
        </label>

        {error ? (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting || !name.trim() || Boolean(error)}
          className="mt-6 flex min-h-12 w-full items-center justify-center rounded-2xl bg-teal-900 text-base font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Claiming…" : "Claim team & start"}
        </button>

        <Link
          to="/"
          className="mt-4 block text-center text-sm text-teal-800/70 underline-offset-2 hover:underline"
        >
          Back to team grid
        </Link>
      </form>
    </div>
  );
}
