type SchoolLogoProps = {
  variant?: "navy" | "white";
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClass = {
  sm: "h-14 w-auto sm:h-16",
  md: "h-20 w-auto sm:h-24",
  lg: "h-28 w-auto sm:h-36",
};

export function SchoolLogo({
  variant = "navy",
  className = "",
  size = "md",
}: SchoolLogoProps) {
  const src =
    variant === "white" ? "/logos/white.png" : "/logos/navy.png";

  return (
    <img
      src={src}
      alt="St Peter's Prep Schools"
      className={`${sizeClass[size]} object-contain ${className}`}
      decoding="async"
    />
  );
}
