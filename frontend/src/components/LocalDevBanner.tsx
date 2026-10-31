import { getLocalDevChatId, isBrowserLocalDevMode } from '../lib/localDev.js';
import { getApiBaseUrl } from '../api/client.js';

export function LocalDevBanner() {
  if (!isBrowserLocalDevMode()) {
    return null;
  }

  return (
    <div
      className="mb-3 rounded-2xl border border-amber-400/30 bg-amber-950/40 px-3 py-2 text-[11px] leading-snug text-amber-100/90"
      role="status"
    >
      <span className="font-semibold text-amber-200">Локальный режим</span>
      {' · '}
      API: {getApiBaseUrl() || '(не задан)'}
      {' · '}
      chat_id: {getLocalDevChatId()}
    </div>
  );
}
