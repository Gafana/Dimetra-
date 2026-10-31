import { ArrowRight, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  createPlant,
  fetchEncyclopediaPlant,
  fetchRooms,
  type PlantCatalogEntry,
  type PlantCatalogPickerEntry,
  type PlantSeason,
  type RoomWithPlants,
} from '../api/index.js';
import { PlantCatalogPreview } from '../components/PlantCatalogPreview.js';
import { GlassPanel } from '../components/ui/GlassPanel.js';
import { SkeletonBlock } from '../components/ui/SkeletonBlock.js';
import { getApiErrorMessage } from '../lib/apiError.js';
import { loadCatalogPicker } from '../lib/catalogPickerCache.js';
import { showTelegramAlert } from '../lib/telegramUi.js';

const PICKER_LIMIT_EMPTY = 36;
const PICKER_LIMIT_SEARCH = 60;

function filterPicker(items: PlantCatalogPickerEntry[], query: string): PlantCatalogPickerEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return items.slice(0, PICKER_LIMIT_EMPTY);
  }
  return items
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.nameLatin?.toLowerCase().includes(q) ?? false) ||
        p.id.includes(q),
    )
    .slice(0, PICKER_LIMIT_SEARCH);
}

export function AddPlantPage() {
  const navigate = useNavigate();

  const [pickerItems, setPickerItems] = useState<PlantCatalogPickerEntry[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [rooms, setRooms] = useState<RoomWithPlants[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [catalogId, setCatalogId] = useState('');
  const [customName, setCustomName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [season, setSeason] = useState<PlantSeason>('summer');
  const [catalogQuery, setCatalogQuery] = useState('');

  const [preview, setPreview] = useState<PlantCatalogEntry | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setCatalogLoading(true);
      try {
        const items = await loadCatalogPicker();
        if (cancelled) return;
        setPickerItems(items);
        if (items[0]) {
          setCatalogId((prev) => (prev && items.some((e) => e.id === prev) ? prev : items[0]!.id));
        }
      } catch (error) {
        showTelegramAlert(getApiErrorMessage(error, 'Не удалось загрузить каталог'));
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadRooms() {
      setRoomsLoading(true);
      try {
        const roomsData = await fetchRooms();
        if (!cancelled) {
          setRooms(roomsData);
          if (roomsData[0]) setRoomId(roomsData[0].id);
        }
      } catch (error) {
        showTelegramAlert(getApiErrorMessage(error, 'Не удалось загрузить комнаты'));
      } finally {
        if (!cancelled) setRoomsLoading(false);
      }
    }

    void loadRooms();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!catalogId) {
      setPreview(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        setPreviewLoading(true);
        try {
          const detail = await fetchEncyclopediaPlant(catalogId);
          if (!cancelled) setPreview(detail);
        } catch {
          if (!cancelled) setPreview(null);
        } finally {
          if (!cancelled) setPreviewLoading(false);
        }
      })();
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [catalogId]);

  useEffect(() => {
    if (!catalogId) return;
    const entry = pickerItems.find((item) => item.id === catalogId);
    if (entry) {
      setCustomName(entry.name);
    }
  }, [catalogId, pickerItems]);

  const queryActive = catalogQuery.trim().length > 0;

  const matchCount = useMemo(() => {
    if (!queryActive) {
      return 0;
    }
    const q = catalogQuery.trim().toLowerCase();
    return pickerItems.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.nameLatin?.toLowerCase().includes(q) ?? false) ||
        p.id.includes(q),
    ).length;
  }, [pickerItems, catalogQuery, queryActive]);

  const visiblePicker = useMemo(
    () => filterPicker(pickerItems, catalogQuery),
    [pickerItems, catalogQuery],
  );

  const totalCount = pickerItems.length;
  const hiddenByLimit = Math.max(0, matchCount - visiblePicker.length);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!catalogId) {
      showTelegramAlert('Выберите тип растения');
      return;
    }
    if (!customName.trim()) {
      showTelegramAlert('Введите имя растения');
      return;
    }
    if (!roomId) {
      showTelegramAlert('Выберите или создайте комнату');
      return;
    }

    setSubmitting(true);
    try {
      await createPlant({
        custom_name: customName.trim(),
        catalog_id: catalogId,
        room_id: roomId,
        current_season: season,
      });
      navigate('/');
    } catch (error) {
      showTelegramAlert(getApiErrorMessage(error, 'Не удалось добавить растение'));
    } finally {
      setSubmitting(false);
    }
  };

  const formDisabled = catalogLoading || roomsLoading;

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl text-sage-100">Новое растение</h2>
        <p className="text-sm text-sage-400/90">Выберите вид и комнату для ухода</p>
      </div>

      <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
        <fieldset className="space-y-3" disabled={formDisabled}>
          <legend className="text-sm font-medium text-sage-200">Каталог</legend>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sage-400/70" />
            <input
              value={catalogQuery}
              onChange={(e) => setCatalogQuery(e.target.value)}
              placeholder="Поиск по названию или латинскому имени…"
              className="input-glass w-full rounded-2xl py-3 pl-10 pr-4 text-sm"
            />
          </div>
          {catalogLoading ? (
            <SkeletonBlock className="h-28" />
          ) : (
            <>
              <p className="text-[11px] text-sage-500/90">
                {queryActive
                  ? `Найдено в списке: ${visiblePicker.length}${hiddenByLimit > 0 ? ` (ещё ${hiddenByLimit} — уточните запрос)` : ''}`
                  : `Всего ${totalCount} видов · показаны первые ${visiblePicker.length} — используйте поиск`}
              </p>
              <div className="-mx-1 flex max-h-40 flex-wrap gap-2 overflow-auto px-1 pb-1">
                {visiblePicker.map((entry) => {
                  const active = entry.id === catalogId;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setCatalogId(entry.id)}
                      className={[
                        'min-w-[8rem] shrink-0 rounded-2xl border px-3 py-2.5 text-left text-sm transition-all',
                        active
                          ? 'chip-active border-sage-300/40 text-sage-100'
                          : 'glass border-transparent text-sage-300/90',
                      ].join(' ')}
                    >
                      <span className="font-medium">{entry.name}</span>
                      {entry.nameLatin ? (
                        <span className="mt-0.5 block truncate text-[10px] italic text-sage-400/80">
                          {entry.nameLatin}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          {previewLoading ? <SkeletonBlock className="h-32" /> : null}
          {preview && !previewLoading ? <PlantCatalogPreview entry={preview} /> : null}
        </fieldset>

        <GlassPanel className="space-y-4 p-4">
          <label className="block space-y-2 text-sm">
            <span className="font-medium text-sage-200">Имя растения</span>
            <input
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder="Монстера у окна"
              className="input-glass w-full rounded-2xl px-4 py-3"
              disabled={formDisabled}
            />
          </label>

          <label className="block space-y-2 text-sm">
            <span className="font-medium text-sage-200">Комната</span>
            <select
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
              className="input-glass w-full rounded-2xl px-4 py-3"
              disabled={formDisabled}
            >
              <option value="">Выберите комнату</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </label>
          {rooms.length === 0 && !roomsLoading ? (
            <p className="text-xs text-sage-400/90">
              Сначала добавьте комнату в{' '}
              <Link to="/settings" state={{ section: 'rooms' }} className="text-sage-200 underline">
                настройках
              </Link>
              .
            </p>
          ) : null}
        </GlassPanel>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-sage-200">Сезон</legend>
          <div className="flex gap-2">
            {(['summer', 'winter'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSeason(value)}
                className={[
                  'flex-1 rounded-2xl py-3 text-sm font-medium transition-all',
                  season === value ? 'btn-primary' : 'glass text-sage-300/90',
                ].join(' ')}
              >
                {value === 'summer' ? 'Лето' : 'Зима'}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={submitting || formDisabled}
          className="btn-primary flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold disabled:opacity-60"
        >
          {submitting ? 'Сохраняем…' : 'Добавить растение'}
          {!submitting ? <ArrowRight className="h-4 w-4" /> : null}
        </button>
      </form>
    </section>
  );
}
