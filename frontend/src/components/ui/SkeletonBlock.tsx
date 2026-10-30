export function SkeletonBlock({ className = 'h-24' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-[1.75rem] bg-white/5 ring-1 ring-white/5 ${className}`}
      aria-hidden
    />
  );
}
