import { useApp } from '../context/AppContext';
import { CheckCircle, AlertCircle, Clock, X } from 'lucide-react';

export default function Notifications() {
  const { notifications, darkMode } = useApp();

  if (notifications.length === 0) return null;

  const icons = {
    success: <CheckCircle size={20} className="text-turf-500" />,
    error: <AlertCircle size={20} className="text-danger-500" />,
    warning: <Clock size={20} className="text-energy-500" />
  };

  const styles = {
    success: darkMode ? 'bg-turf-900/80 border-turf-600' : 'bg-turf-50 border-turf-300',
    error: darkMode ? 'bg-danger-50/10 border-danger-400' : 'bg-danger-50 border-danger-300',
    warning: darkMode ? 'bg-energy-50/10 border-energy-400' : 'bg-energy-50 border-energy-300'
  };

  return (
    <div className="fixed bottom-20 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {notifications.map(n => (
        <div
          key={n.id}
          className={`animate-slide-in flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg backdrop-blur-sm ${styles[n.type]}`}
        >
          {icons[n.type]}
          <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {n.message}
          </span>
        </div>
      ))}
    </div>
  );
}
