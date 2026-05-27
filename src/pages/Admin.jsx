import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/helpers';
import { format } from 'date-fns';
import {
  Calendar as CalIcon, BarChart3, Key, Tag, LogOut, X, Check, Trash2,
  DollarSign, Users, TrendingUp, Plus, Power, Link2, Unlink, AlertCircle,
  CheckCircle2, ExternalLink
} from 'lucide-react';

export default function Admin() {
  const { darkMode, isAdmin, logout, addNotification } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState('reservations');
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState(null);
  const [vipCodes, setVipCodes] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [googleStatus, setGoogleStatus] = useState({ configured: false, accounts: { Capri: null, Caney: null } });
  const [newCode, setNewCode] = useState('');
  const [promoForm, setPromoForm] = useState({ name: '', discountPercent: 10, expiresAt: '' });
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Handle OAuth callback messages
  useEffect(() => {
    const googleParam = searchParams.get('google');
    if (googleParam === 'success') {
      const email = searchParams.get('email');
      const court = searchParams.get('court');
      addNotification(`Google Calendar conectado: ${court} (${email})`, 'success');
      setTab('google');
      setSearchParams({});
    } else if (googleParam === 'error') {
      addNotification('Error conectando Google Calendar', 'error');
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, addNotification]);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isAdmin, navigate, selectedDate]);

  const loadData = async () => {
    try {
      const [resRes, statsRes, codesRes, promosRes, gRes] = await Promise.all([
        fetch('/api/reservations/all'),
        fetch(`/api/stats/daily?date=${selectedDate}`),
        fetch('/api/vip-codes'),
        fetch('/api/promotions'),
        fetch('/api/google/status')
      ]);
      setReservations(await resRes.json());
      setStats(await statsRes.json());
      setVipCodes(await codesRes.json());
      setPromotions(await promosRes.json());
      setGoogleStatus(await gRes.json());
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

  const connectGoogle = async (court) => {
    try {
      const res = await fetch(`/api/google/auth/${court}`);
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        addNotification(data.message || 'Google no configurado', 'error');
      }
    } catch {
      addNotification('Error conectando con Google', 'error');
    }
  };

  const disconnectGoogle = async (court) => {
    await fetch(`/api/google/disconnect/${court}`, { method: 'DELETE' });
    addNotification(`Calendario ${court} desconectado`, 'success');
    loadData();
  };

  const tabs = [
    { id: 'reservations', label: 'Reservas', icon: CalIcon },
    { id: 'stats', label: 'Historial', icon: BarChart3 },
    { id: 'google', label: 'Calendar', icon: Link2 },
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
                  <div className="flex items-center gap-2 flex-wrap">
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
                    {r.googleEventLink && (
                      <a
                        href={r.googleEventLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink size={10} /> Calendar
                      </a>
                    )}
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
                        title="Confirmar pago total"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => cancelReservation(r.id)}
                      className="p-2 rounded-lg bg-danger-100 text-danger-600 transition-all"
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
              <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {formatCurrency(stats.totalAdvance)}
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Recibido</div>
            </div>
            <div className={cardClass}>
              <TrendingUp size={20} className="text-energy-500 mb-2" />
              <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
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

      {/* GOOGLE CALENDAR TAB */}
      {tab === 'google' && (
        <div className="space-y-4">
          {!googleStatus.configured && (
            <div className={`${cardClass} border-energy-300 ${darkMode ? 'bg-energy-900/20' : 'bg-energy-50'}`}>
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-energy-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className={`font-bold ${darkMode ? 'text-energy-300' : 'text-energy-700'}`}>
                    Google Calendar no configurado
                  </p>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Necesitas configurar las credenciales OAuth en el servidor. Agrega las variables de entorno:
                  </p>
                  <ul className={`text-xs mt-2 font-mono space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <li>GOOGLE_CLIENT_ID=...</li>
                    <li>GOOGLE_CLIENT_SECRET=...</li>
                    <li>PUBLIC_URL=https://tu-dominio.onrender.com</li>
                  </ul>
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline mt-2 inline-flex items-center gap-1"
                  >
                    <ExternalLink size={12} /> Crear credenciales en Google Cloud
                  </a>
                </div>
              </div>
            </div>
          )}

          {['Capri', 'Caney'].map(court => {
            const account = googleStatus.accounts[court];
            const isConnected = !!account;
            return (
              <div key={court} className={cardClass}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      isConnected
                        ? 'bg-turf-100 text-turf-600'
                        : darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {court === 'Capri' ? '🏟️' : '⚽'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          Cancha {court}
                        </h4>
                        {isConnected ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-turf-100 text-turf-700 font-medium flex items-center gap-1">
                            <CheckCircle2 size={10} /> Conectado
                          </span>
                        ) : (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                          }`}>
                            Sin conectar
                          </span>
                        )}
                      </div>
                      {isConnected ? (
                        <>
                          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {account.name}
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {account.email}
                          </p>
                        </>
                      ) : (
                        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Conecta una cuenta de Google para sincronizar las reservas automáticamente.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  {isConnected ? (
                    <button
                      onClick={() => disconnectGoogle(court)}
                      className="px-4 py-2.5 rounded-xl text-sm font-bold bg-danger-100 text-danger-600 hover:bg-danger-200 transition-all flex items-center gap-2"
                    >
                      <Unlink size={14} /> Desconectar
                    </button>
                  ) : (
                    <button
                      onClick={() => connectGoogle(court)}
                      disabled={!googleStatus.configured}
                      className="px-4 py-2.5 rounded-xl text-sm font-bold bg-white border-2 border-gray-200 hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-50 text-gray-700"
                    >
                      <svg width="16" height="16" viewBox="0 0 48 48">
                        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
                        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
                        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C41.1 35.1 44 30 44 24c0-1.3-.1-2.4-.4-3.5z"/>
                      </svg>
                      Conectar Google {court}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <div className={`${cardClass} text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <p className="font-bold mb-1">Cómo funciona:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Conecta una cuenta de Google diferente para cada cancha</li>
              <li>Cada reserva creará un evento automático en el calendario correspondiente</li>
              <li>El evento incluye nombre, hora y monto pagado</li>
              <li>Si cancelas una reserva, también se elimina del calendario</li>
              <li>Los usuarios comunes solo ven las reservas, no pueden modificar el calendario</li>
            </ul>
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
