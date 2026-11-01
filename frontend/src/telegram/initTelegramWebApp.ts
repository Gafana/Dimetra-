import { applyTelegramTheme } from './applyTheme.js';

export function initTelegramWebApp(): void {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) {
    return;
  }

  webApp.ready();
  webApp.expand();
  applyTelegramTheme(webApp.themeParams, webApp.colorScheme);

  const onThemeChanged = (): void => {
    applyTelegramTheme(webApp.themeParams, webApp.colorScheme);
  };

  webApp.onEvent('themeChanged', onThemeChanged);
}
