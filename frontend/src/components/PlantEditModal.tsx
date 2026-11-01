import { Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  deletePlant,
  fetchRooms,
  updatePlant,
  type PlantSeason,
  type RoomWithPlants,
  type UserPlant,
} from '../api/index.js';
import { getApiErrorMessage } from '../lib/apiError.js';
import { showTelegramAlert } from '../lib/telegramUi.js';
import { Spinner } from './ui/Spinner.js';

export function PlantEditModal({
  plant,
  onClose,
  onSaved,
  onDeleted,
}: {
  plant: UserPlant;
  onClose: () => void;
  onSaved: (plant: UserPlant) => void;
  onDeleted: (plantId: string) => void;
}) {
  const [rooms, setRooms] = useState<RoomWithPlants[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [customName, setCustomName] = useState(plant.custom_name);
  const [roomId, setRoomId] = useState(plant.room_id ?? '');
  const [season, setSeason] = useState<PlantSeason>(plant.current_season);
  const [nextWatering, setNextWatering] = useState(plant.next_watering_date ?? '');
  const [nextFeeding, setNextFeeding] = useState(plant.next_feeding_date ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setRoomsLoading(true);
      try {
        const data = await fetchRooms();
        if (!cancelled) setRooms(data);
      } catch (error) {
        showTelegramAlert(getApiErrorMessage(error, 'Не удалось загрузить комнаты'));
      } finally {
        if (!cancelled) setRoomsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const name = customName.trim();
    if (!name) {
      showTelegramAlert('Введите имя растения');
      return;
    }

    setSaving(true);
    try {
      const updated = await updatePlant(plant.id, {
        custom_name: name,
        room_id: roomId || null,
        current_season: season,
        next_watering_date: nextWatering || null,
        next_feeding_date: nextFeeding || null,
      });
      onSaved(updated);
      onClose();
    } catch (error) {
      showTelegramAlert(getApiErrorMessage(error, 'Не удалось сохранить изменения'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm(
      `Удалить растение «${plant.custom_name}»? История ухода будет удалена без возможности восстановления.`,
    );
    if (!ok) return;

    setDeleting(true);
    try {
      await deletePlant(plant.id);
      onDeleted(plant.id);
      onClose();
    } catch (error) {
      showTelegramAlert(getApiErrorMessage(error, 'Не удалось удалить растение'));
    } finally {
      setDeleting(false);
    }
  };

  const busy = saving || deleting;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 pb-28 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plant-edit-title"
      onClick={onClose}
    >
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-panel max-h-[min(85vh,32rem)] overflow-hidden rounded-[1.75rem] p-0">
          <div className="modal-panel-border flex items-center justify-between border-b px-4 py-3">
            <h3 id="plant-edit-title" className="font-serif text-lg">
              Редактирование
            </h3>
            <button
              type="button"
              aria-label="Закрыть"
              onClick={onClose}
              disabled={busy}
              className="modal-panel-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-xl hover:opacity-80 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            className="max-h-[min(70vh,26rem)] space-y-4 overflow-y-auto px-4 py-4"
            onSubmit={(event) => void handleSubmit(event)}
          >
            <label className="block space-y-2 text-sm">
              <span className="modal-panel-muted font-medium">Имя растения</span>
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="input-glass w-full rounded-2xl px-4 py-3"
                disabled={busy}
              />
            </label>

            <label className="block space-y-2 text-sm">
              <span className="modal-panel-muted font-medium">Комната</span>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="input-glass w-full rounded-2xl px-4 py-3"
                disabled={busy || roomsLoading}
              >
                <option value="">Без комнаты</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="space-y-2" disabled={busy}>
              <legend className="modal-panel-muted text-sm font-medium">Сезон</legend>
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

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-2 text-sm">
                <span className="modal-panel-muted font-medium">Следующий полив</span>
                <input
                  type="date"
                  value={nextWatering}
                  onChange={(e) => setNextWatering(e.target.value)}
                  className="input-glass w-full rounded-2xl px-3 py-3"
                  disabled={busy}
                />
              </label>
              <label className="block space-y-2 text-sm">
                <span className="modal-panel-muted font-medium">Следующая подкормка</span>
                <input
                  type="date"
                  value={nextFeeding}
                  onChange={(e) => setNextFeeding(e.target.value)}
                  className="input-glass w-full rounded-2xl px-3 py-3"
                  disabled={busy}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={busy || roomsLoading}
              className="btn-primary flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold disabled:opacity-60"
            >
              {saving ? <Spinner className="h-4 w-4" /> : null}
              {saving ? 'Сохраняем…' : 'Сохранить'}
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => void handleDelete()}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-red-400/30 bg-red-950/30 py-3 text-sm font-medium text-red-200/90 transition-colors hover:bg-red-950/50 disabled:opacity-50"
            >
              {deleting ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
              Удалить растение
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
