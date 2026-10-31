import { Bell, Home, Lock } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchSettings, updateNotificationTime } from '../api/index.js';
import { RoomsSettingsPanel } from '../components/settings/RoomsSettingsPanel.js';
import { GlassPanel } from '../components/ui/GlassPanel.js';
import { PageLoader } from '../components/ui/PageLoader.js';
import {
  inputValueToNotificationTime,
  notificationTimeToInputValue,
} from '../lib/dates.js';
import { getApiErrorMessage } from '../lib/apiError.js';
import { getTelegramWebApp, showTelegramAlert, showTelegramPopup } from '../lib/telegramUi.js';

type SettingsSection = 'notifications' | 'rooms';

export function SettingsPage() {
  const location = useLocation();
  const initialSection =
    (location.state as { section?: SettingsSection } | null)?.section === 'rooms'
      ? 'rooms'
      : 'notifications';
  const [section, setSection] = useState<SettingsSection>(initialSection);
  const [loading, setLoading] = useState(true);
  const [timeValue, setTimeValue] = useState('09:00');
  const [initialTimeValue, setInitialTimeValue] = useState('09:00');
  const [saving, setSaving] = useState(false);

  const saveHandlerRef = useRef<() => void>(() => undefined);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const settings = await fetchSettings();
      const inputValue = notificationTimeToInputValue(settings.notification_time);
      setTimeValue(inputValue);
      setInitialTimeValue(inputValue);
    } catch (error) {
      showTelegramAlert(getApiErrorMessage(error, 'Не удалось загрузить настройки'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const saveSettings = useCallback(async () => {
    if (saving) return;

    setSaving(true);
    const webApp = getTelegramWebApp();
    webApp?.MainButton.showProgress();

    try {
      const notificationTime = inputValueToNotificationTime(timeValue);
      await updateNotificationTime(notificationTime);
      setInitialTimeValue(timeValue);
      showTelegramPopup('Время уведомлений сохранено', 'Готово');
    } catch (error) {
      showTelegramAlert(getApiErrorMessage(error, 'Не удалось сохранить настройки'));
    } finally {
      setSaving(false);
      webApp?.MainButton.hideProgress();
    }
  }, [saving, timeValue]);

  saveHandlerRef.current = () => {
    void saveSettings();
  };

  const hasChanges = timeValue !== initialTimeValue;

  useEffect(() => {
    const webApp = getTelegramWebApp();
    if (!webApp || section !== 'notifications') {
      webApp?.MainButton.hide();
      return;
    }

    const mainButton = webApp.MainButton;
    const onClick = () => saveHandlerRef.current();

    if (hasChanges && !loading) {
      mainButton.setText('Сохранить');
      mainButton.onClick(onClick);
      mainButton.show();
      mainButton.enable();
    } else {
      mainButton.offClick(onClick);
      mainButton.hide();
    }

    return () => {
      mainButton.offClick(onClick);
      mainButton.hide();
    };
  }, [hasChanges, loading, section]);

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl text-sage-100">Настройки</h2>
        <p className="text-sm text-sage-400/90">Уведомления и комнаты</p>
      </div>

      <div className="flex rounded-2xl bg-black/20 p-1">
        <SectionTab
          active={section === 'notifications'}
          label="Уведомления"
          icon={Bell}
          onClick={() => setSection('notifications')}
        />
        <SectionTab
          active={section === 'rooms'}
          label="Комнаты"
          icon={Home}
          onClick={() => setSection('rooms')}
        />
      </div>

      {section === 'notifications' ? (
        loading ? (
          <PageLoader label="Загружаем настройки…" />
        ) : (
          <>
            <GlassPanel strong className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage-400/15 ring-1 ring-white/10">
                  <Bell className="h-5 w-5 text-sage-300" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="font-medium text-sage-100">Время уведомлений</p>
                  <p className="text-xs text-sage-400/80">Формат на сервере: HH:MM:SS</p>
                </div>
              </div>

              <input
                type="time"
                value={timeValue}
                onChange={(event) => setTimeValue(event.target.value)}
                className="input-glass w-full rounded-2xl px-4 py-3 text-lg"
              />

              <p className="text-xs text-sage-400/75">
                Сейчас будет отправлено: {inputValueToNotificationTime(timeValue)}
              </p>
            </GlassPanel>

            {!getTelegramWebApp() ? (
              <button
                type="button"
                disabled={!hasChanges || saving}
                onClick={() => void saveSettings()}
                className="btn-primary w-full rounded-full py-3.5 text-sm font-semibold disabled:opacity-60"
              >
                {saving ? 'Сохраняем…' : 'Сохранить'}
              </button>
            ) : (
              <p className="text-center text-xs text-sage-400/75">
                Измените время — появится кнопка Telegram «Сохранить».
              </p>
            )}
          </>
        )
      ) : (
        <RoomsSettingsPanel />
      )}

      <p className="flex items-center justify-center gap-1 text-[10px] text-sage-500/80">
        <Lock className="h-3 w-3" />
        Данные привязаны к вашему Telegram-аккаунту
      </p>
    </section>
  );
}

function SectionTab({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: typeof Bell;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors',
        active ? 'bg-sage-400/25 text-sage-100' : 'text-sage-400/90 hover:text-sage-200',
      ].join(' ')}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
      {label}
    </button>
  );
}
