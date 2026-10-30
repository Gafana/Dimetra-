import { Spinner } from './Spinner.js';

export function PageLoader({ label = 'Загрузка…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-sage-400/90">
      <Spinner className="h-8 w-8" />
      <span>{label}</span>
    </div>
  );
}
