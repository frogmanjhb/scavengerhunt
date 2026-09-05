import { Link } from "react-router-dom";
import { getStoredTeamId } from "../session";

export function DonePage() {
  const hasSession = Boolean(getStoredTeamId());

  return (
    <div className="bg-mesh mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-4 py-12 text-center">
      <p className="animate-fade-up text-xs font-semibold uppercase tracking-[0.22em] text-teal-800/70">
        Hunt complete
      </p>
      <h1 className="animate-fade-up mt-3 font-[family-name:var(--font-display)] text-4xl text-teal-950">
        You finished all 10!
      </h1>
      <p className="animate-fade-up mt-4 max-w-sm text-teal-900/75">
        Head back to the gathering point and watch your photos land on the live
        mosaic. Nice work.
      </p>
      <div className="animate-fade-up mt-8 flex w-full flex-col gap-3">
        <Link
          to="/display"
          className="flex min-h-12 items-center justify-center rounded-2xl bg-teal-900 font-semibold text-white hover:bg-teal-800"
        >
          Open mosaic display
        </Link>
        {hasSession ? (
          <Link
            to="/"
            className="flex min-h-12 items-center justify-center rounded-2xl bg-white/80 font-semibold text-teal-900 ring-1 ring-teal-900/10"
          >
            Back to home
          </Link>
        ) : null}
      </div>
    </div>
  );
}
