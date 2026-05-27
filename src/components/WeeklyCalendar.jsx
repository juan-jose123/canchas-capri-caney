import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Eye, Lock } from 'lucide-react';

const HOURS = [];
for (let h = 6; h < 23; h++) HOURS.push(h);

const COURT_COLORS = {
  Capri: {
    light: 'bg-turf-500',
    bgLight: 'bg-turf-100',
    border: 'border-turf-400',
    text: 'text-white',
    textDark: 'text-turf-700'
  },
  Caney: {
    light: 'bg-field-600',
    bgLight: 'bg-field-100',
    border: 'border-field-500',
    text: 'text-white',
    textDark: 'text-field-700'
  }
};

export default function WeeklyCalendar() {
  const { darkMode } = useApp();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [courtFilter, setCourtFilter] = useState('all'); // all | Capri | Caney
  const [hoveredEvent, setHoveredEvent] = useState(null);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const start = format(weekStart, 'yyyy-MM-dd');
      const end = format(addDays(weekStart, 7), 'yyyy-MM-dd');
      const res = await fetch(`/api/calendar/public-events?start=${start}&end=${end}`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    if (courtFilter === 'all') return events;
    return events.filter(e => e.court === courtFilter);
  }, [events, courtFilter]);

  const getEventsForDayHour = (day, hour) => {
    return filteredEvents.filter(ev => {
      const start = parseISO(ev.start);
      const end = parseISO(ev.end);
      // Event covers this hour on this day
      return isSameDay(start, day) && start.getHours() <= hour && end.getHours() > hour;
    });
  };

  const isEventStart = (ev, day, hour) => {
    const start = parseISO(ev.start);
    return isSameDay(start, day) && start.getHours() === hour;
  };

  const getEventDuration = (ev) => {
    const start = parseISO(ev.start);
    const end = parseISO(ev.end);
    return Math.max(1, Math.round((end - start) / (1000 * 60 * 60)));
  };

  return (
    <div className={`rounded-3xl border-2 overflow-hidden ${
      darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-turf-100 shadow-lg shadow-turf-50/50'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye size={18} className="text-turf-500" />
            <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Agenda semanal
            </h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500'
            }`}>
              <Lock size={10} /> Solo lectura
            </span>
          </div>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
              darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-turf-100 text-turf-700 hover:bg-turf-200'
            }`}
          >
            Hoy
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeekStart(prev => subWeeks(prev, 1))}
              className={`p-2 rounded-lg transition-all ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            <span className={`text-sm font-bold px-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {format(weekStart, "d MMM", { locale: es })} - {format(addDays(weekStart, 6), "d MMM yyyy", { locale: es })}
            </span>
            <button
              onClick={() => setWeekStart(prev => addWeeks(prev, 1))}
              className={`p-2 rounded-lg transition-all ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Court Filter */}
          <div className="flex gap-1">
            {['all', 'Capri', 'Caney'].map(c => (
              <button
                key={c}
                onClick={() => setCourtFilter(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  courtFilter === c
                    ? c === 'Capri' ? 'bg-turf-500 text-white' : c === 'Caney' ? 'bg-field-600 text-white' : 'bg-gray-700 text-white'
                    : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {c === 'all' ? 'Ambas' : c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Days header */}
          <div className={`grid grid-cols-[60px_repeat(7,1fr)] border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className={`p-2 text-[10px] font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Hora
            </div>
            {days.map(day => {
              const today = isToday(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`p-2 text-center border-l ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}
                >
                  <div className={`text-[10px] uppercase font-bold ${
                    today ? 'text-turf-500' : darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {format(day, 'EEE', { locale: es })}
                  </div>
                  <div className={`text-lg font-bold mt-0.5 ${
                    today
                      ? 'text-white bg-turf-500 rounded-full w-8 h-8 inline-flex items-center justify-center'
                      : darkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hours grid */}
          {HOURS.map(hour => (
            <div
              key={hour}
              className={`grid grid-cols-[60px_repeat(7,1fr)] border-b ${darkMode ? 'border-gray-800' : 'border-gray-50'}`}
              style={{ minHeight: '50px' }}
            >
              <div className={`p-2 text-[10px] font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {String(hour).padStart(2, '0')}:00
              </div>
              {days.map(day => {
                const cellEvents = getEventsForDayHour(day, hour);
                const startingEvents = cellEvents.filter(ev => isEventStart(ev, day, hour));

                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className={`relative border-l ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}
                  >
                    {startingEvents.map((ev, idx) => {
                      const duration = getEventDuration(ev);
                      const colors = COURT_COLORS[ev.court] || COURT_COLORS.Capri;
                      const widthPercent = startingEvents.length > 1 ? 100 / startingEvents.length : 100;
                      return (
                        <div
                          key={ev.id}
                          onMouseEnter={() => setHoveredEvent(ev.id)}
                          onMouseLeave={() => setHoveredEvent(null)}
                          className={`absolute z-10 ${colors.light} ${colors.text} rounded-md p-1.5 text-[10px] font-bold overflow-hidden border-l-2 ${colors.border} cursor-default transition-all hover:shadow-lg hover:z-20`}
                          style={{
                            top: '2px',
                            left: `${idx * widthPercent}%`,
                            width: `calc(${widthPercent}% - 4px)`,
                            height: `calc(${duration * 50}px - 4px)`,
                            opacity: hoveredEvent && hoveredEvent !== ev.id ? 0.6 : 1
                          }}
                        >
                          <div className="truncate leading-tight">{ev.title}</div>
                          <div className="text-[9px] opacity-90 mt-0.5">
                            {format(parseISO(ev.start), 'HH:mm')} - {format(parseISO(ev.end), 'HH:mm')}
                          </div>
                          <div className="text-[9px] opacity-80 font-normal mt-0.5">{ev.court}</div>
                        </div>
                      );
                    })}
                    {cellEvents.length === 0 && (
                      <div className={`absolute inset-1 rounded-md ${
                        darkMode ? 'bg-gray-900/30' : 'bg-turf-50/40'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Footer legend */}
      <div className={`p-3 border-t flex flex-wrap items-center justify-between gap-3 text-[11px] ${
        darkMode ? 'border-gray-700 text-gray-400 bg-gray-900/50' : 'border-gray-100 text-gray-500 bg-gray-50/50'
      }`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-turf-500" />
            <span>Capri</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-field-600" />
            <span>Caney</span>
          </div>
        </div>
        {loading && <span>Cargando...</span>}
        <span className="text-[10px]">Vista de solo lectura. Para reservar, regresa a la pestaña principal.</span>
      </div>
    </div>
  );
}
