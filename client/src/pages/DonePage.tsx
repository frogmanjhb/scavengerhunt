import { Link } from "react-router-dom";
import { getStoredTeamId } from "../session";
import { SchoolLogo } from "../components/SchoolLogo";

export function DonePage() {
  const hasSession = Boolean(getStoredTeamId());

  return (
    <div className="bg-mesh mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-4 py-12 text-center">
      <SchoolLogo variant="navy" size="md" className="animate-fade-up" />
      <p className="animate-fade-up mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-sp-red">
        Hunt complete
      </p>
      <h1 className="animate-fade-up mt-3 font-[family-name:var(--font-display)] text-4xl text-navy-950">
        You finished all 10!
      </h1>
      <p className="animate-fade-up mt-4 max-w-sm text-navy-800/75">
        Head back to the gathering point and watch your photos land on the live
        mosaic. Nice work.
      </p>
      <div className="animate-fade-up mt-8 flex w-full flex-col gap-3">
        <Link
          to="/display"
          className="flex min-h-12 items-center justify-center rounded-2xl bg-sp-red font-semibold text-white hover:bg-sp-red-dark"
        >
          Open mosaic display
        </Link>
        {hasSession ? (
          <Link
            to="/"
            className="flex min-h-12 items-center justify-center rounded-2xl bg-white/85 font-semibold text-navy-900 ring-1 ring-navy-900/10"
          >
            Back to home
          </Link>
        ) : null}
      </div>
    </div>
  );
}
