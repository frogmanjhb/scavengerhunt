import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchAllApprovedPartyPhotos,
  fetchApprovedPartyStream,
  type PartyStreamPhoto,
} from "../api";
import { SchoolLogo } from "../components/SchoolLogo";

const FEATURE_MS = 7000;

export function DisplayPage() {
  const [items, setItems] = useState<PartyStreamPhoto[]>([]);
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

    async function reconcile() {
      const all = await fetchAllApprovedPartyPhotos();
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
        if (pollCount.current === 1 || pollCount.current % 8 === 0) {
          await reconcile();
        } else {
          const batch = await fetchApprovedPartyStream(
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
          setError(err instanceof Error ? err.message : "Display poll failed");
        }
      }
    }

    poll();
    const interval = setInterval(poll, 3500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

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
    const map = new Map<string, PartyStreamPhoto>();
    for (const item of items) map.set(item.id, item);
    return map;
  }, [items]);

  const featuredId = order.length > 0 ? order[cursor % order.length] : null;
  const featured = featuredId ? (byId.get(featuredId) ?? null) : null;

  useEffect(() => {
    if (!featuredId || !stripRef.current) return;
    const el = stripRef.current.querySelector<HTMLElement>(
      `[data-photo-id="${featuredId}"]`,
    );
    el?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [featuredId]);

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

  return (
    <div className="flex min-h-dvh flex-col bg-navy-950 text-white lg:h-dvh lg:overflow-hidden">
      <header className="relative shrink-0 overflow-hidden px-4 py-3 sm:px-6 sm:py-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(220,38,38,0.35),transparent_42%),radial-gradient(circle_at_85%_10%,rgba(34,197,94,0.2),transparent_45%),radial-gradient(circle_at_50%_100%,rgba(245,197,24,0.15),transparent_50%)]" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <SchoolLogo variant="white" size="sm" className="shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sp-gold sm:text-xs">
                Staff Christmas party
              </p>
              <h1 className="truncate font-[family-name:var(--font-display)] text-lg leading-tight sm:text-2xl lg:text-3xl">
                Live photo stream
              </h1>
            </div>
          </div>
          <p className="shrink-0 text-xs text-white/55 sm:text-sm">
            {items.length} approved
          </p>
        </div>
        {error ? (
          <p className="relative mt-2 text-sm text-red-200">{error}</p>
        ) : null}
      </header>

      {items.length === 0 ? (
        <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(245,197,24,0.12),transparent_55%)]" />
          <p className="relative text-5xl" aria-hidden>
            🎄
          </p>
          <p className="relative mt-4 max-w-md text-lg text-white/70">
            Waiting for the first approved photos…
          </p>
          <p className="relative mt-2 text-sm text-white/45">
            Staff upload from the party link · organisers approve in admin
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <section className="relative flex min-h-[50dvh] flex-col lg:min-h-0 lg:flex-1">
            {featured ? (
              <div
                key={`${featured.id}-${tick}`}
                className="relative flex min-h-0 flex-1 flex-col"
              >
                <div className="relative min-h-0 flex-1 bg-black">
                  <img
                    src={featured.photoUrl}
                    alt={featured.staffName}
                    className="animate-feature-in absolute inset-0 h-full w-full object-contain"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/95 via-navy-950/45 to-transparent px-4 pb-4 pt-20 sm:px-8 sm:pb-6">
                    <p className="font-[family-name:var(--font-display)] text-2xl text-sp-gold sm:text-4xl lg:text-5xl">
                      {featured.staffName}
                    </p>
                    {featured.caption ? (
                      <p className="mt-2 max-w-4xl text-base text-white/80 sm:text-xl">
                        {featured.caption}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="h-1.5 w-full bg-white/10">
                  <div
                    key={tick}
                    className="party-feature-progress h-full bg-sp-gold"
                  />
                </div>
              </div>
            ) : null}
          </section>

          <aside
            ref={stripRef}
            className="flex shrink-0 flex-col border-t border-white/10 lg:w-[min(22rem,26vw)] lg:border-l lg:border-t-0"
          >
            <p className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
              Up next
            </p>
            <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain px-3 pb-4">
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
                    className={`flex shrink-0 items-center gap-3 rounded-xl p-2 text-left ring-2 transition ${
                      active
                        ? "bg-white/10 ring-sp-gold"
                        : "ring-transparent hover:bg-white/5"
                    }`}
                  >
                    <img
                      src={item.photoUrl}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                      loading="lazy"
                    />
                    <StreamPreviewMeta
                      name={item.staffName}
                      caption={item.caption}
                      index={index}
                      total={order.length}
                    />
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

function StreamPreviewMeta({
  name,
  caption,
  index,
  total,
}: {
  name: string;
  caption: string | null;
  index: number;
  total: number;
}) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate font-semibold text-sp-gold">{name}</p>
      {caption ? (
        <p className="line-clamp-2 text-xs text-white/60">{caption}</p>
      ) : null}
      <p className="mt-1 text-[10px] text-white/35">
        {index + 1} / {total}
      </p>
    </div>
  );
}