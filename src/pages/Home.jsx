import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import CourtSelector from '../components/CourtSelector';
import Calendar from '../components/Calendar';
import TimeSlots from '../components/TimeSlots';
import BookingForm from '../components/BookingForm';
import WeeklyCalendar from '../components/WeeklyCalendar';
import { format } from 'date-fns';
import { MapPin, CalendarDays, Zap, Eye, ClipboardList } from 'lucide-react';

export default function Home() {
  const { darkMode, reservations, setReservations, socket } = useApp();
  const [view, setView] = useState('book'); // 'book' | 'agenda'
  const [court, setCourt] = useState('Capri');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Load reservations for current date
  useEffect(() => {
    fetch(`/api/reservations?date=${date}`)
      .then(r => r.json())
      .then(setReservations)
      .catch(() => {});
  }, [date, setReservations]);

  const filteredReservations = reservations.filter(
    r => r.date === date && r.status !== 'cancelled'
  );

  const handleSlotSelect = (hour) => {
    setSelectedSlot(hour);
    setShowForm(true);
  };

  const handleBookingSuccess = () => {
    setShowForm(false);
    setSelectedSlot(null);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
      {/* Hero */}
      <div className={`text-center py-6 rounded-3xl grass-pattern ${
        darkMode ? 'bg-gray-800/50' : 'bg-gradient-to-b from-turf-50 to-white'
      }`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap size={18} className="text-energy-500" />
          <span className={`text-sm font-bold ${darkMode ? 'text-energy-400' : 'text-energy-600'}`}>
            Reserva en segundos
          </span>
        </div>
        <h2 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-turf-800'}`}>
          Canchas Capri & Caney
        </h2>
        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Reserva o consulta disponibilidad
        </p>
      </div>

      {/* View Toggle */}
      <div className={`grid grid-cols-2 gap-1 p-1 rounded-2xl ${
        darkMode ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        <button
          onClick={() => setView('book')}
          className={`py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            view === 'book'
              ? darkMode ? 'bg-turf-600 text-white shadow-md' : 'bg-white text-turf-700 shadow-md'
              : darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          <ClipboardList size={16} />
          Reservar
        </button>
        <button
          onClick={() => setView('agenda')}
          className={`py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            view === 'agenda'
              ? darkMode ? 'bg-turf-600 text-white shadow-md' : 'bg-white text-turf-700 shadow-md'
              : darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          <Eye size={16} />
          Ver agenda
        </button>
      </div>

      {/* BOOK VIEW */}
      {view === 'book' && (
        <>
          {/* Court Selector */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={16} className={darkMode ? 'text-turf-400' : 'text-turf-600'} />
              <h3 className={`text-sm font-bold uppercase tracking-wide ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Escoge la cancha
              </h3>
            </div>
            <CourtSelector selected={court} onSelect={setCourt} />
          </section>

          {/* Calendar */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays size={16} className={darkMode ? 'text-turf-400' : 'text-turf-600'} />
              <h3 className={`text-sm font-bold uppercase tracking-wide ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Escoge el día
              </h3>
            </div>
            <Calendar selected={date} onSelect={setDate} />
          </section>

          {/* Time Slots */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-bold uppercase tracking-wide ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Horarios disponibles
              </h3>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                darkMode ? 'bg-gray-800 text-gray-400' : 'bg-turf-100 text-turf-700'
              }`}>
                {court} - {date === format(new Date(), 'yyyy-MM-dd') ? 'Hoy' : date}
              </span>
            </div>
            <TimeSlots
              reservations={filteredReservations}
              court={court}
              date={date}
              selectedSlot={selectedSlot}
              onSelectSlot={handleSlotSelect}
            />
          </section>

          {/* Booking Form */}
          {showForm && selectedSlot !== null && (
            <section className="animate-fade-in">
              <BookingForm
                court={court}
                date={date}
                startHour={selectedSlot}
                onSuccess={handleBookingSuccess}
                onCancel={() => { setShowForm(false); setSelectedSlot(null); }}
              />
            </section>
          )}
        </>
      )}

      {/* AGENDA VIEW */}
      {view === 'agenda' && (
        <section className="animate-fade-in">
          <WeeklyCalendar />
        </section>
      )}
    </div>
  );
}
