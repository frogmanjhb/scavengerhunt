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
import { SchoolLogo } from "../components/SchoolLogo";

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
          className="w-full rounded-3xl bg-white/90 p-6 shadow-sm ring-2 ring-sp-red/10"
        >
          <SchoolLogo variant="navy" size="sm" className="mx-auto" />
          <h1 className="mt-4 text-center font-[family-name:var(--font-display)] text-2xl text-navy-950">
            Organiser access
          </h1>
          <p className="mt-2 text-center text-sm text-navy-800/70">
            Enter the shared admin passcode to unlock live oversight.
          </p>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="mt-5 min-h-12 w-full rounded-2xl border border-navy-900/15 px-4 outline-none focus:ring-2 focus:ring-sp-gold/50"
            placeholder="Passcode"
            required
          />
          {error ? (
            <p className="mt-3 text-sm text-red-700">{error}</p>
          ) : null}
          <button
            type="submit"
            className="mt-5 flex min-h-12 w-full items-center justify-center rounded-2xl bg-sp-red font-semibold text-white hover:bg-sp-red-dark"
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
        <div className="flex flex-wrap items-center gap-4">
          <SchoolLogo variant="navy" size="sm" />
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl text-navy-950">
              Admin overview
            </h1>
            <p className="mt-1 text-sm text-navy-800/70">
              Live progress and quiet corrective levers.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            clearStoredAdminPasscode();
            setUnlocked(false);
          }}
          className="text-sm text-navy-800/70 underline-offset-2 hover:underline"
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
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-sp-red">
              Team progress
            </h2>
            <div className="overflow-hidden rounded-2xl bg-white/85 ring-1 ring-navy-900/10">
              <ul className="divide-y divide-navy-900/10">
                {overview.teams.map((team) => (
                  <li
                    key={team.id}
                    className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-navy-950">
                        #{team.number}{" "}
                        <span className="font-medium text-navy-900/80">
                          {team.name || (team.claimed ? "Unnamed" : "Unclaimed")}
                        </span>
                      </p>
                      <p className="text-xs text-navy-900/55">
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
                            className="min-h-10 rounded-xl bg-navy-900/8 px-3 text-sm font-medium text-navy-900"
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
                            className="min-h-10 rounded-xl bg-sp-gold/35 px-3 text-sm font-medium text-navy-950"
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
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-sp-red">
              Recent submissions
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {overview.recentSubmissions.map((sub) => (
                <article
                  key={sub.id}
                  className="overflow-hidden rounded-2xl bg-white/85 ring-1 ring-navy-900/10"
                >
                  <img
                    src={sub.photoUrl}
                    alt={sub.teamName}
                    className={`h-40 w-full object-cover ${sub.hidden ? "opacity-40" : ""}`}
                  />
                  <div className="p-3">
                    <p className="font-semibold text-navy-950">{sub.teamName}</p>
                    <p className="text-xs text-navy-900/55">
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
                      className="mt-3 min-h-10 rounded-xl bg-sp-red px-3 text-sm font-semibold text-white hover:bg-sp-red-dark"
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
        <p className="text-navy-800/70">Loading overview…</p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/85 px-4 py-3 ring-1 ring-navy-900/10">
      <p className="text-xs font-semibold uppercase tracking-wider text-sp-red/80">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl text-navy-950">
        {value}
      </p>
    </div>
  );
}
