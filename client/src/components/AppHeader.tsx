import { Link } from "react-router-dom";

type AppHeaderProps = {
  subtitle?: string;
  showContinue?: boolean;
};

export function AppHeader({ subtitle, showContinue }: AppHeaderProps) {
  return (
    <header className="animate-fade-up mb-6 text-center">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-teal-800/70">
        Staff morning · outdoor hunt
      </p>
      <h1 className="font-[family-name:var(--font-display)] text-[1.85rem] leading-tight text-teal-950 sm:text-4xl">
        The One Where We Had A Scavenger Hunt
      </h1>
      {subtitle ? (
        <p className="mx-auto mt-3 max-w-md text-sm text-teal-900/75 sm:text-base">
          {subtitle}
        </p>
      ) : null}
      {showContinue ? (
        <p className="mt-4">
          <Link
            to="/play"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-teal-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
          >
            Continue your hunt
          </Link>
        </p>
      ) : null}
    </header>
  );
}
