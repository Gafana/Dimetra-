import { Markup } from 'telegraf';
import { CARE_BOT_EMOJI, OPEN_DIMETRA_EMOJI } from '../services/careBotMessages.js';
import { resolveTelegramWebAppUrl } from '../lib/webAppUrl.js';

/** Same emojis as inline/plan messages in `careBotMessages`. */
export const MAIN_MENU_LABELS = {
  openApp: `${OPEN_DIMETRA_EMOJI} Открыть Dimetra`,
  today: `${CARE_BOT_EMOJI.todayPlan} План на сегодня`,
  overdue: `${CARE_BOT_EMOJI.overdue} Просрочки`,
} as const;

export type MainMenuLabel = (typeof MAIN_MENU_LABELS)[keyof typeof MAIN_MENU_LABELS];

export type MainMenuAction = keyof typeof MAIN_MENU_LABELS;

const LABEL_BY_ACTION: Record<MainMenuAction, MainMenuLabel> = MAIN_MENU_LABELS;

const ACTION_BY_LABEL = new Map<MainMenuLabel, MainMenuAction>(
  (Object.keys(LABEL_BY_ACTION) as MainMenuAction[]).map((action) => [
    LABEL_BY_ACTION[action],
    action,
  ]),
);

export function parseMainMenuLabel(text: string): MainMenuAction | null {
  const trimmed = text.trim();
  for (const [label, action] of ACTION_BY_LABEL) {
    if (trimmed === label) {
      return action;
    }
  }
  return null;
}

export const MAIN_MENU_HEAR_LABELS: MainMenuLabel[] = [
  MAIN_MENU_LABELS.openApp,
  MAIN_MENU_LABELS.today,
  MAIN_MENU_LABELS.overdue,
];

/** Inline web_app passes initData; reply-keyboard web_app does not. */
export const INLINE_OPEN_APP_LABEL = 'Открыть';

export function inlineOpenAppExtra(extra: Record<string, unknown> = {}): Record<string, unknown> {
  const url = resolveTelegramWebAppUrl();
  if (!url) {
    return extra;
  }
  const inline = Markup.inlineKeyboard([Markup.button.webApp(INLINE_OPEN_APP_LABEL, url)]);
  return {
    ...extra,
    ...inline,
  };
}

export function mainMenuReplyExtra(extra: Record<string, unknown> = {}): Record<string, unknown> {
  const keyboard = Markup.keyboard([
    [Markup.button.text(MAIN_MENU_LABELS.openApp), Markup.button.text(MAIN_MENU_LABELS.today)],
    [Markup.button.text(MAIN_MENU_LABELS.overdue)],
  ])
    .resize()
    .persistent();

  return {
    ...extra,
    ...keyboard,
  };
}
