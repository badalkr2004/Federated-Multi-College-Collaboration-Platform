import Link from "next/link";

// Pure CSS only — zero framer-motion, zero JS animation loops.
function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 10 * position} -${189 + i * 12}C-${
      380 - i * 10 * position
    } -${189 + i * 12} -${312 - i * 10 * position} ${216 - i * 12} ${
      152 - i * 10 * position
    } ${343 - i * 12}C${616 - i * 10 * position} ${470 - i * 12} ${
      684 - i * 10 * position
    } ${875 - i * 12} ${684 - i * 10 * position} ${875 - i * 12}`,
    opacity: 0.04 + i * 0.02,
    width: 0.5 + i * 0.04,
  }));

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        animation: `bg-drift ${position > 0 ? "28s" : "36s"} ease-in-out infinite alternate`,
      }}
    >
      <svg
        className="h-full w-full text-slate-950 dark:text-white"
        viewBox="0 0 696 316"
        fill="none"
        aria-hidden="true"
      >
        {paths.map((path) => (
          <path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={path.opacity}
          />
        ))}
      </svg>
    </div>
  );
}

export function BackgroundPaths({
  title = "One Collab",
  eyebrow = "Federated college collaboration",
  subtitle = "Find skill-matched teammates, join cross-college projects, and build with students beyond your campus.",
  actionLabel = "Find Your Team",
}: {
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  actionLabel?: string;
}) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-white dark:bg-neutral-950">
      <div className="absolute inset-0" aria-hidden="true">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      <div
        className="relative z-10 mx-auto max-w-4xl px-4 text-center"
        style={{ animation: "hero-fade-in 0.8s ease both" }}
      >
        <p
          className="mb-5 text-sm font-semibold uppercase tracking-widest text-neutral-600 dark:text-neutral-400"
          style={{ animation: "hero-slide-up 0.6s 0.1s ease both" }}
        >
          {eyebrow}
        </p>

        <h1
          className="mb-8 text-5xl font-bold tracking-tight sm:text-7xl md:text-8xl bg-gradient-to-b from-neutral-900 to-neutral-600 bg-clip-text text-transparent dark:from-white dark:to-white/70"
          style={{ animation: "hero-slide-up 0.7s 0.2s ease both" }}
        >
          {title}
        </h1>

        <p
          className="mx-auto mb-10 max-w-2xl text-base leading-7 text-neutral-600 dark:text-neutral-400 sm:text-lg"
          style={{ animation: "hero-slide-up 0.7s 0.35s ease both" }}
        >
          {subtitle}
        </p>

        <div style={{ animation: "hero-slide-up 0.6s 0.5s ease both" }}>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-black px-7 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:bg-neutral-800 hover:shadow-xl dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            {actionLabel}
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
