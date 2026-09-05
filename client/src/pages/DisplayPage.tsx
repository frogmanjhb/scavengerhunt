import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchLeaderboard,
  fetchRecentSubmissions,
  type LeaderboardEntry,
  type MosaicSubmission,
} from "../api";
import { Leaderboard } from "../components/Leaderboard";
import { SchoolLogo } from "../components/SchoolLogo";

const FEATURE_MS = 6500;

export function DisplayPage() {
  const [items, setItems] = useState<MosaicSubmission[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const [tick, setTick] = useState(0);
  const afterRef = useRef<string>("");
  const knownIds = useRef<Set<string>>(new Set());
  const pollCount = useRef(0);
  const cursorRef = useRef(0);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  useEffect(() => {
    let cancelled = false;

    async function pollLeaderboard() {
      try {
        const data = await fetchLeaderboard();
        if (!cancelled) setLeaderboard(data.entries);
      } catch {
        // Keep last good leaderboard; mosaic errors surface separately.
      }
    }

    async function reconcileHidden() {
      const all = await fetchRecentSubmissions();
      if (cancelled) return;
      const visibleIds = new Set(all.map((item) => item.id));
      knownIds.current = visibleIds;
      setItems((prev) => {
        const kept = prev.filter((item) => visibleIds.has(item.id));
        const existing = new Set(kept.map((item) => item.id));
        const added = all.filter((item) => !existing.has(item.id));
        return [...kept, ...added].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      });
      if (all.length > 0) {
        afterRef.current = all[all.length - 1].createdAt;
      }
    }

    async function poll() {
      try {
        pollCount.current += 1;
        await pollLeaderboard();
        if (pollCount.current === 1 || pollCount.current % 8 === 0) {
          await reconcileHidden();
        } else {
          const batch = await fetchRecentSubmissions(
            afterRef.current || undefined,
          );
          if (cancelled) return;

          if (batch.length > 0) {
            const fresh = batch.filter((item) => !knownIds.current.has(item.id));
            for (const item of fresh) knownIds.current.add(item.id);
            if (fresh.length > 0) {
              setItems((prev) => [...prev, ...fresh]);
            }
            afterRef.current = batch[batch.length - 1].createdAt;
          }
        }
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Mosaic poll failed");
        }
      }
    }

    poll();
    const interval = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Fair rotation: round-robin all photos; newcomers get the next spotlight.
  useEffect(() => {
    const ids = items.map((item) => item.id);
    setOrder((prev) => {
      if (ids.length === 0) return [];
      if (prev.length === 0) return ids;

      const idSet = new Set(ids);
      const kept = prev.filter((id) => idSet.has(id));
      const known = new Set(kept);
      const newcomers = ids.filter((id) => !known.has(id));

      if (kept.length === 0) return ids;
      if (newcomers.length === 0) return kept;

      const insertAt = Math.min(cursorRef.current + 1, kept.length);
      return [
        ...kept.slice(0, insertAt),
        ...newcomers,
        ...kept.slice(insertAt),
      ];
    });
    setCursor((c) => (ids.length === 0 ? 0 : Math.min(c, ids.length - 1)));
  }, [items]);

  useEffect(() => {
    if (order.length === 0) return;
    const interval = setInterval(() => {
      setCursor((c) => (c + 1) % order.length);
      setTick((t) => t + 1);
    }, FEATURE_MS);
    return () => clearInterval(interval);
  }, [order.length]);

  const byId = useMemo(() => {
    const map = new Map<string, MosaicSubmission>();
    for (const item of items) map.set(item.id, item);
    return map;
  }, [items]);

  const featuredId = order.length > 0 ? order[cursor % order.length] : null;
  const featured = featuredId ? byId.get(featuredId) ?? null : null;

  useEffect(() => {
    if (!featuredId || !stripRef.current) return;
    const el = stripRef.current.querySelector<HTMLElement>(
      `[data-photo-id="${featuredId}"]`,
    );
    el?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [featuredId]);

  // Preload the next couple of images for smoother projector cycling.
  useEffect(() => {
    if (order.length < 2) return;
    for (let i = 1; i <= 2; i += 1) {
      const nextId = order[(cursor + i) % order.length];
      const next = byId.get(nextId);
      if (!next) continue;
      const img = new Image();
      img.src = next.photoUrl;
    }
  }, [cursor, order, byId]);

  function showPhoto(id: string) {
    const index = order.indexOf(id);
    if (index < 0) return;
    setCursor(index);
    setTick((t) => t + 1);
  }

  const board = (
    <Leaderboard
      entries={leaderboard}
      variant="display"
      className="h-full w-full"
    />
  );

  return (
    <div className="flex min-h-dvh flex-col bg-navy-950 text-white lg:h-dvh lg:overflow-hidden">
      <header className="relative shrink-0 overflow-hidden px-4 py-3 sm:px-6 sm:py-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(230,30,38,0.35),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(245,197,24,0.22),transparent_45%)]" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <SchoolLogo variant="white" size="sm" className="shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sp-gold sm:text-xs">
                Live mosaic
              </p>
              <h1 className="truncate font-[family-name:var(--font-display)] text-lg leading-tight sm:text-2xl lg:text-3xl">
                The One Where We Had A Scavenger Hunt
              </h1>
            </div>
          </div>
          <p className="shrink-0 text-xs text-white/55 sm:text-sm">
            {items.length} photos
          </p>
        </div>
        {error ? (
          <p className="relative mt-2 text-sm text-red-200">{error}</p>
        ) : null}
      </header>

      {items.length === 0 ? (
        <div className="relative flex flex-1 items-center justify-center px-4 py-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(245,197,24,0.12),transparent_55%)]" />
          <div className="relative w-full max-w-md">
            {leaderboard.length === 0 ? (
              <p className="mb-4 text-center text-white/55">
                Waiting for the first photos…
              </p>
            ) : null}
            {board}
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <section className="relative flex min-h-[42dvh] flex-col lg:min-h-0 lg:flex-1">
            {featured ? (
              <div
                key={`${featured.id}-${tick}`}
                className="relative flex min-h-0 flex-1 flex-col"
              >
                <div className="relative min-h-0 flex-1 bg-black">
                  <img
                    src={featured.photoUrl}
                    alt={featured.teamName}
                    className="animate-feature-in absolute inset-0 h-full w-full object-contain"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/90 via-navy-950/40 to-transparent px-4 pb-4 pt-16 sm:px-6 sm:pb-5">
                    <p className="font-[family-name:var(--font-display)] text-2xl text-sp-gold sm:text-3xl lg:text-4xl">
                      {featured.teamName}
                    </p>
                    {featured.caption ? (
                      <p className="mt-1 max-w-3xl text-sm text-white/75 sm:text-base">
                        {featured.caption}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-white/45">
                      Spotlight {(cursor % order.length) + 1} of {order.length}
                    </p>
                  </div>
                </div>
                <div className="h-1 w-full bg-white/10">
                  <div
                    key={tick}
                    className="feature-progress h-full bg-sp-gold"
                  />
                </div>
              </div>
            ) : null}
          </section>

          {/* Center leaderboard — between spotlight and photo grid */}
          <div className="relative z-10 flex shrink-0 items-stretch justify-center border-y border-white/10 bg-navy-950/40 px-3 py-3 lg:w-[min(22rem,30vw)] lg:border-x lg:border-y-0 lg:px-4 lg:py-4">
            <div className="flex w-full max-w-md flex-col lg:max-w-none">
              {board}
            </div>
          </div>

          <aside className="flex shrink-0 flex-col border-t border-white/10 lg:w-[min(20rem,28vw)] lg:border-l lg:border-t-0">
            <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 sm:px-3">
              All photos · tap to spotlight
            </p>

            <div
              ref={stripRef}
              className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden"
            >
              {order.map((id) => {
                const item = byId.get(id);
                if (!item) return null;
                const active = id === featuredId;
                return (
                  <button
                    key={id}
                    type="button"
                    data-photo-id={id}
                    onClick={() => showPhoto(id)}
                    className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl ring-2 transition ${
                      active
                        ? "ring-sp-gold"
                        : "ring-white/15 opacity-80 active:opacity-100"
                    }`}
                  >
                    <img
                      src={item.photoUrl}
                      alt={item.teamName}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </button>
                );
              })}
            </div>

            <div className="hidden min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 lg:block">
              <div className="grid grid-cols-2 gap-2">
                {order.map((id, index) => {
                  const item = byId.get(id);
                  if (!item) return null;
                  const active = id === featuredId;
                  return (
                    <button
                      key={id}
                      type="button"
                      data-photo-id={id}
                      onClick={() => showPhoto(id)}
                      className={`animate-mosaic-in overflow-hidden rounded-xl text-left ring-2 transition ${
                        active
                          ? "ring-sp-gold"
                          : "ring-white/10 hover:ring-white/30"
                      }`}
                      style={{
                        animationDelay: `${Math.min(index % 10, 9) * 30}ms`,
                      }}
                    >
                      <img
                        src={item.photoUrl}
                        alt={item.teamName}
                        className="aspect-square w-full object-cover"
                        loading="lazy"
                      />
                      <p className="truncate bg-navy-900/80 px-2 py-1.5 text-xs text-sp-gold">
                        {item.teamName}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 px-4 pb-4 lg:hidden">
              {order.map((id, index) => {
                const item = byId.get(id);
                if (!item) return null;
                const active = id === featuredId;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => showPhoto(id)}
                    className={`animate-mosaic-in overflow-hidden rounded-xl text-left ring-2 ${
                      active ? "ring-sp-gold" : "ring-white/10"
                    }`}
                    style={{
                      animationDelay: `${Math.min(index % 8, 7) * 30}ms`,
                    }}
                  >
                    <img
                      src={item.photoUrl}
                      alt={item.teamName}
                      className="aspect-[4/3] w-full object-cover"
                      loading="lazy"
                    />
                    <p className="truncate bg-navy-900/80 px-2 py-1.5 text-xs text-sp-gold">
                      {item.teamName}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
