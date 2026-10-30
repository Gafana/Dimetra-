interface SpinnerProps {
  className?: string;
}

export function Spinner({ className = 'h-5 w-5' }: SpinnerProps) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-sage-400/30 border-t-sage-200 ${className}`}
      aria-hidden
    />
  );
}
