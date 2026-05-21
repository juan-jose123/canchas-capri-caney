import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Lock, LogIn, Loader2 } from 'lucide-react';

export default function Login() {
  const { darkMode, login, addNotification, isAdmin } = useApp();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // If already admin, redirect
  if (isAdmin) {
    navigate('/admin');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;
    
    setLoading(true);
    const success = await login(password);
    setLoading(false);

    if (success) {
      addNotification('Sesión iniciada', 'success');
      navigate('/admin');
    } else {
      addNotification('Contraseña incorrecta', 'error');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className={`w-full max-w-sm p-8 rounded-3xl border-2 animate-fade-in ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-turf-100 shadow-2xl shadow-turf-50'
      }`}>
        <div className="text-center mb-8">
          <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
            darkMode ? 'bg-turf-900' : 'bg-turf-100'
          }`}>
            <Lock size={28} className="text-turf-500" />
          </div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Panel Admin
          </h2>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Ingresa la contraseña de administrador
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Contraseña"
            className={`w-full px-4 py-4 rounded-xl border-2 text-base font-medium text-center tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-turf-300 ${
              darkMode 
                ? 'bg-gray-900 border-gray-600 text-white placeholder:text-gray-500' 
                : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-turf-400'
            }`}
            autoFocus
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-base bg-gradient-to-r from-turf-500 to-turf-600 text-white hover:from-turf-600 hover:to-turf-700 transition-all shadow-lg shadow-turf-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <LogIn size={18} />
                Entrar
              </>
            )}
          </button>
        </form>

        <p className={`text-xs text-center mt-6 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Contraseña por defecto: admin123
        </p>
      </div>
    </div>
  );
}
