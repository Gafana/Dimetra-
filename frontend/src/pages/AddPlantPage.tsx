import { ArrowRight, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createPlant,
  createRoom,
  fetchCatalog,
  fetchRooms,
  type PlantCatalogEntry,
  type PlantSeason,
  type RoomWithPlants,
} from '../api/index.js';
import { GlassPanel } from '../components/ui/GlassPanel.js';
import { PageLoader } from '../components/ui/PageLoader.js';
import { SkeletonBlock } from '../components/ui/SkeletonBlock.js';
import { getApiErrorMessage } from '../lib/apiError.js';
import { showTelegramAlert } from '../lib/telegramUi.js';

export function AddPlantPage() {
  const navigate = useNavigate();

  const [catalog, setCatalog] = useState<PlantCatalogEntry[]>([]);
  const [rooms, setRooms] = useState<RoomWithPlants[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);

  const [catalogId, setCatalogId] = useState('');
  const [customName, setCustomName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [season, setSeason] = useState<PlantSeason>('summer');
  const [newRoomName, setNewRoomName] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [catalogData, roomsData] = await Promise.all([fetchCatalog(), fetchRooms()]);
        if (cancelled) return;
        setCatalog(catalogData);
        setRooms(roomsData);
        if (catalogData[0]) setCatalogId(catalogData[0].id);
        if (roomsData[0]) setRoomId(roomsData[0].id);
      } catch (error) {
        showTelegramAlert(getApiErrorMessage(error, 'Не удалось загрузить данные формы'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCatalogEntry = useMemo(
    () => catalog.find((entry) => entry.id === catalogId),
    [catalog, catalogId],
  );

  const handleCreateRoom = async () => {
    const name = newRoomName.trim();
    if (!name) {
      showTelegramAlert('Введите название комнаты');
      return;
    }

    setCreatingRoom(true);
    try {
      const room = await createRoom(name);
      setRooms((prev) => [...prev, { ...room, plants: [] }]);
      setRoomId(room.id);
      setNewRoomName('');
    } catch (error) {
      showTelegramAlert(getApiErrorMessage(error, 'Не удалось создать комнату'));
    } finally {
      setCreatingRoom(false);
    }
  };

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

  if (loading) {
    return (
      <section className="space-y-4">
        <SkeletonBlock className="h-32" />
        <SkeletonBlock className="h-40" />
        <PageLoader label="Загружаем каталог…" />
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl text-sage-100">Новое растение</h2>
        <p className="text-sm text-sage-400/90">Выберите вид и комнату для ухода</p>
      </div>

      <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-sage-200">Каталог</legend>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {catalog.map((entry) => {
              const active = entry.id === catalogId;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setCatalogId(entry.id)}
                  className={[
                    'min-w-[8.5rem] shrink-0 rounded-2xl border px-3 py-3 text-left text-sm transition-all',
                    active
                      ? 'chip-active border-sage-300/40 text-sage-100'
                      : 'glass border-transparent text-sage-300/90',
                  ].join(' ')}
                >
                  <span className="font-medium">{entry.name}</span>
                </button>
              );
            })}
          </div>
          {selectedCatalogEntry ? (
            <p className="text-xs text-sage-400/80">
              Лето: полив {selectedCatalogEntry.seasons.summer.wateringDays} дн. · зима:{' '}
              {selectedCatalogEntry.seasons.winter.wateringDays} дн.
            </p>
          ) : null}
        </fieldset>

        <GlassPanel className="space-y-4 p-4">
          <label className="block space-y-2 text-sm">
            <span className="font-medium text-sage-200">Имя растения</span>
            <input
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder="Монстера у окна"
              className="input-glass w-full rounded-2xl px-4 py-3"
            />
          </label>

          <label className="block space-y-2 text-sm">
            <span className="font-medium text-sage-200">Комната</span>
            <select
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
              className="input-glass w-full rounded-2xl px-4 py-3"
            >
              <option value="">Выберите комнату</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </label>
        </GlassPanel>

        <GlassPanel className="space-y-3 p-4">
          <p className="text-sm font-medium text-sage-200">Новая комната</p>
          <div className="flex gap-2">
            <input
              value={newRoomName}
              onChange={(event) => setNewRoomName(event.target.value)}
              placeholder="Кухня, спальня…"
              className="input-glass min-w-0 flex-1 rounded-2xl px-4 py-3 text-sm"
            />
            <button
              type="button"
              disabled={creatingRoom}
              onClick={() => void handleCreateRoom()}
              className="btn-primary inline-flex items-center gap-1 rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {creatingRoom ? '…' : ''}
            </button>
          </div>
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
                  season === value
                    ? 'btn-primary'
                    : 'glass text-sage-300/90',
                ].join(' ')}
              >
                {value === 'summer' ? 'Лето' : 'Зима'}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold disabled:opacity-60"
        >
          {submitting ? 'Сохраняем…' : 'Добавить растение'}
          {!submitting ? <ArrowRight className="h-4 w-4" /> : null}
        </button>
      </form>
    </section>
  );
}
