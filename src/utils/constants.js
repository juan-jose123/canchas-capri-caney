export const PRICE_PER_HOUR = 80000;

export const COURTS = ['Capri', 'Caney'];

export const TIME_SLOTS = [];
for (let h = 6; h < 23; h++) {
  TIME_SLOTS.push({
    hour: h,
    label: `${h.toString().padStart(2, '0')}:00`,
    labelEnd: `${(h + 1).toString().padStart(2, '0')}:00`
  });
}

export const DURATIONS = [
  { value: 1, label: '1 hora' },
  { value: 1.5, label: '1 hora y media' },
  { value: 2, label: '2 horas' },
  { value: 3, label: '3 horas' }
];

export const SLOT_STATUS = {
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  IN_PLAY: 'in_play'
};

export const STATUS_COLORS = {
  available: { bg: 'bg-turf-100', text: 'text-turf-700', border: 'border-turf-300', label: 'Disponible' },
  reserved: { bg: 'bg-energy-100', text: 'text-energy-700', border: 'border-energy-300', label: 'Reservado' },
  in_play: { bg: 'bg-danger-100', text: 'text-danger-600', border: 'border-danger-300', label: 'En juego' }
};

export const WHATSAPP_NUMBER = '573001234567';
