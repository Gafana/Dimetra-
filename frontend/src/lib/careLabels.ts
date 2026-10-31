import type { CalendarEventKind, CareActionType } from '../api/types.js';

export function careActionLabel(action: CareActionType): string {
  switch (action) {
    case 'watering':
      return 'Полив';
    case 'feeding':
      return 'Подкормка';
    case 'repot':
      return 'Пересадка';
    default:
      return action;
  }
}

export function careEventTitle(action: CareActionType, kind: CalendarEventKind): string {
  const base = careActionLabel(action);
  if (kind === 'completed') {
    return `${base} ✓`;
  }
  if (kind === 'overdue') {
    return base;
  }
  return base;
}

export function careActionTone(action: CareActionType): 'water' | 'feed' | 'repot' {
  switch (action) {
    case 'watering':
      return 'water';
    case 'feeding':
      return 'feed';
    case 'repot':
      return 'repot';
  }
}
