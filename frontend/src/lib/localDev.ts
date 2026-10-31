export function isBrowserLocalDevMode(): boolean {
  return import.meta.env.VITE_LOCAL_DEV === 'true';
}

export function getLocalDevChatId(): string {
  const fromEnv = import.meta.env.VITE_LOCAL_DEV_CHAT_ID?.trim();
  return fromEnv || '900001';
}
