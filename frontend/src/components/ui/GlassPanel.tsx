import type { ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  strong?: boolean;
}

export function GlassPanel({ children, className = '', strong = false }: GlassPanelProps) {
  return (
    <div
      className={[
        strong ? 'glass-strong' : 'glass',
        'rounded-[1.75rem]',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}
