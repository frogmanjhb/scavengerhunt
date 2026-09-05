import { useEffect, useMemo, useRef, useState } from "react";
import { fetchRecentSubmissions, type MosaicSubmission } from "../api";
import { SchoolLogo } from "../components/SchoolLogo";

export function DisplayPage() {
  const [items, setItems] = useState<MosaicSubmission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const afterRef = useRef<string>("");
  const knownIds = useRef<Set<string>>(new Set());
  const pollCount = useRef(0);

  useEffect(() => {
    let cancelled = false;

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

  const title = useMemo(
    () => "The One Where We Had A Scavenger Hunt",
    [],
  );

  return (
    <div className="min-h-dvh bg-navy-950 text-white">
      <div className="relative overflow-hidden px-6 py-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(230,30,38,0.35),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(245,197,24,0.22),transparent_45%)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <SchoolLogo variant="white" size="sm" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sp-gold">
                Live mosaic
              </p>
              <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl sm:text-4xl">
                {title}
              </h1>
            </div>
          </div>
          <p className="text-sm text-white/60">{items.length} photos</p>
        </div>
        {error ? (
          <p className="relative mt-3 text-sm text-red-200">{error}</p>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="flex h-[70dvh] items-center justify-center px-6 text-center text-white/55">
          Waiting for the first photos…
        </div>
      ) : (
        <div className="columns-2 gap-3 px-3 pb-8 sm:columns-3 md:columns-4 lg:columns-5">
          {items.map((item, index) => (
            <figure
              key={item.id}
              className="animate-mosaic-in mb-3 break-inside-avoid overflow-hidden rounded-xl bg-navy-900/60 ring-1 ring-white/10"
              style={{ animationDelay: `${Math.min(index % 8, 7) * 40}ms` }}
            >
              <img
                src={item.photoUrl}
                alt={`${item.teamName}${item.caption ? `: ${item.caption}` : ""}`}
                className="block w-full object-cover"
                loading="lazy"
              />
              <figcaption className="space-y-0.5 px-3 py-2">
                <p className="text-sm font-medium text-sp-gold">{item.teamName}</p>
                {item.caption ? (
                  <p className="text-xs leading-snug text-white/70">{item.caption}</p>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
