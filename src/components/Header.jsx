import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Sun, Moon, Shield, Home } from 'lucide-react';

export default function Header() {
  const { darkMode, setDarkMode, isAdmin } = useApp();
  const location = useLocation();

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
      darkMode 
        ? 'bg-gray-900/90 border-gray-700' 
        : 'bg-white/90 border-turf-100'
    }`}>
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-turf-400 to-turf-600 flex items-center justify-center shadow-lg shadow-turf-200">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 2C12 2 14.5 6 14.5 12S12 22 12 22M12 2C12 2 9.5 6 9.5 12S12 22 12 22M2 12h20" fill="none" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </div>
          <div>
            <h1 className={`text-lg font-bold leading-tight ${darkMode ? 'text-white' : 'text-turf-800'}`}>
              Capri & Caney
            </h1>
            <p className={`text-xs leading-tight ${darkMode ? 'text-gray-400' : 'text-turf-600'}`}>
              Canchas Sintéticas
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {location.pathname !== '/' && (
            <Link 
              to="/"
              className={`p-2.5 rounded-xl transition-all ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-300' 
                  : 'hover:bg-turf-50 text-turf-700'
              }`}
            >
              <Home size={20} />
            </Link>
          )}

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2.5 rounded-xl transition-all ${
              darkMode 
                ? 'hover:bg-gray-700 text-yellow-400' 
                : 'hover:bg-turf-50 text-turf-700'
            }`}
            aria-label="Cambiar tema"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <Link
            to={isAdmin ? '/admin' : '/login'}
            className={`p-2.5 rounded-xl transition-all ${
              isAdmin
                ? 'bg-turf-500 text-white hover:bg-turf-600'
                : darkMode 
                  ? 'hover:bg-gray-700 text-gray-300' 
                  : 'hover:bg-turf-50 text-turf-700'
            }`}
            aria-label="Panel admin"
          >
            <Shield size={20} />
          </Link>
        </div>
      </div>
    </header>
  );
}
