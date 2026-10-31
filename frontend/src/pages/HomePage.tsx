import { Search, SlidersHorizontal } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchRooms,
  performPlantAction,
  repotPlant,
  type PlantCareAction,
  type RoomWithPlants,
  type UserPlant,
} from '../api/index.js';
import { PlantCard } from '../components/PlantCard.js';
import { GlassPanel } from '../components/ui/GlassPanel.js';
import { SkeletonBlock } from '../components/ui/SkeletonBlock.js';
import { getApiErrorMessage } from '../lib/apiError.js';
import { showTelegramAlert } from '../lib/telegramUi.js';

type PendingMap = Record<string, PlantCareAction | 'repot' | undefined>;

function mergePlantIntoRooms(rooms: RoomWithPlants[], updatedPlant: UserPlant): RoomWithPlants[] {
  return rooms.map((room) => ({
    ...room,
    plants: room.plants.map((plant) => (plant.id === updatedPlant.id ? updatedPlant : plant)),
  }));
}

export function HomePage() {
  const [rooms, setRooms] = useState<RoomWithPlants[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PendingMap>({});
  const [query, setQuery] = useState('');
  const [roomFilter, setRoomFilter] = useState<string>('all');

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRooms();
      setRooms(data);
    } catch (error) {
      showTelegramAlert(getApiErrorMessage(error, 'Не удалось загрузить комнаты'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  const filteredRooms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rooms
      .filter((room) => roomFilter === 'all' || room.id === roomFilter)
      .map((room) => ({
        ...room,
        plants: room.plants.filter(
          (p) => !q || p.custom_name.toLowerCase().includes(q) || room.name.toLowerCase().includes(q),
        ),
      }))
      .filter((room) => room.plants.length > 0 || (roomFilter === room.id && !q));
  }, [rooms, query, roomFilter]);

  const runPlantMutation = async (
    plantId: string,
    actionKey: PlantCareAction | 'repot',
    request: () => Promise<UserPlant>,
  ) => {
    setPending((prev) => ({ ...prev, [plantId]: actionKey }));
    try {
      const updated = await request();
      setRooms((prev) => mergePlantIntoRooms(prev, updated));
    } catch (error) {
      showTelegramAlert(getApiErrorMessage(error));
    } finally {
      setPending((prev) => {
        const next = { ...prev };
        delete next[plantId];
        return next;
      });
    }
  };

  if (loading) {
    return (
      <section className="space-y-4">
        <SkeletonBlock className="h-36" />
        <SkeletonBlock className="h-12" />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonBlock className="h-52" />
          <SkeletonBlock className="h-52" />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <GlassPanel strong className="relative overflow-hidden p-5">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-sage-400/15 blur-2xl" />
        <p className="font-serif text-2xl leading-tight text-sage-100">Bring Greenery to Life</p>
        <p className="mt-1 max-w-[16rem] text-sm text-sage-300/90">
          Следите за поливом и подкормкой растений в каждой комнате.
        </p>
        {rooms.length === 0 ? (
          <Link
            to="/add-plant"
            className="btn-primary mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
          >
            Добавить первое растение
          </Link>
        ) : null}
      </GlassPanel>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sage-400/70" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск растений…"
          className="input-glass w-full rounded-full py-3 pl-10 pr-12 text-sm"
        />
        <SlidersHorizontal className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sage-400/60" />
      </div>

      {rooms.length > 0 ? (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
          <RoomChip
            label="Все"
            active={roomFilter === 'all'}
            onClick={() => setRoomFilter('all')}
          />
          {rooms.map((room) => (
            <RoomChip
              key={room.id}
              label={room.name}
              active={roomFilter === room.id}
              onClick={() => setRoomFilter(room.id)}
            />
          ))}
        </div>
      ) : null}

      {rooms.length === 0 ? (
        <GlassPanel className="p-5 text-sm text-sage-300/90">
          Пока нет комнат. Создайте комнату на экране «Добавить» и добавьте первое растение.
        </GlassPanel>
      ) : filteredRooms.every((r) => r.plants.length === 0) ? (
        <GlassPanel className="p-5 text-sm text-sage-300/90">
          Ничего не найдено. Измените фильтр или добавьте растение.
        </GlassPanel>
      ) : (
        filteredRooms.map((room) => (
          <div key={room.id} className="space-y-3">
            {roomFilter === 'all' ? (
              <h2 className="px-1 text-sm font-medium tracking-wide text-sage-400/90">{room.name}</h2>
            ) : null}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {room.plants.map((plant) => (
                <PlantCard
                  key={plant.id}
                  plant={plant}
                  pendingAction={pending[plant.id] ?? null}
                  onPlantUpdate={(updated) =>
                    setRooms((prev) => mergePlantIntoRooms(prev, updated))
                  }
                  onWater={(id) =>
                    void runPlantMutation(id, 'watering', () => performPlantAction(id, 'watering'))
                  }
                  onFeed={(id) =>
                    void runPlantMutation(id, 'feeding', () => performPlantAction(id, 'feeding'))
                  }
                  onRepot={(id) => void runPlantMutation(id, 'repot', () => repotPlant(id))}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}

function RoomChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'shrink-0 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all',
        active
          ? 'chip-active border-sage-300/40 text-sage-100'
          : 'glass border-transparent text-sage-400/90',
      ].join(' ')}
    >
      {label}
    </button>
  );
}
