import type { PlantCatalogEntry } from '../api/types.js';
import { GlassPanel } from './ui/GlassPanel.js';

/** Компактная карточка вида для экрана «Добавить» (без блоков энциклопедии). */
export function PlantCatalogPreview({ entry }: { entry: PlantCatalogEntry }) {
  return (
    <GlassPanel className="p-4">
      <div className="flex gap-3">
        {entry.imageUrl ? (
          <img
            src={entry.imageUrl}
            alt=""
            className="h-20 w-20 shrink-0 rounded-xl object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : null}
        <div className="min-w-0">
          <p className="font-medium text-sage-100">{entry.name}</p>
          {entry.nameLatin ? <p className="text-xs italic text-sage-400/90">{entry.nameLatin}</p> : null}
          <p className="mt-1 text-[11px] text-sage-400/80">
            Полив: лето {entry.seasons.summer.wateringDays} дн. · зима {entry.seasons.winter.wateringDays}{' '}
            дн.
          </p>
        </div>
      </div>
    </GlassPanel>
  );
}
