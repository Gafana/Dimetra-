import { Droplets, Leaf, Shovel, Sparkles } from 'lucide-react';
import { formatDisplayDate, isCareDue, todayIsoDate } from '../lib/dates.js';
import type { PlantCareAction, UserPlant } from '../api/types.js';
import { GlassPanel } from './ui/GlassPanel.js';
import { Spinner } from './ui/Spinner.js';

interface PlantCardProps {
  plant: UserPlant;
  pendingAction?: PlantCareAction | 'repot' | null;
  onWater: (plantId: string) => void;
  onFeed: (plantId: string) => void;
  onRepot: (plantId: string) => void;
}

export function PlantCard({ plant, pendingAction, onWater, onFeed, onRepot }: PlantCardProps) {
  const today = todayIsoDate();
  const wateringDue = isCareDue(plant.next_watering_date, today);
  const feedingDue = isCareDue(plant.next_feeding_date, today);

  return (
    <GlassPanel className="overflow-hidden p-0">
      <div className="relative h-28 bg-gradient-to-br from-forest-700/80 via-forest-800/60 to-forest-950/90">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(184,212,196,0.25),transparent_55%)]" />
        <Leaf
          className="absolute bottom-3 right-3 h-16 w-16 text-sage-300/25"
          strokeWidth={1}
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1">
          {wateringDue ? <StatusBadge label="Полив" tone="amber" /> : null}
          {feedingDue ? <StatusBadge label="Корм" tone="mint" /> : null}
          {!wateringDue && !feedingDue ? (
            <StatusBadge label="OK" tone="muted" />
          ) : null}
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="font-serif text-xl leading-tight text-sage-100">{plant.custom_name}</h3>
          <p className="text-xs text-sage-400/90">
            {plant.current_season === 'summer' ? 'Летний режим' : 'Зимний режим'}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-2 text-xs">
          <Metric label="Полив" value={formatDisplayDate(plant.next_watering_date)} />
          <Metric label="Подкормка" value={formatDisplayDate(plant.next_feeding_date)} />
        </dl>

        <div className="flex gap-2">
          <IconAction
            label="Полить"
            icon={Droplets}
            loading={pendingAction === 'watering'}
            disabled={Boolean(pendingAction)}
            onClick={() => onWater(plant.id)}
          />
          <IconAction
            label="Корм"
            icon={Sparkles}
            loading={pendingAction === 'feeding'}
            disabled={Boolean(pendingAction)}
            onClick={() => onFeed(plant.id)}
          />
          <IconAction
            label="Горшок"
            icon={Shovel}
            loading={pendingAction === 'repot'}
            disabled={Boolean(pendingAction)}
            variant="ghost"
            onClick={() => onRepot(plant.id)}
          />
        </div>
      </div>
    </GlassPanel>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: 'amber' | 'mint' | 'muted';
}) {
  const styles = {
    amber: 'bg-amber-400/15 text-amber-100 ring-amber-300/25',
    mint: 'bg-sage-400/20 text-sage-100 ring-sage-300/30',
    muted: 'bg-white/10 text-sage-300 ring-white/10',
  }[tone];

  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${styles}`}>
      {label}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-2.5 py-2 ring-1 ring-white/5">
      <dt className="text-sage-400/80">{label}</dt>
      <dd className="font-medium text-sage-100">{value}</dd>
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
        'inline-flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium disabled:opacity-50',
        variant === 'primary' ? 'btn-primary' : 'glass text-sage-200',
      ].join(' ')}
    >
      {loading ? <Spinner className="h-4 w-4" /> : <Icon className="h-4 w-4" strokeWidth={1.75} />}
      {label}
    </button>
  );
}
