import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/helpers';
import { format } from 'date-fns';
import {
  Calendar, BarChart3, Key, Tag, LogOut, X, Check, Trash2,
  DollarSign, Users, TrendingUp, Percent, Plus, Power
} from 'lucide-react';

export default function Admin() {
  const { darkMode, isAdmin, logout, addNotification } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('reservations');
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState(null);
  const [vipCodes, setVipCodes] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [newCode, setNewCode] = useState('');
  const [promoForm, setPromoForm] = useState({ name: '', discountPercent: 10, expiresAt: '' });
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (!isAdmin) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isAdmin, navigate, selectedDate]);

  const loadData = async () => {
    try {
      const [resRes, statsRes, codesRes, promosRes] = await Promise.all([
        fetch('/api/reservations/all'),
        fetch(`/api/stats/daily?date=${selectedDate}`),
        fetch('/api/vip-codes'),
        fetch('/api/promotions')
      ]);
      setReservations(await resRes.json());
      setStats(await statsRes.json());
      setVipCodes(await codesRes.json());
      setPromotions(await promosRes.json());
    } catch {
      addNotification('Error cargando datos', 'error');
    }
  };

  const cancelReservation = async (id) => {
    await fetch(`/api/reservations/${id}/cancel`, { method: 'PUT' });
    addNotification('Reserva cancelada', 'success');
    loadData();
  };

  const confirmPayment = async (id) => {
    await fetch(`/api/reservations/${id}/confirm-payment`, { method: 'PUT' });
    addNotification('Pago confirmado', 'success');
    loadData();
  };

  const addVipCode = async () => {
    if (!newCode.trim()) return;
    const res = await fetch('/api/vip-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: newCode.trim().toUpperCase() })
    });
    const data = await res.json();
    if (res.ok) {
      addNotification('Código VIP creado', 'success');
      setNewCode('');
      loadData();
    } else {
      addNotification(data.message, 'error');
    }
  };

  const toggleVipCode = async (code) => {
    await fetch(`/api/vip-codes/${code}/toggle`, { method: 'PUT' });
    loadData();
  };

  const deleteVipCode = async (code) => {
    await fetch(`/api/vip-codes/${code}`, { method: 'DELETE' });
    addNotification('Código eliminado', 'success');
    loadData();
  };

  const addPromotion = async () => {
    if (!promoForm.name || !promoForm.expiresAt) return;
    await fetch('/api/promotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promoForm)
    });
    addNotification('Promoción creada', 'success');
    setPromoForm({ name: '', discountPercent: 10, expiresAt: '' });
    loadData();
  };

  const togglePromo = async (id) => {
    await fetch(`/api/promotions/${id}/toggle`, { method: 'PUT' });
    loadData();
  };

  const deletePromo = async (id) => {
    await fetch(`/api/promotions/${id}`, { method: 'DELETE' });
    addNotification('Promoción eliminada', 'success');
    loadData();
  };

  const tabs = [
    { id: 'reservations', label: 'Reservas', icon: Calendar },
    { id: 'stats', label: 'Historial', icon: BarChart3 },
    { id: 'vip', label: 'Códigos VIP', icon: Key },
    { id: 'promos', label: 'Promos', icon: Tag }
  ];

  const cardClass = `rounded-2xl border p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`;

  if (!isAdmin) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Panel Admin
        </h2>
        <button
          onClick={() => { logout(); navigate('/'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <LogOut size={16} />
          Salir
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                tab === t.id
                  ? 'bg-turf-500 text-white shadow-md'
                  : darkMode
                    ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* RESERVATIONS TAB */}
      {tab === 'reservations' && (
        <div className="space-y-3">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className={`px-4 py-2 rounded-xl border text-sm font-medium ${
              darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'
            }`}
          />
          {reservations
            .filter(r => r.date === selectedDate)
            .sort((a, b) => a.startHour - b.startHour)
            .map(r => (
              <div key={r.id} className={`${cardClass} flex flex-col sm:flex-row sm:items-center gap-3`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{r.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.status === 'cancelled'
                        ? 'bg-danger-100 text-danger-600'
                        : r.isVip
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-turf-100 text-turf-700'
                    }`}>
                      {r.status === 'cancelled' ? 'Cancelada' : r.isVip ? 'VIP' : 'Activa'}
                    </span>
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {r.court} | {String(r.startHour).padStart(2,'0')}:00 - {String(r.startHour + r.duration).padStart(2,'0')}:00 | {r.phone}
                  </div>
                  <div className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Total: {formatCurrency(r.totalPrice)} | Anticipo: {formatCurrency(r.advance)} | Resta: {formatCurrency(r.remaining)}
                  </div>
                </div>
                {r.status !== 'cancelled' && (
                  <div className="flex gap-2 flex-shrink-0">
                    {!r.paymentConfirmed && (
                      <button
                        onClick={() => confirmPayment(r.id)}
                        className="p-2 rounded-lg bg-turf-100 text-turf-700 hover:bg-turf-200 transition-all"
                        title="Confirmar pago"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => cancelReservation(r.id)}
                      className="p-2 rounded-lg bg-danger-100 text-danger-600 hover:bg-danger-100 transition-all"
                      title="Cancelar reserva"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          {reservations.filter(r => r.date === selectedDate).length === 0 && (
            <div className={`text-center py-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              No hay reservas para esta fecha
            </div>
          )}
        </div>
      )}

      {/* STATS TAB */}
      {tab === 'stats' && stats && (
        <div className="space-y-4">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className={`px-4 py-2 rounded-xl border text-sm font-medium ${
              darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'
            }`}
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={cardClass}>
              <Users size={20} className="text-turf-500 mb-2" />
              <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {stats.totalReservations}
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Reservas</div>
            </div>
            <div className={cardClass}>
              <DollarSign size={20} className="text-turf-500 mb-2" />
              <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {formatCurrency(stats.totalAdvance)}
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Recibido</div>
            </div>
            <div className={cardClass}>
              <TrendingUp size={20} className="text-energy-500 mb-2" />
              <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {formatCurrency(stats.totalRemaining)}
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pendiente</div>
            </div>
            <div className={cardClass}>
              <BarChart3 size={20} className="text-field-500 mb-2" />
              <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {stats.mostUsedCourt}
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Más usada</div>
            </div>
          </div>
        </div>
      )}

      {/* VIP CODES TAB */}
      {tab === 'vip' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newCode}
              onChange={e => setNewCode(e.target.value.toUpperCase())}
              placeholder="Nuevo código VIP"
              className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium ${
                darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'
              }`}
            />
            <button
              onClick={addVipCode}
              className="px-4 py-3 rounded-xl bg-turf-500 text-white font-bold text-sm hover:bg-turf-600 transition-all flex items-center gap-1"
            >
              <Plus size={16} /> Crear
            </button>
          </div>
          <div className="space-y-2">
            {vipCodes.map(c => (
              <div key={c.code} className={`${cardClass} flex items-center justify-between`}>
                <div>
                  <span className={`font-mono font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {c.code}
                  </span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    c.active ? 'bg-turf-100 text-turf-700' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {c.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleVipCode(c.code)}
                    className={`p-2 rounded-lg transition-all ${
                      c.active ? 'bg-energy-100 text-energy-700' : 'bg-turf-100 text-turf-700'
                    }`}
                    title={c.active ? 'Desactivar' : 'Activar'}
                  >
                    <Power size={14} />
                  </button>
                  <button
                    onClick={() => deleteVipCode(c.code)}
                    className="p-2 rounded-lg bg-danger-100 text-danger-600 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROMOTIONS TAB */}
      {tab === 'promos' && (
        <div className="space-y-4">
          <div className={`${cardClass} space-y-3`}>
            <h4 className={`font-bold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Nueva promoción
            </h4>
            <input
              type="text"
              value={promoForm.name}
              onChange={e => setPromoForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Nombre (ej: Descuento de semana)"
              className={`w-full px-4 py-3 rounded-xl border text-sm ${
                darkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
              }`}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Descuento (%)
                </label>
                <input
                  type="number"
                  value={promoForm.discountPercent}
                  onChange={e => setPromoForm(p => ({ ...p, discountPercent: Number(e.target.value) }))}
                  className={`w-full px-3 py-2 rounded-lg border text-sm mt-1 ${
                    darkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
                  }`}
                  min="1"
                  max="100"
                />
              </div>
              <div>
                <label className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Vence
                </label>
                <input
                  type="date"
                  value={promoForm.expiresAt}
                  onChange={e => setPromoForm(p => ({ ...p, expiresAt: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border text-sm mt-1 ${
                    darkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
                  }`}
                />
              </div>
            </div>
            <button
              onClick={addPromotion}
              className="px-4 py-2.5 rounded-xl bg-turf-500 text-white font-bold text-sm hover:bg-turf-600 transition-all"
            >
              Crear promoción
            </button>
          </div>

          <div className="space-y-2">
            {promotions.map(p => (
              <div key={p.id} className={`${cardClass} flex items-center justify-between`}>
                <div>
                  <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {p.name}
                  </span>
                  <span className="ml-2 text-sm text-turf-600 font-bold">-{p.discountPercent}%</span>
                  <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Vence: {p.expiresAt}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => togglePromo(p.id)}
                    className={`p-2 rounded-lg transition-all ${
                      p.active ? 'bg-energy-100 text-energy-700' : 'bg-turf-100 text-turf-700'
                    }`}
                  >
                    <Power size={14} />
                  </button>
                  <button
                    onClick={() => deletePromo(p.id)}
                    className="p-2 rounded-lg bg-danger-100 text-danger-600 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {promotions.length === 0 && (
              <p className={`text-center py-8 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                No hay promociones activas
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
