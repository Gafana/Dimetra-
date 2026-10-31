import cron, { type ScheduledTask } from 'node-cron';

let keepaliveCronTask: ScheduledTask | null = null;

/** Публичный URL сервиса без завершающего слэша. */
export function resolveKeepaliveBaseUrl(): string | null {
  const raw = (process.env.KEEPALIVE_URL ?? process.env.RENDER_EXTERNAL_URL ?? '').trim();
  if (!raw) {
    return null;
  }
  return raw.replace(/\/+$/, '');
}

async function pingHealth(url: string): Promise<void> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      console.warn(`Keepalive ping ${url} returned HTTP ${response.status}`);
      return;
    }
    console.log(`Keepalive ping OK: ${url}`);
  } catch (error) {
    console.warn(`Keepalive ping failed for ${url}:`, error);
  }
}

/**
 * GET /health каждые 10 минут, чтобы Render Free реже засыпал между внешними пингами.
 * Отключено при LOCAL_DEV=true.
 */
export function startKeepalivePing(): void {
  stopKeepalivePing();

  if (process.env.LOCAL_DEV === 'true') {
    console.log('Keepalive ping disabled (LOCAL_DEV=true)');
    return;
  }

  const base = resolveKeepaliveBaseUrl();
  if (!base) {
    console.warn(
      'Keepalive ping disabled: set RENDER_EXTERNAL_URL (Render) or KEEPALIVE_URL',
    );
    return;
  }

  const healthUrl = `${base}/health`;

  void pingHealth(healthUrl);

  keepaliveCronTask = cron.schedule('*/5 * * * *', () => {
    void pingHealth(healthUrl);
  });

  console.log(`Keepalive ping scheduled every 5 minutes → ${healthUrl}`);
}

export function stopKeepalivePing(): void {
  if (keepaliveCronTask) {
    keepaliveCronTask.stop();
    keepaliveCronTask = null;
  }
}
