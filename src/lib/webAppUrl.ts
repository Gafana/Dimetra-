/** Telegram Web App buttons require HTTPS. Query and hash are stripped so a promo code cannot ride in the URL. */
export function resolveTelegramWebAppUrl(): string | null {
  const raw = process.env.WEB_APP_URL?.trim();
  if (!raw) {
    return null;
  }
  if (!raw.startsWith('https://')) {
    console.warn(
      `WEB_APP_URL must start with https:// for Telegram Mini App (current: "${raw}"). Web App button omitted.`,
    );
    return null;
  }

  try {
    const parsed = new URL(raw);
    parsed.search = '';
    parsed.hash = '';
    const path = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/$/, '');
    return `${parsed.origin}${path}`;
  } catch {
    console.warn('WEB_APP_URL is not a valid URL. Web App button omitted.');
    return null;
  }
}
