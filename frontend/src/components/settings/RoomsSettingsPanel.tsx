import { Home, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  createRoom,
  deleteRoom,
  fetchRooms,
  updateRoom,
  type RoomWithPlants,
} from '../../api/index.js';
import { GlassPanel } from '../ui/GlassPanel.js';
import { SkeletonBlock } from '../ui/SkeletonBlock.js';
import { getApiErrorMessage } from '../../lib/apiError.js';
import { showTelegramAlert, showTelegramPopup } from '../../lib/telegramUi.js';

export function RoomsSettingsPanel() {
  const [rooms, setRooms] = useState<RoomWithPlants[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRoomName, setNewRoomName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRooms(await fetchRooms());
    } catch (error) {
      showTelegramAlert(getApiErrorMessage(error, 'Не удалось загрузить комнаты'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    const name = newRoomName.trim();
    if (!name) {
      showTelegramAlert('Введите название комнаты');
      return;
    }
    setCreating(true);
    try {
      const room = await createRoom(name);
      setRooms((prev) => [...prev, { ...room, plants: [] }].sort((a, b) => a.name.localeCompare(b.name, 'ru')));
      setNewRoomName('');
      showTelegramPopup('Комната добавлена', 'Готово');
    } catch (error) {
      showTelegramAlert(getApiErrorMessage(error, 'Не удалось создать комнату'));
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (room: RoomWithPlants) => {
    setEditingId(room.id);
    setEditName(room.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleSaveEdit = async (roomId: string) => {
    const name = editName.trim();
    if (!name) {
      showTelegramAlert('Название не может быть пустым');
      return;
    }
    setSavingId(roomId);
    try {
      const updated = await updateRoom(roomId, name);
      setRooms((prev) =>
        prev
          .map((r) => (r.id === roomId ? { ...r, name: updated.name } : r))
          .sort((a, b) => a.name.localeCompare(b.name, 'ru')),
      );
      cancelEdit();
      showTelegramPopup('Название сохранено', 'Готово');
    } catch (error) {
      showTelegramAlert(getApiErrorMessage(error, 'Не удалось сохранить'));
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (room: RoomWithPlants) => {
    const plantCount = room.plants.length;
    if (plantCount > 0) {
      const ok = window.confirm(
        `В комнате «${room.name}» ${plantCount} ${plantLabel(plantCount)}. Удалить комнату? Растения останутся без комнаты.`,
      );
      if (!ok) {
        return;
      }
    } else {
      const ok = window.confirm(`Удалить комнату «${room.name}»?`);
      if (!ok) {
        return;
      }
    }

    setDeletingId(room.id);
    try {
      await deleteRoom(room.id);
      setRooms((prev) => prev.filter((r) => r.id !== room.id));
      if (editingId === room.id) {
        cancelEdit();
      }
    } catch (error) {
      showTelegramAlert(getApiErrorMessage(error, 'Не удалось удалить комнату'));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonBlock className="h-24" />
        <SkeletonBlock className="h-24" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rooms.length === 0 ? (
        <GlassPanel className="p-4 text-sm text-sage-300/90">
          Пока нет комнат. Добавьте первую ниже — затем можно привязывать к ним растения.
        </GlassPanel>
      ) : (
        <ul className="space-y-2">
          {rooms.map((room) => {
            const isEditing = editingId === room.id;
            return (
              <li key={room.id}>
                <GlassPanel className="flex items-start gap-2 p-3">
                  <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sage-400/15">
                    <Home className="h-4 w-4 text-sage-300" />
                  </span>
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="input-glass w-full rounded-xl px-3 py-2 text-sm"
                        autoFocus
                      />
                    ) : (
                      <>
                        <p className="font-medium text-sage-100">{room.name}</p>
                        <p className="text-xs text-sage-400/80">
                          {room.plants.length === 0
                            ? 'Нет растений'
                            : `${room.plants.length} ${plantLabel(room.plants.length)}`}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          disabled={savingId === room.id}
                          onClick={() => void handleSaveEdit(room.id)}
                          className="rounded-xl px-3 py-2 text-xs font-semibold text-sage-100 hover:bg-white/10"
                        >
                          {savingId === room.id ? '…' : 'OK'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-xl px-2 py-2 text-xs text-sage-400 hover:bg-white/10"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          aria-label="Редактировать"
                          onClick={() => startEdit(room)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-sage-300 hover:bg-white/10"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Удалить"
                          disabled={deletingId === room.id}
                          onClick={() => void handleDelete(room)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-red-300/90 hover:bg-red-500/10 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </GlassPanel>
              </li>
            );
          })}
        </ul>
      )}

      <GlassPanel className="space-y-3 p-4">
        <p className="text-sm font-medium text-sage-200">Новая комната</p>
        <div className="flex gap-2">
          <input
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="Кухня, спальня…"
            className="input-glass min-w-0 flex-1 rounded-2xl px-4 py-3 text-sm"
          />
          <button
            type="button"
            disabled={creating}
            onClick={() => void handleCreate()}
            className="btn-primary inline-flex items-center gap-1 rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </GlassPanel>
    </div>
  );
}

function plantLabel(count: number): string {
  if (count === 1) return 'растение';
  if (count >= 2 && count <= 4) return 'растения';
  return 'растений';
}
