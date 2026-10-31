import { useState, type FormEvent, type ReactNode } from 'react';
import type { PlantCatalogEntry, UpsertPlantCatalogPayload } from '../../api/types.js';
import { LIGHT_LEVEL_OPTIONS, lightLevelHint, lightLevelLabel } from '../../lib/lightLevel.js';
import { GlassPanel } from '../ui/GlassPanel.js';

const defaultSeasons = (): PlantCatalogEntry['seasons'] => ({
  summer: { wateringDays: 7, feedingDays: 14 },
  winter: { wateringDays: 14, feedingDays: 30 },
});

export function plantToFormState(plant?: PlantCatalogEntry): UpsertPlantCatalogPayload {
  if (!plant) {
    return {
      name: '',
      nameLatin: '',
      imageUrl: '',
      description: '',
      wateringNotes: '',
      feedingProduct: '',
      feedingNotes: '',
      lightLevel: 'bright_window',
      lightNotes: '',
      seasons: defaultSeasons(),
      sourceUrl: '',
    };
  }
  return {
    name: plant.name,
    nameLatin: plant.nameLatin ?? '',
    imageUrl: plant.imageUrl,
    description: plant.description ?? '',
    wateringNotes: plant.wateringNotes ?? '',
    feedingProduct: plant.feedingProduct ?? '',
    feedingNotes: plant.feedingNotes ?? '',
    lightLevel: plant.lightLevel,
    lightNotes: plant.lightNotes ?? '',
    seasons: plant.seasons,
    sourceUrl: plant.sourceUrl ?? '',
  };
}

export function PlantPassportForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: PlantCatalogEntry;
  submitLabel: string;
  onSubmit: (payload: UpsertPlantCatalogPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(() => plantToFormState(initial));
  const [saving, setSaving] = useState(false);

  const setSeason = (
    season: 'summer' | 'winter',
    field: 'wateringDays' | 'feedingDays',
    value: number,
  ) => {
    setForm((prev) => ({
      ...prev,
      seasons: {
        ...prev.seasons,
        [season]: { ...prev.seasons[season], [field]: value },
      },
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        nameLatin: form.nameLatin || null,
        description: form.description || null,
        wateringNotes: form.wateringNotes || null,
        feedingProduct: form.feedingProduct || null,
        feedingNotes: form.feedingNotes || null,
        lightNotes: form.lightNotes || null,
        sourceUrl: form.sourceUrl || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
      <GlassPanel className="space-y-3 p-4">
        <p className="text-sm font-medium text-sage-200">Паспорт</p>
        <Field label="Название (RU)">
          <input
            required
            className="input-glass w-full rounded-xl px-3 py-2.5 text-sm"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
        </Field>
        <Field label="Латинское название">
          <input
            className="input-glass w-full rounded-xl px-3 py-2.5 text-sm"
            value={form.nameLatin ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, nameLatin: e.target.value }))}
          />
        </Field>
        <Field label="URL фотографии">
          <input
            required
            type="url"
            className="input-glass w-full rounded-xl px-3 py-2.5 text-sm"
            value={form.imageUrl}
            onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
          />
        </Field>
        {form.imageUrl ? (
          <img
            src={form.imageUrl}
            alt=""
            className="h-40 w-full rounded-xl object-cover"
            referrerPolicy="no-referrer"
          />
        ) : null}
      </GlassPanel>

      <GlassPanel className="space-y-3 p-4">
        <p className="text-sm font-medium text-sage-200">Полив (интервалы в днях)</p>
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Лето"
            value={form.seasons.summer.wateringDays}
            onChange={(v) => setSeason('summer', 'wateringDays', v)}
          />
          <NumberField
            label="Зима"
            value={form.seasons.winter.wateringDays}
            onChange={(v) => setSeason('winter', 'wateringDays', v)}
          />
        </div>
        <Field label="Заметки о поливе">
          <textarea
            rows={3}
            className="input-glass w-full rounded-xl px-3 py-2.5 text-sm"
            value={form.wateringNotes ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, wateringNotes: e.target.value }))}
          />
        </Field>
      </GlassPanel>

      <GlassPanel className="space-y-3 p-4">
        <p className="text-sm font-medium text-sage-200">Подкормка</p>
        <Field label="Чем удобрять">
          <input
            className="input-glass w-full rounded-xl px-3 py-2.5 text-sm"
            value={form.feedingProduct ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, feedingProduct: e.target.value }))}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Лето (дней)"
            value={form.seasons.summer.feedingDays}
            onChange={(v) => setSeason('summer', 'feedingDays', v)}
          />
          <NumberField
            label="Зима (дней)"
            value={form.seasons.winter.feedingDays}
            onChange={(v) => setSeason('winter', 'feedingDays', v)}
          />
        </div>
        <Field label="Как подкармливать">
          <textarea
            rows={3}
            className="input-glass w-full rounded-xl px-3 py-2.5 text-sm"
            value={form.feedingNotes ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, feedingNotes: e.target.value }))}
          />
        </Field>
      </GlassPanel>

      <GlassPanel className="space-y-3 p-4">
        <p className="text-sm font-medium text-sage-200">Освещение (средняя полоса)</p>
        <select
          className="input-glass w-full rounded-xl px-3 py-2.5 text-sm"
          value={form.lightLevel}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              lightLevel: e.target.value as UpsertPlantCatalogPayload['lightLevel'],
            }))
          }
        >
          {LIGHT_LEVEL_OPTIONS.map((level) => (
            <option key={level} value={level}>
              {lightLevelLabel(level)}
            </option>
          ))}
        </select>
        <p className="text-xs text-sage-400/90">{lightLevelHint(form.lightLevel)}</p>
        <Field label="Уточнение">
          <textarea
            rows={2}
            className="input-glass w-full rounded-xl px-3 py-2.5 text-sm"
            value={form.lightNotes ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, lightNotes: e.target.value }))}
          />
        </Field>
      </GlassPanel>

      <GlassPanel className="space-y-3 p-4">
        <p className="text-sm font-medium text-sage-200">Описание</p>
        <textarea
          rows={8}
          className="input-glass w-full rounded-xl px-3 py-2.5 text-sm leading-relaxed"
          value={form.description ?? ''}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
        />
      </GlassPanel>

      <div className="flex gap-2">
        <button
          type="button"
          className="glass flex-1 rounded-full py-3 text-sm text-sage-200"
          onClick={onCancel}
        >
          Отмена
        </button>
        <button type="submit" disabled={saving} className="btn-primary flex-1 rounded-full py-3 text-sm">
          {saving ? 'Сохранение…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5 text-xs text-sage-300/90">
      <span className="font-medium text-sage-200">{label}</span>
      {children}
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block space-y-1.5 text-xs">
      <span className="text-sage-300/90">{label}</span>
      <input
        type="number"
        min={1}
        max={120}
        required
        className="input-glass w-full rounded-xl px-3 py-2.5 text-sm"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
