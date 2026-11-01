import type { TelegramThemeParams } from '../types/telegram-web-app.js';

/** Сохраняем фирменную палитру; из Telegram берём акцент кнопки и светлую/тёмную схему. */
export function applyTelegramTheme(
  themeParams: TelegramThemeParams,
  colorScheme: 'light' | 'dark' = 'dark',
): void {
  const root = document.documentElement;
  root.dataset.tgColorScheme = colorScheme;
  root.style.colorScheme = colorScheme;

  if (colorScheme === 'light') {
    root.style.setProperty('--tg-bg', '#eef3ef');
    root.style.setProperty('--tg-text', '#1a2421');
    root.style.setProperty('--tg-hint', '#4a6356');
    root.style.setProperty('--tg-secondary-bg', 'rgba(0, 0, 0, 0.04)');
    root.style.setProperty('--modal-bg', '#f4f8f5');
    root.style.setProperty('--modal-border', 'rgba(26, 36, 33, 0.12)');
    root.style.setProperty('--modal-text', '#1a2421');
    root.style.setProperty('--modal-muted', '#4a6356');
  } else {
    root.style.setProperty('--tg-bg', '#141f1a');
    root.style.setProperty('--tg-text', '#e8f0eb');
    root.style.setProperty('--tg-hint', '#8fb89a');
    root.style.setProperty('--tg-secondary-bg', 'rgba(255, 255, 255, 0.06)');
    root.style.setProperty('--modal-bg', '#1a2421');
    root.style.setProperty('--modal-border', 'rgba(255, 255, 255, 0.12)');
    root.style.setProperty('--modal-text', '#e8f0eb');
    root.style.setProperty('--modal-muted', '#a8c3b0');
  }

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
