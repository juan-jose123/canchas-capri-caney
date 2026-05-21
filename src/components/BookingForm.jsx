import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DURATIONS, PRICE_PER_HOUR } from '../utils/constants';
import { formatCurrency } from '../utils/helpers';
import { User, Phone, Clock, Tag, CreditCard, Loader2 } from 'lucide-react';

export default function BookingForm({ court, date, startHour, onSuccess, onCancel }) {
  const { darkMode, addNotification } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [duration, setDuration] = useState(1);
  const [vipCode, setVipCode] = useState('');
  const [loading, setLoading] = useState(false);

  const totalPrice = duration * PRICE_PER_HOUR;
  const advanceAmount = Math.round(totalPrice * 0.3);
  const remaining = totalPrice - advanceAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      addNotification('Completa todos los campos', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          court,
          date,
          startHour,
          duration,
          vipCode: vipCode.trim() || undefined,
          advance: advanceAmount
        })
      });

      const data = await res.json();
      if (data.success) {
        addNotification('Reserva realizada correctamente', 'success');
        onSuccess(data.reservation);
      } else {
        addNotification(data.message || 'Horario no disponible', 'error');
      }
    } catch {
      addNotification('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full px-4 py-3.5 rounded-xl border-2 text-base font-medium transition-all focus:outline-none focus:ring-2 focus:ring-turf-300 ${
    darkMode 
      ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-turf-500' 
      : 'bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-turf-400'
  }`;

  return (
    <form onSubmit={handleSubmit} className={`animate-fade-in p-6 rounded-3xl border-2 ${
      darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-turf-100 shadow-xl shadow-turf-50'
    }`}>
      <div className="flex items-center justify-between mb-5">
        <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Reservar {court}
        </h3>
        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
          darkMode ? 'bg-turf-900 text-turf-300' : 'bg-turf-100 text-turf-700'
        }`}>
          {String(startHour).padStart(2, '0')}:00
        </span>
      </div>

      <div className="space-y-3">
        {/* Name */}
        <div className="relative">
          <User size={18} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tu nombre"
            className={`${inputClass} pl-11`}
            required
          />
        </div>

        {/* Phone */}
        <div className="relative">
          <Phone size={18} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="Número de contacto"
            className={`${inputClass} pl-11`}
            required
          />
        </div>

        {/* Duration */}
        <div>
          <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <Clock size={14} className="inline mr-1" />
            Tiempo de juego
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DURATIONS.map(d => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDuration(d.value)}
                className={`py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
                  duration === d.value
                    ? 'bg-turf-500 text-white shadow-md'
                    : darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-turf-50'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* VIP Code */}
        <div className="relative">
          <Tag size={18} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            value={vipCode}
            onChange={e => setVipCode(e.target.value.toUpperCase())}
            placeholder="Código VIP (opcional)"
            className={`${inputClass} pl-11`}
          />
        </div>

        {/* Price summary */}
        <div className={`p-4 rounded-2xl space-y-2 ${darkMode ? 'bg-gray-900' : 'bg-turf-50'}`}>
          <div className="flex justify-between items-center">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total</span>
            <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {formatCurrency(totalPrice)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <CreditCard size={14} className="inline mr-1" />
              Anticipo (30%)
            </span>
            <span className={`text-base font-bold text-turf-600`}>
              {formatCurrency(advanceAmount)}
            </span>
          </div>
          <div className={`flex justify-between items-center pt-2 border-t ${darkMode ? 'border-gray-700' : 'border-turf-200'}`}>
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Resta por pagar</span>
            <span className={`text-sm font-semibold ${darkMode ? 'text-energy-400' : 'text-energy-600'}`}>
              {formatCurrency(remaining)}
            </span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-5">
        <button
          type="button"
          onClick={onCancel}
          className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all ${
            darkMode 
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-[2] py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-turf-500 to-turf-600 text-white hover:from-turf-600 hover:to-turf-700 transition-all shadow-lg shadow-turf-200 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            'Confirmar Reserva'
          )}
        </button>
      </div>
    </form>
  );
}
