import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchPlantCareHistory, type CareHistoryEntry } from '../api/index.js';
import { careActionLabel } from '../lib/careLabels.js';
import { formatDateTime } from '../lib/dates.js';
import { getApiErrorMessage } from '../lib/apiError.js';
import { GlassPanel } from './ui/GlassPanel.js';
import { Spinner } from './ui/Spinner.js';

export function PlantCareHistoryModal({
  plantId,
  plantName,
  onClose,
}: {
  plantId: string;
  plantName: string;
  onClose: () => void;
}) {
  const [items, setItems] = useState<CareHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPlantCareHistory(plantId);
        if (!cancelled) setItems(data);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Не удалось загрузить историю'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [plantId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 pb-28 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plant-history-title"
      onClick={onClose}
    >
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
      <GlassPanel
        strong
        className="max-h-[min(70vh,28rem)] overflow-hidden p-0"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="min-w-0 pr-2">
            <h3 id="plant-history-title" className="truncate font-serif text-lg text-sage-100">
              История ухода
            </h3>
            <p className="truncate text-xs text-sage-400/90">{plantName}</p>
          </div>
          <button
            type="button"
            aria-label="Закрыть"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sage-300 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[min(55vh,22rem)] overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-6 w-6" />
            </div>
          ) : error ? (
            <p className="py-4 text-sm text-red-200/90">{error}</p>
          ) : items.length === 0 ? (
            <p className="py-4 text-sm text-sage-400/90">Пока нет записей — отметьте полив или подкормку.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5 text-sm"
                >
                  <span className="font-medium text-sage-100">{careActionLabel(entry.action_type)}</span>
                  <time className="shrink-0 text-xs text-sage-400/90">{formatDateTime(entry.done_at)}</time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </GlassPanel>
      </div>
    </div>
  );
}
