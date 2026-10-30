import type { TelegramThemeParams } from '../types/telegram-web-app.js';

/** Сохраняем фирменную тёмно-зелёную палитру; из Telegram берём только акцент кнопки. */
export function applyTelegramTheme(themeParams: TelegramThemeParams): void {
  const root = document.documentElement;

  root.style.setProperty('--tg-bg', '#141f1a');
  root.style.setProperty('--tg-text', '#e8f0eb');
  root.style.setProperty('--tg-hint', '#8fb89a');
  root.style.setProperty('--tg-secondary-bg', 'rgba(255, 255, 255, 0.06)');

  if (themeParams.button_color) {
    root.style.setProperty('--tg-button', themeParams.button_color);
  } else {
    root.style.setProperty('--tg-button', '#8fb89a');
  }

  if (themeParams.button_text_color) {
    root.style.setProperty('--tg-button-text', themeParams.button_text_color);
  } else {
    root.style.setProperty('--tg-button-text', '#0f1612');
  }

  if (themeParams.link_color) {
    root.style.setProperty('--tg-link', themeParams.link_color);
  }
}
