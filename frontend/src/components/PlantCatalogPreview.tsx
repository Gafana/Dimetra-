import type { PlantCatalogEntry } from '../api/types.js';
import { GlassPanel } from './ui/GlassPanel.js';

export function PlantCatalogPreview({ entry }: { entry: PlantCatalogEntry }) {
  const e = entry.encyclopedia;

  return (
    <GlassPanel className="space-y-3 p-4">
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

      {e ? (
        <dl className="grid gap-2 text-xs text-sage-300/90">
          {e.light ? (
            <div>
              <dt className="font-medium text-sage-200">Свет</dt>
              <dd className="mt-0.5 leading-snug">{e.light}</dd>
            </div>
          ) : null}
          {e.watering ? (
            <div>
              <dt className="font-medium text-sage-200">Полив</dt>
              <dd className="mt-0.5 leading-snug line-clamp-4">{e.watering}</dd>
            </div>
          ) : null}
          {e.feeding ? (
            <div>
              <dt className="font-medium text-sage-200">Подкормка</dt>
              <dd className="mt-0.5 leading-snug line-clamp-3">{e.feeding}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {entry.sourceUrl ? (
        <a
          href={entry.sourceUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-block text-[11px] text-sage-400 underline decoration-sage-500/40"
        >
          Источник: FloralWorld
        </a>
      ) : null}
    </GlassPanel>
  );
}
