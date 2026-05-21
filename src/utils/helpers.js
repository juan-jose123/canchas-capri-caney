import { format, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(dateStr) {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Hoy';
  return format(date, "EEEE d 'de' MMMM", { locale: es });
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function getSlotStatus(hour, reservations, court) {
  const now = new Date();
  const currentHour = now.getHours();
  const today = format(now, 'yyyy-MM-dd');

  const reservation = reservations.find(r =>
    r.court === court &&
    r.status !== 'cancelled' &&
    hour >= r.startHour &&
    hour < r.startHour + r.duration
  );

  if (!reservation) return 'available';

  // If it's today and current time is within this slot
  if (reservation.date === today && currentHour >= reservation.startHour && currentHour < reservation.startHour + reservation.duration) {
    return 'in_play';
  }

  return 'reserved';
}

export function generateDateOptions(days = 7) {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push({
      value: format(date, 'yyyy-MM-dd'),
      label: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : format(date, "EEE d MMM", { locale: es }),
      dayName: format(date, 'EEEE', { locale: es }),
      dayNum: format(date, 'd'),
      month: format(date, 'MMM', { locale: es })
    });
  }
  return dates;
}
