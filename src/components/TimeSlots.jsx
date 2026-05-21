import { useApp } from '../context/AppContext';
import { TIME_SLOTS, STATUS_COLORS } from '../utils/constants';
import { getSlotStatus } from '../utils/helpers';
import { Clock, User } from 'lucide-react';

export default function TimeSlots({ reservations, court, date, onSelectSlot, selectedSlot }) {
  const { darkMode } = useApp();

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(STATUS_COLORS).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${val.bg} border ${val.border}`} />
            <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {val.label}
            </span>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {TIME_SLOTS.map(slot => {
          const status = getSlotStatus(slot.hour, reservations, court);
          const colors = STATUS_COLORS[status];
          const isSelected = selectedSlot === slot.hour;
          const isAvailable = status === 'available';
          
          // Find reservation info for this slot
          const reservation = reservations.find(r =>
            r.court === court &&
            r.status !== 'cancelled' &&
            slot.hour >= r.startHour &&
            slot.hour < r.startHour + r.duration
          );

          return (
            <button
              key={slot.hour}
              onClick={() => isAvailable && onSelectSlot(slot.hour)}
              disabled={!isAvailable}
              className={`relative p-3 rounded-xl border-2 transition-all duration-200 text-center ${
                isSelected
                  ? 'border-turf-400 bg-turf-50 shadow-md scale-105 ring-2 ring-turf-200'
                  : isAvailable
                    ? darkMode
                      ? 'border-gray-700 bg-gray-800 hover:border-turf-500 hover:bg-gray-750'
                      : `${colors.bg} ${colors.border} hover:shadow-md hover:scale-[1.02]`
                    : darkMode
                      ? status === 'in_play'
                        ? 'border-red-800 bg-red-900/30'
                        : 'border-yellow-800/50 bg-yellow-900/20'
                      : `${colors.bg} ${colors.border} opacity-80`
              } ${!isAvailable ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {status === 'in_play' && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse-dot" />
              )}
              <div className={`text-sm font-bold ${
                isSelected ? 'text-turf-700' : 
                isAvailable 
                  ? darkMode ? 'text-gray-200' : colors.text
                  : darkMode ? 'text-gray-400' : colors.text
              }`}>
                {slot.label}
              </div>
              <div className={`text-[10px] mt-0.5 ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {slot.labelEnd}
              </div>
              {reservation && (
                <div className={`text-[9px] mt-1 truncate ${
                  darkMode ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  {reservation.name}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
