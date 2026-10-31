import type { PlantCareStatus } from '../api/types.js';
import {
  PLANT_CARE_STATUS_DOT_CLASS,
  PLANT_CARE_STATUS_LABEL,
} from '../lib/plantCareStatus.js';

export function PlantCardCareStatusDot({
  status,
  className = '',
}: {
  status: PlantCareStatus;
  className?: string;
}) {
  const label = PLANT_CARE_STATUS_LABEL[status];

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={[
        'inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/20',
        PLANT_CARE_STATUS_DOT_CLASS[status],
        className,
      ].join(' ')}
    />
  );
}
