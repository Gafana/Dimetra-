import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchCalendarEvents, type CalendarEvent } from '../api/index.js';
import { CalendarDayDetail } from '../components/calendar/CalendarDayDetail.js';
import { CalendarMonthView } from '../components/calendar/CalendarMonthView.js';
import { CalendarWeekView } from '../components/calendar/CalendarWeekView.js';
import { SkeletonBlock } from '../components/ui/SkeletonBlock.js';
import {
  buildMonthGrid,
  formatMonthTitle,
  formatWeekTitle,
  getWeekRange,
  shiftAnchor,
  startOfWeekMonday,
  type CalendarViewMode,
} from '../lib/calendar.js';
import { getApiErrorMessage } from '../lib/apiError.js';
import { todayIsoDate } from '../lib/dates.js';
import { showTelegramAlert } from '../lib/telegramUi.js';

export function CalendarPage() {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [anchorDate, setAnchorDate] = useState(todayIsoDate);
  const [selectedDate, setSelectedDate] = useState(todayIsoDate);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => {
    if (viewMode === 'month') {
      return buildMonthGrid(anchorDate);
    }
    const week = getWeekRange(anchorDate);
    return { weeks: [week.days], from: week.from, to: week.to };
  }, [anchorDate, viewMode]);

  const weekDays = viewMode === 'week' ? getWeekRange(anchorDate).days : null;

  const title =
    viewMode === 'month'
      ? formatMonthTitle(anchorDate)
      : formatWeekTitle(startOfWeekMonday(anchorDate));

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCalendarEvents(range.from, range.to);
      setEvents(data);
    } catch (error) {
      showTelegramAlert(getApiErrorMessage(error, 'Не удалось загрузить календарь'));
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const selectedEvents = useMemo(
    () => events.filter((e) => e.date === selectedDate),
    [events, selectedDate],
  );

  return (
    <section className="space-y-4">
      <div className="glass flex flex-wrap items-center gap-2 rounded-2xl p-2">
        <div className="flex items-center gap-1">
          <IconNavButton
            label="Назад"
            onClick={() => setAnchorDate((d) => shiftAnchor(d, viewMode, -1))}
          >
            <ChevronLeft className="h-5 w-5" />
          </IconNavButton>
          <IconNavButton
            label="Вперёд"
            onClick={() => setAnchorDate((d) => shiftAnchor(d, viewMode, 1))}
          >
            <ChevronRight className="h-5 w-5" />
          </IconNavButton>
        </div>

        <h2 className="min-w-0 flex-1 px-1 font-serif text-lg leading-tight text-sage-100">{title}</h2>

        <button
          type="button"
          className="rounded-xl px-3 py-1.5 text-xs font-medium text-sage-300/90 hover:bg-white/5"
          onClick={() => {
            const today = todayIsoDate();
            setAnchorDate(today);
            setSelectedDate(today);
          }}
        >
          Сегодня
        </button>

        <div className="flex rounded-xl bg-black/20 p-0.5">
          <ViewToggle
            active={viewMode === 'month'}
            label="Месяц"
            onClick={() => setViewMode('month')}
          />
          <ViewToggle
            active={viewMode === 'week'}
            label="Неделя"
            onClick={() => setViewMode('week')}
          />
        </div>
      </div>

      {loading ? (
        <SkeletonBlock className="h-[22rem]" />
      ) : viewMode === 'month' ? (
        <CalendarMonthView
          weeks={range.weeks}
          anchorIso={anchorDate}
          events={events}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      ) : weekDays ? (
        <CalendarWeekView
          days={weekDays}
          events={events}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      ) : null}

      <CalendarDayDetail date={selectedDate} events={selectedEvents} />
    </section>
  );
}

function IconNavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-xl text-sage-200 hover:bg-white/8"
    >
      {children}
    </button>
  );
}

function ViewToggle({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
        active ? 'bg-sage-400/25 text-sage-100' : 'text-sage-400/90 hover:text-sage-200',
      ].join(' ')}
    >
      {label}
    </button>
  );
}
