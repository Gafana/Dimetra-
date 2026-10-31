import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  createEncyclopediaPlant,
  deleteEncyclopediaPlant,
  fetchEncyclopediaPlant,
  updateEncyclopediaPlant,
  type PlantCatalogEntry,
  type UpsertPlantCatalogPayload,
} from '../api/index.js';
import { CareHighlights } from '../components/encyclopedia/CareHighlights.js';
import { PlantPassportForm } from '../components/encyclopedia/PlantPassportForm.js';
import { GlassPanel } from '../components/ui/GlassPanel.js';
import { PageLoader } from '../components/ui/PageLoader.js';
import { invalidateCatalogPickerCache } from '../lib/catalogPickerCache.js';
import { getApiErrorMessage } from '../lib/apiError.js';
import { isBrowserLocalDevMode } from '../lib/localDev.js';
import { showTelegramAlert, showTelegramPopup } from '../lib/telegramUi.js';

export function EncyclopediaPassportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const canDeleteEncyclopedia = isBrowserLocalDevMode();

  const [plant, setPlant] = useState<PlantCatalogEntry | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [editing, setEditing] = useState(isNew);

  const load = useCallback(async () => {
    if (!id || isNew) {
      return;
    }
    setLoading(true);
    try {
      setPlant(await fetchEncyclopediaPlant(id));
    } catch (error) {
      showTelegramAlert(getApiErrorMessage(error, 'Паспорт не найден'));
      navigate('/encyclopedia');
    } finally {
      setLoading(false);
    }
  }, [id, isNew, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (payload: UpsertPlantCatalogPayload) => {
    try {
      if (isNew) {
        const created = await createEncyclopediaPlant(payload);
        navigate(`/encyclopedia/${created.id}`, { replace: true });
        setPlant(created);
        setEditing(false);
        invalidateCatalogPickerCache();
        showTelegramPopup('Растение добавлено в энциклопедию', 'Готово');
        return;
      }
      if (!id) {
        return;
      }
      const updated = await updateEncyclopediaPlant(id, payload);
      setPlant(updated);
      invalidateCatalogPickerCache();
      setEditing(false);
      showTelegramPopup('Изменения сохранены', 'Готово');
    } catch (error) {
      showTelegramAlert(getApiErrorMessage(error, 'Не удалось сохранить'));
    }
  };

  const handleDelete = async () => {
    if (!id || isNew) {
      return;
    }
    const ok = window.confirm(`Удалить «${plant?.name}» из энциклопедии?`);
    if (!ok) {
      return;
    }
    try {
      await deleteEncyclopediaPlant(id);
      invalidateCatalogPickerCache();
      navigate('/encyclopedia');
    } catch (error) {
      showTelegramAlert(getApiErrorMessage(error, 'Не удалось удалить'));
    }
  };

  if (loading) {
    return <PageLoader label="Загружаем паспорт…" />;
  }

  if (editing || isNew) {
    return (
      <section className="space-y-4">
        <HeaderBack title={isNew ? 'Новый паспорт' : 'Редактирование'} />
        <PlantPassportForm
          initial={plant ?? undefined}
          submitLabel={isNew ? 'Создать' : 'Сохранить'}
          onSubmit={handleSave}
          onCancel={() => (isNew ? navigate('/encyclopedia') : setEditing(false))}
        />
      </section>
    );
  }

  if (!plant) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <HeaderBack title={plant.name} />
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Редактировать"
            onClick={() => setEditing(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-sage-200 hover:bg-white/8"
          >
            <Pencil className="h-5 w-5" />
          </button>
          {canDeleteEncyclopedia ? (
            <button
              type="button"
              aria-label="Удалить"
              onClick={() => void handleDelete()}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-red-300/90 hover:bg-red-500/10"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>

      <GlassPanel className="overflow-hidden p-0">
        <img
          src={plant.imageUrl}
          alt=""
          className="max-h-56 w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="p-4">
          {plant.nameLatin ? (
            <p className="text-sm italic text-sage-400/90">{plant.nameLatin}</p>
          ) : null}
        </div>
      </GlassPanel>

      <CareHighlights plant={plant} />

      {plant.description ? (
        <GlassPanel className="p-4">
          <h3 className="text-sm font-semibold text-sage-200">Описание</h3>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-sage-300/95">
            {plant.description}
          </p>
        </GlassPanel>
      ) : null}

      {plant.sourceUrl ? (
        <a
          href={plant.sourceUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="block text-center text-xs text-sage-400 underline"
        >
          Первоисточник статьи
        </a>
      ) : null}
    </section>
  );
}

function HeaderBack({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Link
        to="/encyclopedia"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-sage-200 hover:bg-white/8"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <h2 className="font-serif text-xl text-sage-100">{title}</h2>
    </div>
  );
}
