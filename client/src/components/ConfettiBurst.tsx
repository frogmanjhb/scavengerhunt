import { useMemo, type CSSProperties } from "react";

const COLORS = ["#e61e26", "#f5c518", "#ffe066", "#122547", "#ffffff"];
const SHAPES = ["circle", "square", "rect", "dot"] as const;

type Piece = {
  id: number;
  color: string;
  shape: (typeof SHAPES)[number];
  left: number;
  delay: number;
  duration: number;
  drift: number;
  spin: number;
  size: number;
};

type ConfettiBurstProps = {
  /** Remount / change to replay the burst */
  burstKey?: string | number;
};

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    color: COLORS[id % COLORS.length],
    shape: SHAPES[id % SHAPES.length],
    left: 8 + Math.random() * 84,
    delay: Math.random() * 0.18,
    duration: 1.35 + Math.random() * 0.9,
    drift: (Math.random() - 0.5) * 160,
    spin: (Math.random() > 0.5 ? 1 : -1) * (280 + Math.random() * 520),
    size: 6 + Math.random() * 8,
  }));
}

export function ConfettiBurst({ burstKey = 0 }: ConfettiBurstProps) {
  const pieces = useMemo(() => makePieces(48), [burstKey]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {pieces.map((piece) => {
        const style = {
          left: `${piece.left}%`,
          top: "42%",
          width: piece.shape === "rect" ? piece.size * 0.55 : piece.size,
          height: piece.shape === "rect" ? piece.size * 1.35 : piece.size,
          backgroundColor: piece.color,
          animationDelay: `${piece.delay}s`,
          animationDuration: `${piece.duration}s`,
          "--confetti-drift": `${piece.drift}px`,
          "--confetti-spin": `${piece.spin}deg`,
        } as CSSProperties;

        return (
          <span
            key={`${burstKey}-${piece.id}`}
            className={`confetti-piece confetti-${piece.shape}`}
            style={style}
          />
        );
      })}
    </div>
  );
}
