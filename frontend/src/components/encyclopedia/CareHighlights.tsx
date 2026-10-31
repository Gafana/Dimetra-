import type { PlantCatalogEntry } from '../../api/types.js';
import { lightLevelHint, lightLevelLabel } from '../../lib/lightLevel.js';
import { GlassPanel } from '../ui/GlassPanel.js';

export function CareHighlights({ plant }: { plant: PlantCatalogEntry }) {
  return (
    <div className="grid gap-3 sm:grid-cols-1">
      <GlassPanel className="border-sky-400/20 p-4">
        <h3 className="text-sm font-semibold text-sky-100">Полив</h3>
        <p className="mt-2 text-lg font-serif text-sage-100">
          Лето: каждые {plant.seasons.summer.wateringDays} дн.
          <span className="text-sage-400"> · </span>
          Зима: {plant.seasons.winter.wateringDays} дн.
        </p>
        {plant.wateringNotes ? (
          <p className="mt-2 text-xs leading-relaxed text-sage-300/90">{plant.wateringNotes}</p>
        ) : null}
      </GlassPanel>

      <GlassPanel className="border-emerald-400/20 p-4">
        <h3 className="text-sm font-semibold text-emerald-100">Подкормка</h3>
        {plant.feedingProduct ? (
          <p className="mt-2 text-sm font-medium text-sage-100">{plant.feedingProduct}</p>
        ) : (
          <p className="mt-2 text-sm text-sage-400/90">Укажите состав удобрения в паспорте</p>
        )}
        <p className="mt-2 text-lg font-serif text-sage-100">
          Лето: каждые {plant.seasons.summer.feedingDays} дн.
          <span className="text-sage-400"> · </span>
          Зима: {plant.seasons.winter.feedingDays} дн.
        </p>
        {plant.feedingNotes ? (
          <p className="mt-2 text-xs leading-relaxed text-sage-300/90">{plant.feedingNotes}</p>
        ) : null}
      </GlassPanel>

      <GlassPanel className="border-amber-400/20 p-4">
        <h3 className="text-sm font-semibold text-amber-100">Освещение</h3>
        <p className="mt-2 text-lg font-serif text-sage-100">{lightLevelLabel(plant.lightLevel)}</p>
        <p className="mt-2 text-xs leading-relaxed text-sage-300/90">
          {plant.lightNotes?.trim() || lightLevelHint(plant.lightLevel)}
        </p>
      </GlassPanel>
    </div>
  );
}
