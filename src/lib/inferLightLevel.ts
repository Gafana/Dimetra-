import type { LightRequirementLevel } from '../db/catalogTypes.js';

export function inferLightLevelFromText(text: string | undefined): LightRequirementLevel {
  if (!text) {
    return 'bright_window';
  }
  const t = text.toLowerCase();
  if (/фитоламп|досветк|ламп|искусствен/.test(t)) {
    return 'grow_lamp';
  }
  if (/теневынослив|полутен|тень|мало света|рассеян/.test(t) && !/ярк/.test(t)) {
    return 'window_moscow_ok';
  }
  if (/прям.+солнц|южн.+окн|максимум света/.test(t)) {
    return 'grow_lamp';
  }
  return 'bright_window';
}

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
      return 'Подойдёт рассеянный свет из окна в квартире (средняя полоса), без полудня на юге.';
    case 'bright_window':
      return 'Лучше восточное/западное окно или отодвинуть ближе к свету; зимой возможна досветка.';
    case 'grow_lamp':
      return 'Зимой и в глубине комнаты обычно нужна фитолампа или УФ-досветка по 10–12 ч.';
  }
}
