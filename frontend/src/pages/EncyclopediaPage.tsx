import { BookOpen, Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchEncyclopedia, type PlantCatalogEntry } from '../api/index.js';
import { GlassPanel } from '../components/ui/GlassPanel.js';
import { SkeletonBlock } from '../components/ui/SkeletonBlock.js';
import { lightLevelLabel } from '../lib/lightLevel.js';
import { getApiErrorMessage } from '../lib/apiError.js';
import { showTelegramAlert } from '../lib/telegramUi.js';

export function EncyclopediaPage() {
  const [query, setQuery] = useState('');
  const [plants, setPlants] = useState<PlantCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPlants(await fetchEncyclopedia(query));
    } catch (error) {
      showTelegramAlert(getApiErrorMessage(error, 'Не удалось загрузить энциклопедию'));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), query ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [load, query]);

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl text-sage-100">Энциклопедия</h2>
          <p className="text-sm text-sage-400/90">Паспорта всех видов в базе</p>
        </div>
        <Link
          to="/encyclopedia/new"
          className="btn-primary inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" />
          Добавить
        </Link>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sage-400/70" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск…"
          className="input-glass w-full rounded-full py-3 pl-10 pr-4 text-sm"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-24" />
        </div>
      ) : plants.length === 0 ? (
        <GlassPanel className="flex flex-col items-center gap-3 p-8 text-center text-sm text-sage-300/90">
          <BookOpen className="h-10 w-10 text-sage-400/50" />
          Ничего не найдено
        </GlassPanel>
      ) : (
        <ul className="space-y-2">
          {plants.map((plant) => (
            <li key={plant.id}>
              <Link
                to={`/encyclopedia/${plant.id}`}
                className="glass flex gap-3 rounded-2xl p-3 transition-colors hover:bg-white/[0.06]"
              >
                <img
                  src={plant.imageUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-xl object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sage-100">{plant.name}</p>
                  {plant.nameLatin ? (
                    <p className="truncate text-xs italic text-sage-400/90">{plant.nameLatin}</p>
                  ) : null}
                  <p className="mt-1 text-[10px] text-sage-400/80">
                    Полив {plant.seasons.summer.wateringDays}/{plant.seasons.winter.wateringDays} дн. ·{' '}
                    {lightLevelLabel(plant.lightLevel)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
