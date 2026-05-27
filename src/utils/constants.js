export const COURTS = ['Capri', 'Caney'];

// Precios dinámicos por cancha y hora
export const PRICING = {
  Capri: {
    beforeNight: 80000,  // antes de 6pm
    night: 110000        // 6pm en adelante
  },
  Caney: {
    beforeNight: 70000,
    night: 100000
  }
};

export const NIGHT_HOUR = 18; // 6pm
export const FIXED_ADVANCE = 30000; // anticipo fijo en ambas canchas

// Calcula el precio de una hora específica para una cancha
export function getHourPrice(court, hour) {
  const prices = PRICING[court];
  if (!prices) return 0;
  return hour < NIGHT_HOUR ? prices.beforeNight : prices.night;
}

// Calcula el precio total considerando múltiples horas
export function calculateTotalPrice(court, startHour, duration) {
  let total = 0;
  let h = startHour;
  let remaining = duration;
  while (remaining > 0) {
    const slot = Math.min(1, remaining);
    total += getHourPrice(court, Math.floor(h)) * slot;
    h += slot;
    remaining -= slot;
  }
  return Math.round(total);
}

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

// Bancos PSE Colombia (mock)
export const PSE_BANKS = [
  { code: '1007', name: 'Bancolombia' },
  { code: '1051', name: 'Davivienda' },
  { code: '1001', name: 'Banco de Bogotá' },
  { code: '1023', name: 'Banco Caja Social' },
  { code: '1062', name: 'Banco Falabella' },
  { code: '1019', name: 'Scotiabank Colpatria' },
  { code: '1009', name: 'Citibank' },
  { code: '1006', name: 'Banco Itaú' },
  { code: '1052', name: 'Banco AV Villas' },
  { code: '1013', name: 'BBVA Colombia' },
  { code: '1060', name: 'Banco Pichincha' },
  { code: '1058', name: 'Banco Procredit' },
  { code: '1066', name: 'Banco Cooperativo Coopcentral' },
  { code: '1283', name: 'Cooperativa Financiera de Antioquia' },
  { code: '1289', name: 'Coltefinanciera' },
  { code: '1551', name: 'Daviplata' },
  { code: '1507', name: 'Nequi' }
];
