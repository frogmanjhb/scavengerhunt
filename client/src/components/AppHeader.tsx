import { Link } from "react-router-dom";
import { SchoolLogo } from "./SchoolLogo";

type AppHeaderProps = {
  subtitle?: string;
  showContinue?: boolean;
  compact?: boolean;
};

export function AppHeader({ subtitle, showContinue, compact }: AppHeaderProps) {
  return (
    <header className="animate-fade-up mb-5 text-center">
      <SchoolLogo
        variant="navy"
        size={compact ? "sm" : "md"}
        className="mx-auto drop-shadow-sm"
      />
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-navy-700/70 sm:text-xs">
        Staff morning · outdoor hunt
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-[1.65rem] leading-tight text-navy-950 sm:text-4xl">
        The One Where We Had A Scavenger Hunt
      </h1>
      {subtitle ? (
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-navy-800/75 sm:text-base">
          {subtitle}
        </p>
      ) : null}
      {showContinue ? (
        <p className="mt-4">
          <Link
            to="/play"
            className="inline-flex min-h-14 w-full max-w-sm items-center justify-center rounded-2xl bg-sp-red px-5 text-base font-semibold text-white shadow-sm transition active:bg-sp-red-dark sm:w-auto"
          >
            Continue your hunt
          </Link>
        </p>
      ) : null}
    </header>
  );
}
