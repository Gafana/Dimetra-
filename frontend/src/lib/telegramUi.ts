export function showTelegramAlert(message: string): void {
  const webApp = window.Telegram?.WebApp;
  if (webApp?.showAlert) {
    webApp.showAlert(message);
    return;
  }
  window.alert(message);
}

export function showTelegramPopup(message: string, title = 'Dimetra'): void {
  const webApp = window.Telegram?.WebApp;
  if (webApp?.showPopup) {
    webApp.showPopup({ title, message, buttons: [{ type: 'ok', id: 'ok', text: 'OK' }] });
    return;
  }
  window.alert(`${title}\n\n${message}`);
}

export function getTelegramWebApp() {
  return window.Telegram?.WebApp;
}
