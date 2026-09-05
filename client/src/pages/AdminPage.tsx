import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  adminReleaseTeam,
  adminRenameTeam,
  adminResetAll,
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

type AdminTab = "teams" | "photos";

export function AdminPage() {
  const [passcode, setPasscode] = useState(getStoredAdminPasscode() || "");
  const [unlocked, setUnlocked] = useState(Boolean(getStoredAdminPasscode()));
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<AdminTab>("teams");

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
      <div className="page-shell bg-mesh mx-auto flex min-h-dvh max-w-md items-center">
        <form
          onSubmit={onUnlock}
          className="w-full rounded-3xl bg-white/90 p-5 shadow-sm ring-2 ring-sp-red/10 sm:p-6"
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
            inputMode="numeric"
            autoComplete="current-password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="mt-5 min-h-14 w-full rounded-2xl border border-navy-900/15 px-4 text-lg outline-none focus:ring-2 focus:ring-sp-gold/50"
            placeholder="Passcode"
            required
          />
          {error ? (
            <p className="mt-3 text-sm text-red-700">{error}</p>
          ) : null}
          <button
            type="submit"
            className="mt-5 flex min-h-14 w-full items-center justify-center rounded-2xl bg-sp-red text-lg font-semibold text-white hover:bg-sp-red-dark"
          >
            Unlock
          </button>
        </form>
      </div>
    );
  }

  const claimedCount = overview?.teams.filter((t) => t.claimed).length ?? 0;

  return (
    <div className="page-shell bg-mesh mx-auto min-h-dvh max-w-3xl pb-8">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <SchoolLogo variant="navy" size="sm" className="shrink-0" />
          <div className="min-w-0">
            <h1 className="font-[family-name:var(--font-display)] text-2xl text-navy-950 sm:text-3xl">
              Admin
            </h1>
            <p className="text-sm text-navy-800/70">Live progress</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Link
            to="/display"
            className="inline-flex min-h-11 items-center rounded-xl bg-navy-900 px-3 text-sm font-semibold text-white"
          >
            Mosaic
          </Link>
          <button
            type="button"
            disabled={busyId === "reset-all"}
            onClick={async () => {
              if (
                !window.confirm(
                  "Reset the entire hunt? This clears all photos, releases every team, and resets all progress. This cannot be undone.",
                )
              ) {
                return;
              }
              setBusyId("reset-all");
              setError(null);
              try {
                await adminResetAll(getStoredAdminPasscode()!);
                await refresh(getStoredAdminPasscode()!);
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Reset failed",
                );
              } finally {
                setBusyId(null);
              }
            }}
            className="inline-flex min-h-11 items-center rounded-xl bg-sp-red/10 px-3 text-sm font-semibold text-sp-red-dark disabled:opacity-50"
          >
            {busyId === "reset-all" ? "Resetting…" : "Reset all"}
          </button>
          <button
            type="button"
            onClick={() => {
              clearStoredAdminPasscode();
              setUnlocked(false);
            }}
            className="min-h-10 px-2 text-sm text-navy-800/70 underline-offset-2 hover:underline"
          >
            Lock
          </button>
        </div>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl bg-red-50 px-3 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {overview ? (
        <>
          <div className="mb-4 grid grid-cols-3 gap-2">
            <Stat
              label="Done"
              value={`${overview.finishedCount}/${overview.totalTeams}`}
            />
            <Stat label="Claimed" value={String(claimedCount)} />
            <Stat
              label="Photos"
              value={String(overview.recentSubmissions.length)}
            />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-navy-900/8 p-1.5">
            <TabButton
              active={tab === "teams"}
              onClick={() => setTab("teams")}
              label="Teams"
            />
            <TabButton
              active={tab === "photos"}
              onClick={() => setTab("photos")}
              label="Photos"
            />
          </div>

          {tab === "teams" ? (
            <section className="space-y-3">
              {overview.teams.map((team) => (
                <article
                  key={team.id}
                  className="rounded-2xl bg-white/90 p-4 ring-1 ring-navy-900/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-[family-name:var(--font-display)] text-xl text-navy-950">
                        #{team.number}
                      </p>
                      <p className="truncate font-medium text-navy-900/85">
                        {team.name || (team.claimed ? "Unnamed" : "Unclaimed")}
                      </p>
                      <p className="mt-1 text-sm text-navy-900/55">
                        {team.claimed
                          ? `${team.completed}/10${team.finished ? " · finished" : ""}`
                          : "Available"}
                      </p>
                    </div>
                    {team.claimed ? (
                      <div className="h-2.5 w-16 overflow-hidden rounded-full bg-navy-900/10">
                        <div
                          className="h-full rounded-full bg-sp-red"
                          style={{ width: `${(team.completed / 10) * 100}%` }}
                        />
                      </div>
                    ) : null}
                  </div>

                  {team.claimed ? (
                    <div className="mt-4 grid grid-cols-2 gap-2">
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
                        className="min-h-12 rounded-xl bg-navy-900/8 text-base font-semibold text-navy-900 active:bg-navy-900/15"
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
                        className="min-h-12 rounded-xl bg-sp-gold/40 text-base font-semibold text-navy-950 active:bg-sp-gold/55"
                      >
                        Release
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </section>
          ) : (
            <section className="space-y-3">
              {overview.recentSubmissions.length === 0 ? (
                <p className="rounded-2xl bg-white/70 px-4 py-8 text-center text-navy-800/60">
                  No photos yet.
                </p>
              ) : (
                overview.recentSubmissions.map((sub) => (
                  <article
                    key={sub.id}
                    className="overflow-hidden rounded-2xl bg-white/90 ring-1 ring-navy-900/10"
                  >
                    <img
                      src={sub.photoUrl}
                      alt={sub.teamName}
                      className={`aspect-[16/10] w-full object-cover ${sub.hidden ? "opacity-40" : ""}`}
                    />
                    <div className="p-4">
                      <p className="text-lg font-semibold text-navy-950">
                        {sub.teamName}
                      </p>
                      <p className="text-sm text-navy-900/55">
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
                              err instanceof Error
                                ? err.message
                                : "Update failed",
                            );
                          } finally {
                            setBusyId(null);
                          }
                        }}
                        className="mt-3 flex min-h-12 w-full items-center justify-center rounded-xl bg-sp-red text-base font-semibold text-white active:bg-sp-red-dark"
                      >
                        {sub.hidden ? "Unhide" : "Hide from mosaic"}
                      </button>
                    </div>
                  </article>
                ))
              )}
            </section>
          )}
        </>
      ) : (
        <p className="text-navy-800/70">Loading overview…</p>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-12 rounded-xl text-base font-semibold transition ${
        active
          ? "bg-white text-navy-950 shadow-sm"
          : "text-navy-800/65 active:bg-white/50"
      }`}
    >
      {label}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/85 px-3 py-3 ring-1 ring-navy-900/10">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-sp-red/80">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-xl text-navy-950 sm:text-2xl">
        {value}
      </p>
    </div>
  );
}
