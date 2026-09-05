import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  adminReleaseTeam,
  adminRenameTeam,
  fetchAdminOverview,
  setSubmissionHidden,
  type AdminOverview,
} from "../api";
import {
  clearStoredAdminPasscode,
  getStoredAdminPasscode,
  setStoredAdminPasscode,
} from "../session";

export function AdminPage() {
  const [passcode, setPasscode] = useState(getStoredAdminPasscode() || "");
  const [unlocked, setUnlocked] = useState(Boolean(getStoredAdminPasscode()));
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async (code: string) => {
    const data = await fetchAdminOverview(code);
    setOverview(data);
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    const code = getStoredAdminPasscode();
    if (!code) return;

    let cancelled = false;
    async function tick() {
      try {
        await refresh(code!);
        if (!cancelled) setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Admin refresh failed");
          if (err instanceof Error && err.message.toLowerCase().includes("invalid")) {
            clearStoredAdminPasscode();
            setUnlocked(false);
          }
        }
      }
    }

    tick();
    const interval = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [unlocked, refresh]);

  async function onUnlock(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await refresh(passcode);
      setStoredAdminPasscode(passcode);
      setUnlocked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not unlock");
    }
  }

  if (!unlocked) {
    return (
      <div className="bg-mesh mx-auto flex min-h-dvh max-w-md items-center px-4">
        <form
          onSubmit={onUnlock}
          className="w-full rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-teal-900/10"
        >
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-teal-950">
            Organiser access
          </h1>
          <p className="mt-2 text-sm text-teal-900/70">
            Enter the shared admin passcode to unlock live oversight.
          </p>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="mt-5 min-h-12 w-full rounded-2xl border border-teal-900/15 px-4 outline-none focus:ring-2 focus:ring-gold-400/40"
            placeholder="Passcode"
            required
          />
          {error ? (
            <p className="mt-3 text-sm text-red-700">{error}</p>
          ) : null}
          <button
            type="submit"
            className="mt-5 flex min-h-12 w-full items-center justify-center rounded-2xl bg-teal-900 font-semibold text-white"
          >
            Unlock
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-mesh mx-auto min-h-dvh max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-teal-950">
            Admin overview
          </h1>
          <p className="mt-1 text-sm text-teal-900/70">
            Live progress and quiet corrective levers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            clearStoredAdminPasscode();
            setUnlocked(false);
          }}
          className="text-sm text-teal-800/70 underline-offset-2 hover:underline"
        >
          Lock
        </button>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {overview ? (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Teams finished" value={`${overview.finishedCount} / ${overview.totalTeams}`} />
            <Stat
              label="Claimed"
              value={String(overview.teams.filter((t) => t.claimed).length)}
            />
            <Stat
              label="Photos in feed"
              value={String(overview.recentSubmissions.length)}
            />
          </div>

          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-teal-800/70">
              Team progress
            </h2>
            <div className="overflow-hidden rounded-2xl bg-white/85 ring-1 ring-teal-900/10">
              <ul className="divide-y divide-teal-900/10">
                {overview.teams.map((team) => (
                  <li
                    key={team.id}
                    className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-teal-950">
                        #{team.number}{" "}
                        <span className="font-medium text-teal-900/80">
                          {team.name || (team.claimed ? "Unnamed" : "Unclaimed")}
                        </span>
                      </p>
                      <p className="text-xs text-teal-900/55">
                        {team.claimed
                          ? `${team.completed}/10${team.finished ? " · finished" : ""}`
                          : "Available"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {team.claimed ? (
                        <>
                          <button
                            type="button"
                            disabled={busyId === team.id}
                            onClick={async () => {
                              const next = window.prompt(
                                `Rename team ${team.number}`,
                                team.name || "",
                              );
                              if (!next?.trim()) return;
                              setBusyId(team.id);
                              try {
                                await adminRenameTeam(
                                  getStoredAdminPasscode()!,
                                  team.id,
                                  next.trim(),
                                );
                                await refresh(getStoredAdminPasscode()!);
                              } catch (err) {
                                setError(
                                  err instanceof Error
                                    ? err.message
                                    : "Rename failed",
                                );
                              } finally {
                                setBusyId(null);
                              }
                            }}
                            className="min-h-10 rounded-xl bg-teal-900/8 px-3 text-sm font-medium text-teal-900"
                          >
                            Rename
                          </button>
                          <button
                            type="button"
                            disabled={busyId === team.id}
                            onClick={async () => {
                              if (
                                !window.confirm(
                                  `Release team ${team.number}? It will become claimable again.`,
                                )
                              ) {
                                return;
                              }
                              setBusyId(team.id);
                              try {
                                await adminReleaseTeam(
                                  getStoredAdminPasscode()!,
                                  team.id,
                                );
                                await refresh(getStoredAdminPasscode()!);
                              } catch (err) {
                                setError(
                                  err instanceof Error
                                    ? err.message
                                    : "Release failed",
                                );
                              } finally {
                                setBusyId(null);
                              }
                            }}
                            className="min-h-10 rounded-xl bg-gold-300/30 px-3 text-sm font-medium text-teal-950"
                          >
                            Release
                          </button>
                        </>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-teal-800/70">
              Recent submissions
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {overview.recentSubmissions.map((sub) => (
                <article
                  key={sub.id}
                  className="overflow-hidden rounded-2xl bg-white/85 ring-1 ring-teal-900/10"
                >
                  <img
                    src={sub.photoUrl}
                    alt={sub.teamName}
                    className={`h-40 w-full object-cover ${sub.hidden ? "opacity-40" : ""}`}
                  />
                  <div className="p-3">
                    <p className="font-semibold text-teal-950">{sub.teamName}</p>
                    <p className="text-xs text-teal-900/55">
                      Spot {sub.locationOrderIndex + 1}
                      {sub.hidden ? " · hidden from mosaic" : ""}
                    </p>
                    <button
                      type="button"
                      disabled={busyId === sub.id}
                      onClick={async () => {
                        setBusyId(sub.id);
                        try {
                          await setSubmissionHidden(
                            getStoredAdminPasscode()!,
                            sub.id,
                            !sub.hidden,
                          );
                          await refresh(getStoredAdminPasscode()!);
                        } catch (err) {
                          setError(
                            err instanceof Error ? err.message : "Update failed",
                          );
                        } finally {
                          setBusyId(null);
                        }
                      }}
                      className="mt-3 min-h-10 rounded-xl bg-teal-900 px-3 text-sm font-semibold text-white"
                    >
                      {sub.hidden ? "Unhide" : "Hide from mosaic"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : (
        <p className="text-teal-900/70">Loading overview…</p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/85 px-4 py-3 ring-1 ring-teal-900/10">
      <p className="text-xs font-semibold uppercase tracking-wider text-teal-800/60">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl text-teal-950">
        {value}
      </p>
    </div>
  );
}
