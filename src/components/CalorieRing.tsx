interface CalorieRingProps {
  consumed: number;
  target: number;
  size?: number;
  loading?: boolean;
}

export function CalorieRing({ consumed, target, size = 200, loading = false }: CalorieRingProps) {
  const percentage = Math.min((consumed / target) * 100, 100);
  const remaining = Math.max(target - consumed, 0);
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = loading
    ? circumference
    : circumference - (percentage / 100) * circumference;

  const color =
    loading
      ? "hsl(var(--muted))"
      : percentage >= 100
      ? "hsl(var(--calorie-red))"
      : percentage >= 80
      ? "hsl(var(--calorie-amber))"
      : "hsl(var(--calorie-green))";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="transform -rotate-90" style={{ width: size, height: size }}>
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="hsl(var(--calorie-bg))"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        {loading ? (
          <div className="flex flex-col items-center gap-2 animate-pulse">
            <div className="h-8 w-16 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
        ) : (
          <>
            <span className="text-3xl font-display font-bold text-foreground">{remaining}</span>
            <span className="text-xs text-muted-foreground">kcal restantes</span>
          </>
        )}
      </div>
    </div>
  );
}
