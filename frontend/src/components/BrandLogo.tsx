import { Leaf } from 'lucide-react';

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${compact ? '' : 'flex-col text-center'}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sage-400/20 ring-1 ring-white/15">
        <Leaf className="h-5 w-5 text-sage-300" strokeWidth={1.75} />
      </div>
      {!compact ? (
        <div>
          <p className="font-serif text-2xl tracking-wide text-sage-100">Dimetra</p>
          <p className="text-xs text-sage-400/90">Bring Nature Home</p>
        </div>
      ) : (
        <p className="font-serif text-xl tracking-wide text-sage-100">Dimetra</p>
      )}
    </div>
  );
}
