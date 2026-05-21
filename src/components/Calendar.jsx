import { useApp } from '../context/AppContext';
import { generateDateOptions } from '../utils/helpers';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Calendar({ selected, onSelect }) {
  const { darkMode } = useApp();
  const dates = generateDateOptions(7);

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
      {dates.map((d, i) => {
        const isSelected = selected === d.value;
        return (
          <button
            key={d.value}
            onClick={() => onSelect(d.value)}
            className={`flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-2xl transition-all duration-200 min-w-[72px] ${
              isSelected
                ? `bg-gradient-to-b from-turf-400 to-turf-600 text-white shadow-lg shadow-turf-200`
                : darkMode
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-white text-gray-600 hover:bg-turf-50 border border-gray-100'
            }`}
          >
            <span className={`text-[10px] uppercase font-bold ${
              isSelected ? 'text-white/80' : darkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {d.dayName.slice(0, 3)}
            </span>
            <span className={`text-xl font-bold mt-0.5 ${isSelected ? 'text-white' : ''}`}>
              {d.dayNum}
            </span>
            <span className={`text-[10px] ${
              isSelected ? 'text-white/80' : darkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {d.month}
            </span>
          </button>
        );
      })}
    </div>
  );
}
