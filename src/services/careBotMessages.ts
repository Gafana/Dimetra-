import { Markup } from 'telegraf';
import type { InlineKeyboardMarkup } from 'telegraf/types';
import type { CareObligationWithPlant } from './careObligationService.js';

export interface TodayPlanItem {
  plant_id: string;
  custom_name: string;
  action_type: 'watering' | 'feeding';
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function actionLabel(actionType: 'watering' | 'feeding'): string {
  return actionType === 'watering' ? 'полив' : 'подкормка';
}

function actionButtonLabel(actionType: 'watering' | 'feeding'): string {
  return actionType === 'watering' ? '💧 Полить' : '✨ Удобрить';
}

export function careCallbackData(actionType: 'watering' | 'feeding', plantId: string): string {
  return `care:${actionType}:${plantId}`;
}

export function parseCareCallbackData(data: string): { actionType: 'watering' | 'feeding'; plantId: string } | null {
  const match = /^care:(watering|feeding):([0-9a-f-]{36})$/i.exec(data);
  if (!match) {
    return null;
  }
  return { actionType: match[1] as 'watering' | 'feeding', plantId: match[2]! };
}

function buildActionKeyboard(items: TodayPlanItem[]): InlineKeyboardMarkup | undefined {
  if (items.length === 0) {
    return undefined;
  }
  const rows = items.map((item) => [
    Markup.button.callback(
      `${actionButtonLabel(item.action_type)} · ${item.custom_name}`,
      careCallbackData(item.action_type, item.plant_id),
    ),
  ]);
  return Markup.inlineKeyboard(rows).reply_markup;
}

export function buildTodayPlanMessage(
  items: TodayPlanItem[],
): { text: string; reply_markup?: InlineKeyboardMarkup } {
  if (items.length === 0) {
    return {
      text: '📋 <b>План на сегодня</b>\n\nНа сегодня нет запланированного полива или подкормки.',
    };
  }

  const lines = items.map(
    (item) =>
      `• ${escapeHtml(item.custom_name)} — ${actionLabel(item.action_type)}`,
  );

  return {
    text: ['📋 <b>План на сегодня</b>', ...lines].join('\n'),
    reply_markup: buildActionKeyboard(items),
  };
}

export function buildOverdueMessage(
  obligations: CareObligationWithPlant[],
): { text: string; reply_markup?: InlineKeyboardMarkup } {
  if (obligations.length === 0) {
    return {
      text: '⏰ <b>Просрочки</b>\n\nОткрытых просрочек нет — всё актуально.',
    };
  }

  const lines = obligations.map((row) => {
    const name = escapeHtml(row.plant_name);
    const due = escapeHtml(row.due_date);
    return `• ${name}: ${actionLabel(row.action_type)} (с ${due})`;
  });

  const keyboardItems: TodayPlanItem[] = obligations.map((row) => ({
    plant_id: row.plant_id,
    custom_name: row.plant_name,
    action_type: row.action_type,
  }));

  return {
    text: ['⏰ <b>Просроченный уход</b>', ...lines].join('\n'),
    reply_markup: buildActionKeyboard(keyboardItems),
  };
}

export function buildDailyTodayNotificationMessage(
  items: TodayPlanItem[],
): { text: string; reply_markup?: InlineKeyboardMarkup } | null {
  if (items.length === 0) {
    return null;
  }
  const lines = items.map(
    (item) =>
      `• ${escapeHtml(item.custom_name)}: ${item.action_type === 'watering' ? 'нужен полив' : 'нужна подкормка'}`,
  );
  return {
    text: ['🪴 <b>Время позаботиться о растениях!</b>', 'Задачи на сегодня:', ...lines].join('\n'),
    reply_markup: buildActionKeyboard(items),
  };
}

export function buildDailyOverdueNotificationMessage(
  obligations: CareObligationWithPlant[],
): { text: string; reply_markup?: InlineKeyboardMarkup } | null {
  if (obligations.length === 0) {
    return null;
  }
  const payload = buildOverdueMessage(obligations);
  return {
    text: payload.text.replace('⏰ <b>Просроченный уход</b>', '⚠️ <b>Напоминание о просрочке</b>'),
    reply_markup: payload.reply_markup,
  };
}
