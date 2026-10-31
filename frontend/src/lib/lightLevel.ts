import type { LightRequirementLevel } from '../api/types.js';

export function lightLevelLabel(level: LightRequirementLevel): string {
  switch (level) {
    case 'window_moscow_ok':
      return 'Обычного окна хватит';
    case 'bright_window':
      return 'Нужно светлое окно';
    case 'grow_lamp':
      return 'Желательна фитолампа';
  }
}

export function lightLevelHint(level: LightRequirementLevel): string {
  switch (level) {
    case 'window_moscow_ok':
      return 'Средняя полоса: рассеянный свет из окна, без жёсткого полудня.';
    case 'bright_window':
      return 'Лучше восток/запад или близко к окну; зимой может понадобиться досветка.';
    case 'grow_lamp':
      return 'Часто нужна фитолампа или УФ-досветка 10–12 ч, особенно зимой.';
  }
}

export const LIGHT_LEVEL_OPTIONS: LightRequirementLevel[] = [
  'window_moscow_ok',
  'bright_window',
  'grow_lamp',
];
