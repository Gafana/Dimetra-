import { Camera, Clock, Droplets, Pencil, Shovel, Sparkles } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import {
  updatePlantPhoto,
  updatePlantSchedule,
  type PlantCareAction,
  type UserPlant,
} from '../api/index.js';
import { formatDisplayDate } from '../lib/dates.js';
import { compressPlantPhotoFile } from '../lib/compressPlantPhoto.js';
import { getApiErrorMessage } from '../lib/apiError.js';
import { showTelegramAlert } from '../lib/telegramUi.js';
import { PlantCardCareStatusDot } from './PlantCardCareStatusDot.js';
import { PlantCareHistoryModal } from './PlantCareHistoryModal.js';
import { PlantEditModal } from './PlantEditModal.js';
import { GlassPanel } from './ui/GlassPanel.js';
import { Spinner } from './ui/Spinner.js';

interface PlantCardProps {
  plant: UserPlant;
  pendingAction?: PlantCareAction | 'repot' | null;
  onWater: (plantId: string) => void;
  onFeed: (plantId: string) => void;
  onRepot: (plantId: string) => void;
  onPlantUpdate: (plant: UserPlant) => void;
  onPlantDelete: (plantId: string) => void;
}

export function PlantCard({
  plant,
  pendingAction,
  onWater,
  onFeed,
  onRepot,
  onPlantUpdate,
  onPlantDelete,
}: PlantCardProps) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState<'watering' | 'feeding' | null>(null);
  const actionsLocked = Boolean(pendingAction) || uploadingPhoto || savingSchedule !== null;

  const handlePhotoPick = async (file: File | undefined) => {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const dataUrl = await compressPlantPhotoFile(file);
      const updated = await updatePlantPhoto(plant.id, dataUrl);
      onPlantUpdate(updated);
    } catch (error) {
      showTelegramAlert(getApiErrorMessage(error, 'Не удалось загрузить фото'));
    } finally {
      setUploadingPhoto(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const saveScheduleDate = async (
    field: 'watering' | 'feeding',
    isoDate: string,
  ) => {
    setSavingSchedule(field);
    try {
      const patch =
        field === 'watering'
          ? { next_watering_date: isoDate || null }
          : { next_feeding_date: isoDate || null };
      const updated = await updatePlantSchedule(plant.id, patch);
      onPlantUpdate(updated);
    } catch (error) {
      showTelegramAlert(getApiErrorMessage(error, 'Не удалось сохранить дату'));
    } finally {
      setSavingSchedule(null);
    }
  };

  return (
    <>
      <GlassPanel className="overflow-hidden p-0">
        <div className="relative h-28 bg-gradient-to-br from-forest-700/80 via-forest-800/60 to-forest-950/90">
          {plant.photo_url ? (
            <img
              src={plant.photo_url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(184,212,196,0.25),transparent_55%)]" />
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-forest-950/70 via-transparent to-forest-950/20" />

          <button
            type="button"
            aria-label="Редактировать"
            disabled={Boolean(pendingAction)}
            onClick={() => setEditOpen(true)}
            className={`${overlayIconButtonClass} right-14`}
            title="Редактировать"
          >
            <Pencil className="h-4 w-4" strokeWidth={1.75} />
          </button>

          <button
            type="button"
            aria-label="История ухода"
            disabled={Boolean(pendingAction)}
            onClick={() => setHistoryOpen(true)}
            className={`${overlayIconButtonClass} right-3`}
            title="История ухода"
          >
            <Clock className="h-4 w-4" strokeWidth={1.75} />
          </button>

          <label
            htmlFor={inputId}
            className={`${overlayIconButtonClass} left-3 cursor-pointer`}
            title="Добавить фото"
          >
            {uploadingPhoto ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Camera className="h-4 w-4" strokeWidth={1.75} />
            )}
          </label>
          <input
            id={inputId}
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploadingPhoto || Boolean(pendingAction)}
            onChange={(e) => void handlePhotoPick(e.target.files?.[0])}
          />

        </div>

        <div className="space-y-3 p-4">
          <div>
            <h3 className="flex items-center gap-2 font-serif text-xl leading-tight text-sage-100">
              <PlantCardCareStatusDot status={plant.care_status} />
              <span className="min-w-0 truncate">{plant.custom_name}</span>
            </h3>
            <p className="text-xs text-sage-400/90">
              {plant.current_season === 'summer' ? 'Летний режим' : 'Зимний режим'}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-2 text-xs">
            <EditableDateMetric
              label="Полив"
              isoDate={plant.next_watering_date}
              disabled={actionsLocked}
              saving={savingSchedule === 'watering'}
              onSave={(iso) => void saveScheduleDate('watering', iso)}
            />
            <EditableDateMetric
              label="Подкормка"
              isoDate={plant.next_feeding_date}
              disabled={actionsLocked}
              saving={savingSchedule === 'feeding'}
              onSave={(iso) => void saveScheduleDate('feeding', iso)}
            />
          </dl>

          <div className="grid grid-cols-3 gap-2">
            <IconAction
              label="Полить"
              icon={Droplets}
              loading={pendingAction === 'watering'}
              disabled={Boolean(pendingAction)}
              onClick={() => onWater(plant.id)}
            />
            <IconAction
              label="Удобрить"
              icon={Sparkles}
              loading={pendingAction === 'feeding'}
              disabled={Boolean(pendingAction)}
              onClick={() => onFeed(plant.id)}
            />
            <IconAction
              label="Пересадить"
              icon={Shovel}
              loading={pendingAction === 'repot'}
              disabled={Boolean(pendingAction)}
              variant="ghost"
              onClick={() => onRepot(plant.id)}
            />
          </div>
        </div>
      </GlassPanel>

      {historyOpen ? (
        <PlantCareHistoryModal
          plantId={plant.id}
          plantName={plant.custom_name}
          onClose={() => setHistoryOpen(false)}
        />
      ) : null}

      {editOpen ? (
        <PlantEditModal
          plant={plant}
          onClose={() => setEditOpen(false)}
          onSaved={onPlantUpdate}
          onDeleted={onPlantDelete}
        />
      ) : null}
    </>
  );
}

