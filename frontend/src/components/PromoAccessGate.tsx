import { useEffect, useState, type ReactNode } from 'react';
import axios from 'axios';
import { fetchAccessStatus } from '../api/index.js';
import { getApiErrorMessage } from '../lib/apiError.js';
import { BrandLogo } from './BrandLogo.js';
import { GlassPanel } from './ui/GlassPanel.js';
import { PageLoader } from './ui/PageLoader.js';

type GateState = 'loading' | 'ready' | 'promo' | 'auth' | 'error';

export function PromoAccessGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>('loading');
  const [detail, setDetail] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setState('loading');
      try {
        const status = await fetchAccessStatus();
        if (cancelled) {
          return;
        }
        if (typeof status?.admitted !== 'boolean') {
          setDetail('Сервер вернул неожиданный ответ.');
          setState('error');
          return;
        }
        setState(status.admitted ? 'ready' : 'promo');
      } catch (error) {
        if (cancelled) {
          return;
        }
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          setState('auth');
          return;
        }
        setDetail(getApiErrorMessage(error, 'Не удалось проверить доступ.'));
        setState('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (state === 'ready') {
    return children;
  }

  return (
    <div className="relative flex min-h-full flex-col text-sage-100">
      <div className="app-bg" aria-hidden />
      <main className="flex flex-1 items-center px-4 py-10">
        <GlassPanel className="mx-auto w-full max-w-md px-5 py-6" strong>
          {state === 'loading' ? <PageLoader label="Проверяем доступ…" /> : null}

          {state === 'promo' ? (
            <GateCopy
              title="Нужен промокод"
              body="Первый вход открывается в личном чате с ботом: отправьте код туда одним сообщением. Бот удалит это сообщение. Не вставляйте код в ссылку и не вводите его здесь."
              actionLabel={window.Telegram?.WebApp?.initData ? 'Вернуться в чат' : undefined}
              onAction={() => window.Telegram?.WebApp?.close()}
            />
          ) : null}

          {state === 'auth' ? (
            <GateCopy
              title="Откройте Dimetra из Telegram"
              body="Приложение проверяет вход через Telegram. Запустите его из чата с ботом."
            />
          ) : null}

          {state === 'error' ? (
            <GateCopy
              title="Не удалось проверить доступ"
              body={detail}
              actionLabel="Повторить"
              onAction={() => setAttempt((value) => value + 1)}
            />
          ) : null}
        </GlassPanel>
      </main>
    </div>
  );
}

function GateCopy({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <BrandLogo />
      <h1 className="font-serif text-2xl text-sage-100">{title}</h1>
      <p className="text-sm leading-relaxed text-sage-300/90">{body}</p>
      {actionLabel && onAction ? (
        <button type="button" className="btn-primary w-full rounded-full py-3.5 text-sm font-semibold" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
