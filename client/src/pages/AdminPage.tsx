import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  fetchPartyAdminOverview,
  reviewPartyPhoto,
  type PartyAdminOverview,
  type PartyPhotoStatus,
} from "../api";
import {
  clearStoredAdminPasscode,
  getStoredAdminPasscode,
  setStoredAdminPasscode,
} from "../session";
import { SchoolLogo } from "../components/SchoolLogo";

type Filter = "PENDING" | "APPROVED" | "DENIED" | "ALL";

export function AdminPage() {
  const [passcode, setPasscode] = useState(getStoredAdminPasscode() || "");
  const [unlocked, setUnlocked] = useState(Boolean(getStoredAdminPasscode()));
  const [overview, setOverview] = useState<PartyAdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("PENDING");

  const refresh = useCallback(async (code: string) => {
    const data = await fetchPartyAdminOverview(code);
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
          if (
            err instanceof Error &&
            err.message.toLowerCase().includes("invalid")
          ) {
            clearStoredAdminPasscode();
            setUnlocked(false);
          }
        }
      }
    }

    tick();
    const interval = setInterval(tick, 4000);
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

  async function setStatus(id: string, status: PartyPhotoStatus) {
    const code = getStoredAdminPasscode();
    if (!code) return;
    setBusyId(id);
    setError(null);
    try {
      await reviewPartyPhoto(code, id, status);
      await refresh(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  if (!unlocked) {
    return (
      <div className="page-shell bg-party-mesh mx-auto flex min-h-dvh max-w-md items-center">
        <form
          onSubmit={onUnlock}
          className="w-full rounded-3xl bg-white/90 p-5 shadow-sm ring-2 ring-sp-red/10 sm:p-6"
        >
          <SchoolLogo variant="navy" size="sm" className="mx-auto" />
          <h1 className="mt-4 text-center font-[family-name:var(--font-display)] text-2xl text-navy-950">
            Party organiser
          </h1>
          <p className="mt-2 text-center text-sm text-navy-800/70">
            Approve photos before they appear on the display stream.
          </p>
          <input
            type="password"
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

  const photos =
    overview?.photos.filter((p) =>
      filter === "ALL" ? true : p.status === filter,
    ) ?? [];

  return (
    <div className="page-shell bg-party-mesh mx-auto min-h-dvh max-w-3xl pb-8">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <SchoolLogo variant="navy" size="sm" className="shrink-0" />
          <div className="min-w-0">
            <h1 className="font-[family-name:var(--font-display)] text-2xl text-navy-950 sm:text-3xl">
              Photo approvals
            </h1>
            <p className="text-sm text-navy-800/70">Christmas party stream</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Link
            to="/display"
            className="inline-flex min-h-11 items-center rounded-xl bg-navy-900 px-3 text-sm font-semibold text-white"
          >
            Open display
          </Link>
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
            <Stat label="Pending" value={String(overview.counts.PENDING)} />
            <Stat label="Live" value={String(overview.counts.APPROVED)} />
            <Stat label="Denied" value={String(overview.counts.DENIED)} />
          </div>

          <div className="mb-4 grid grid-cols-4 gap-1.5 rounded-2xl bg-navy-900/8 p-1.5">
            {(
              [
                ["PENDING", "Queue"],
                ["APPROVED", "Live"],
                ["DENIED", "Denied"],
                ["ALL", "All"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`min-h-11 rounded-xl text-xs font-semibold sm:text-sm ${
                  filter === key
                    ? "bg-white text-navy-950 shadow-sm"
                    : "text-navy-800/65"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <section className="space-y-3">
            {photos.length === 0 ? (
              <p className="rounded-2xl bg-white/70 px-4 py-8 text-center text-navy-800/60">
                {filter === "PENDING"
                  ? "No photos waiting for approval."
                  : "Nothing in this list."}
              </p>
            ) : (
              photos.map((photo) => (
                <article
                  key={photo.id}
                  className="overflow-hidden rounded-2xl bg-white/90 ring-1 ring-navy-900/10"
                >
                  <img
                    src={photo.photoUrl}
                    alt={photo.staffName}
                    className={`aspect-[16/10] w-full object-cover ${
                      photo.status === "DENIED" ? "opacity-50" : ""
                    }`}
                  />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <PhotoTitle name={photo.staffName} />
                      <StatusBadge status={photo.status} />
                    </div>
                    {photo.caption ? (
                      <p className="mt-2 text-sm text-navy-800/75">
                        {photo.caption}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-navy-800/45">
                      {new Date(photo.createdAt).toLocaleString()}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {photo.status !== "APPROVED" ? (
                        <button
                          type="button"
                          disabled={busyId === photo.id}
                          onClick={() => setStatus(photo.id, "APPROVED")}
                          className="min-h-12 rounded-xl bg-emerald-700 text-base font-semibold text-white disabled:opacity-50"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busyId === photo.id}
                          onClick={() => setStatus(photo.id, "PENDING")}
                          className="min-h-12 rounded-xl bg-navy-900/8 text-base font-semibold text-navy-900 disabled:opacity-50"
                        >
                          Remove from stream
                        </button>
                      )}
                      {photo.status !== "DENIED" ? (
                        <button
                          type="button"
                          disabled={busyId === photo.id}
                          onClick={() => setStatus(photo.id, "DENIED")}
                          className="min-h-12 rounded-xl bg-sp-red/15 text-base font-semibold text-sp-red-dark disabled:opacity-50"
                        >
                          Deny
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busyId === photo.id}
                          onClick={() => setStatus(photo.id, "PENDING")}
                          className="min-h-12 rounded-xl bg-navy-900/8 text-base font-semibold text-navy-900 disabled:opacity-50"
                        >
                          Back to queue
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>
        </>
      ) : (
        <p className="text-navy-800/70">Loading…</p>
      )}
    </div>
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

function PhotoTitle({ name }: { name: string }) {
  return (
    <p className="text-lg font-semibold text-navy-950">{name}</p>
  );
}

function StatusBadge({ status }: { status: PartyPhotoStatus }) {
  const styles: Record<PartyPhotoStatus, string> = {
    PENDING: "bg-amber-100 text-amber-900",
    APPROVED: "bg-emerald-100 text-emerald-900",
    DENIED: "bg-red-100 text-red-900",
  };
  const labels: Record<PartyPhotoStatus, string> = {
    PENDING: "Pending",
    APPROVED: "On stream",
    DENIED: "Denied",
  };
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}