const overlayIconButtonClass =
  'absolute top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-sage-100 ring-1 ring-white/20 backdrop-blur-sm transition-colors hover:bg-black/55 disabled:opacity-50';

function EditableDateMetric({
  label,
  isoDate,
  disabled,
  saving,
  onSave,
}: {
  label: string;
  isoDate: string | null;
  disabled?: boolean;
  saving?: boolean;
  onSave: (isoDate: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const display = formatDisplayDate(isoDate);

  const openPicker = () => {
    if (disabled || saving) return;
    const input = inputRef.current;
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    } else {
      input.click();
    }
  };

  return (
    <div className="relative rounded-xl bg-white/5 ring-1 ring-white/5">
      <button
        type="button"
        disabled={disabled || saving}
        onClick={openPicker}
        className="w-full px-2.5 py-2 text-left transition-colors hover:bg-white/[0.06] disabled:opacity-50"
        title={`Изменить дату: ${label}`}
      >
        <span className="text-sage-400/80">{label}</span>
        <span className="mt-0.5 flex items-center gap-1 font-medium text-sage-100">
          {saving ? <Spinner className="h-3.5 w-3.5" /> : null}
          {display}
        </span>
      </button>
      <input
        ref={inputRef}
        type="date"
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        value={isoDate ?? ''}
        disabled={disabled || saving}
        onChange={(e) => {
          if (e.target.value) {
            onSave(e.target.value);
          }
        }}
      />
    </div>
  );
}

function IconAction({
  label,
  icon: Icon,
  onClick,
  loading,
  disabled,
  variant = 'primary',
}: {
  label: string;
  icon: typeof Droplets;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={label}
      onClick={onClick}
      className={[
        'inline-flex flex-col items-center gap-1 rounded-xl py-2 text-[9px] font-medium disabled:opacity-50',
        variant === 'primary' ? 'btn-primary' : 'glass text-sage-200',
      ].join(' ')}
    >
      {loading ? <Spinner className="h-4 w-4" /> : <Icon className="h-4 w-4" strokeWidth={1.75} />}
      {label}
    </button>
  );
}
