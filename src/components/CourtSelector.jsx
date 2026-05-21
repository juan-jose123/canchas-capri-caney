import { useApp } from '../context/AppContext';

export default function CourtSelector({ selected, onSelect }) {
  const { darkMode } = useApp();
  const courts = [
    { id: 'Capri', emoji: '🏟️', color: 'from-turf-400 to-turf-600' },
    { id: 'Caney', emoji: '⚽', color: 'from-field-400 to-field-600' }
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {courts.map(court => {
        const isSelected = selected === court.id;
        return (
          <button
            key={court.id}
            onClick={() => onSelect(court.id)}
            className={`relative p-5 rounded-2xl border-2 transition-all duration-200 text-center ${
              isSelected
                ? `border-turf-400 shadow-lg shadow-turf-100 ${darkMode ? 'bg-turf-900/40' : 'bg-turf-50'}`
                : darkMode 
                  ? 'border-gray-700 bg-gray-800 hover:border-gray-600' 
                  : 'border-gray-200 bg-white hover:border-turf-200 hover:shadow-md'
            }`}
          >
            {isSelected && (
              <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-turf-400 animate-pulse-dot" />
            )}
            <div className="text-3xl mb-2">{court.emoji}</div>
            <div className={`font-bold text-lg ${
              isSelected 
                ? 'text-turf-600' 
                : darkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              {court.id}
            </div>
            <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Cancha sintética
            </div>
          </button>
        );
      })}
    </div>
  );
}
