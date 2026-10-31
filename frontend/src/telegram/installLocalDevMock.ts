import type { TelegramMainButton, TelegramThemeParams, TelegramWebApp } from '../types/telegram-web-app.js';
import { getLocalDevChatId, isBrowserLocalDevMode } from '../lib/localDev.js';

const DEFAULT_THEME: TelegramThemeParams = {
  bg_color: '#0f1a14',
  text_color: '#e8f0ea',
  hint_color: '#8fa896',
  link_color: '#7cb88a',
  button_color: '#5a9e6f',
  button_text_color: '#ffffff',
  secondary_bg_color: '#1a2e22',
};

function createMainButtonMock(): TelegramMainButton {
  let visible = false;
  let text = '';
  let active = true;
  let progress = false;
  let onClickHandler: (() => void) | null = null;

  return {
    get text() {
      return text;
    },
    color: '#5a9e6f',
    textColor: '#ffffff',
    get isVisible() {
      return visible;
    },
    get isActive() {
      return active;
    },
    get isProgressVisible() {
      return progress;
    },
    setText(value: string) {
      text = value;
    },
    show() {
      visible = true;
    },
    hide() {
      visible = false;
    },
    enable() {
      active = true;
    },
    disable() {
      active = false;
    },
    showProgress() {
      progress = true;
    },
    hideProgress() {
      progress = false;
    },
    onClick(handler: () => void) {
      onClickHandler = handler;
    },
    offClick(handler: () => void) {
      if (onClickHandler === handler) {
        onClickHandler = null;
      }
    },
  };
}

function createWebAppMock(): TelegramWebApp {
  const mainButton = createMainButtonMock();
  const chatId = getLocalDevChatId();
  const userJson = JSON.stringify({
    id: Number(chatId) || 900001,
    first_name: 'Local',
    last_name: 'Dev',
    username: 'local_dev',
    language_code: 'ru',
  });

  return {
    initData: '',
    initDataUnsafe: {
      user: JSON.parse(userJson),
    },
    colorScheme: 'dark',
    themeParams: DEFAULT_THEME,
    MainButton: mainButton,
    ready() {},
    expand() {},
    close() {},
    onEvent() {},
    offEvent() {},
    showAlert(message: string, callback?: () => void) {
      window.alert(message);
      callback?.();
    },
    showPopup(params, callback) {
      window.alert(params.message);
      callback?.('ok');
    },
  };
}

/** Browser-only stand-in for Telegram WebApp when VITE_LOCAL_DEV=true. */
export function installLocalDevMock(): boolean {
  if (!isBrowserLocalDevMode()) {
    return false;
  }
  if (window.Telegram?.WebApp) {
    return false;
  }

  window.Telegram = { WebApp: createWebAppMock() };
  return true;
}
