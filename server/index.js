import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { loadDB, saveDB } from './db.js';
import {
  isGoogleConfigured,
  getAuthUrl,
  handleCallback,
  getConnectedAccounts,
  disconnectAccount,
  createCalendarEvent,
  deleteCalendarEvent
} from './googleCalendar.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

app.use(cors());
app.use(express.json());

// Serve static frontend files in production
const distPath = join(__dirname, '..', 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
}

// ==================== HELPERS ====================
function getHourPrice(court, hour, db) {
  const prices = db.settings.pricing[court];
  if (!prices) return 0;
  return hour < db.settings.nightHour ? prices.beforeNight : prices.night;
}

function calculateTotalPrice(court, startHour, duration, db) {
  let total = 0;
  let h = startHour;
  let remaining = duration;
  while (remaining > 0) {
    const slot = Math.min(1, remaining);
    total += getHourPrice(court, Math.floor(h), db) * slot;
    h += slot;
    remaining -= slot;
  }
  return Math.round(total);
}

function hasConflict(db, court, date, startHour, duration) {
  const endHour = startHour + duration;
  return db.reservations.find(r =>
    r.court === court &&
    r.date === date &&
    r.status !== 'cancelled' &&
    ((startHour >= r.startHour && startHour < r.startHour + r.duration) ||
     (endHour > r.startHour && endHour <= r.startHour + r.duration) ||
     (startHour <= r.startHour && endHour >= r.startHour + r.duration))
  );
}

// ==================== AUTH ====================
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  const db = loadDB();
  if (password === db.settings.adminPassword) {
    res.json({ success: true, token: 'admin-token-' + Date.now() });
  } else {
    res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
  }
});

// ==================== PRICING ====================
app.get('/api/pricing', (req, res) => {
  const db = loadDB();
  res.json({
    pricing: db.settings.pricing,
    nightHour: db.settings.nightHour,
    fixedAdvance: db.settings.fixedAdvance
  });
});

app.post('/api/pricing/calculate', (req, res) => {
  const { court, startHour, duration } = req.body;
  const db = loadDB();
  const total = calculateTotalPrice(court, startHour, duration, db);
  res.json({
    total,
    advance: db.settings.fixedAdvance,
    remaining: total - db.settings.fixedAdvance
  });
});

// ==================== RESERVATIONS ====================
app.get('/api/reservations', (req, res) => {
  const db = loadDB();
  const { date, court } = req.query;
  let reservations = db.reservations.filter(r => r.status !== 'cancelled');
  if (date) reservations = reservations.filter(r => r.date === date);
  if (court) reservations = reservations.filter(r => r.court === court);
  res.json(reservations);
});

app.get('/api/reservations/all', (req, res) => {
  const db = loadDB();
  res.json(db.reservations);
});

// ==================== PSE PAYMENT FLOW ====================
// Step 1: Initiate payment - creates a pending payment that holds the slot temporarily
app.post('/api/payments/initiate', (req, res) => {
  const db = loadDB();
  const { name, phone, court, date, startHour, duration, vipCode, bank } = req.body;

  // Validate slot availability
  if (hasConflict(db, court, date, startHour, duration)) {
    return res.status(409).json({ success: false, message: 'Horario no disponible' });
  }

  // VIP code path - skip payment entirely
  if (vipCode) {
    const validCode = db.vipCodes.find(c => c.code === vipCode && c.active);
    if (!validCode) {
      return res.status(400).json({ success: false, message: 'Código VIP inválido' });
    }
    // Create reservation immediately for VIP
    return createReservationFinal(req, res, db, true);
  }

  // Validate bank selection for PSE
  if (!bank) {
    return res.status(400).json({ success: false, message: 'Debes seleccionar un banco' });
  }

  const totalPrice = calculateTotalPrice(court, startHour, duration, db);
  const advance = db.settings.fixedAdvance;

  const paymentId = uuidv4();
  const payment = {
    id: paymentId,
    name,
    phone,
    court,
    date,
    startHour,
    duration,
    totalPrice,
    advance,
    bank,
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min
  };

  db.pendingPayments.push(payment);
  saveDB(db);

  // Return PSE simulated redirect URL
  res.json({
    success: true,
    paymentId,
    redirectUrl: `/pse-simulate?paymentId=${paymentId}`,
    bank,
    amount: advance,
    expiresAt: payment.expiresAt
  });
});

async function createReservationFinal(req, res, db, isVip) {
  const { name, phone, court, date, startHour, duration, vipCode } = req.body;

  if (hasConflict(db, court, date, startHour, duration)) {
    return res.status(409).json({ success: false, message: 'Horario no disponible' });
  }

  const totalPrice = calculateTotalPrice(court, startHour, duration, db);

  // Active promotion
  let discount = 0;
  const activePromo = db.promotions.find(p =>
    p.active && new Date(p.expiresAt) > new Date()
  );
  if (activePromo) discount = activePromo.discountPercent;
  const finalPrice = totalPrice - (totalPrice * discount / 100);

  const advance = isVip ? 0 : db.settings.fixedAdvance;

  const reservation = {
    id: uuidv4(),
    name,
    phone,
    court,
    date,
    startHour,
    duration,
    totalPrice: finalPrice,
    advance,
    remaining: finalPrice - advance,
    isVip,
    discount,
    status: 'confirmed',
    paymentConfirmed: isVip,
    paymentMethod: isVip ? 'vip' : 'pse',
    createdAt: new Date().toISOString()
  };

  db.reservations.push(reservation);
  saveDB(db);

  // Create Google Calendar event (if connected)
  const calResult = await createCalendarEvent(reservation);
  if (calResult.success) {
    reservation.googleEventId = calResult.eventId;
    reservation.googleEventLink = calResult.eventLink;
    const refreshDb = loadDB();
    const r = refreshDb.reservations.find(x => x.id === reservation.id);
    if (r) {
      r.googleEventId = calResult.eventId;
      r.googleEventLink = calResult.eventLink;
      saveDB(refreshDb);
    }
  }

  io.emit('reservation-update', { type: 'new', reservation });
  return res.json({ success: true, reservation });
}

// Step 2: Simulate PSE payment confirmation
app.post('/api/payments/:id/confirm', async (req, res) => {
  const db = loadDB();
  const payment = db.pendingPayments.find(p => p.id === req.params.id);
  if (!payment) return res.status(404).json({ success: false, message: 'Pago no encontrado' });
  if (payment.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'Pago ya procesado' });
  }
  if (new Date(payment.expiresAt) < new Date()) {
    payment.status = 'expired';
    saveDB(db);
    return res.status(400).json({ success: false, message: 'Pago expirado' });
  }

  // Re-check conflict (in case someone else booked while paying)
  if (hasConflict(db, payment.court, payment.date, payment.startHour, payment.duration)) {
    payment.status = 'failed';
    saveDB(db);
    return res.status(409).json({ success: false, message: 'Horario ya no disponible. El pago será reembolsado.' });
  }

  // Mark payment as approved
  payment.status = 'approved';
  payment.approvedAt = new Date().toISOString();
  saveDB(db);

  // Create reservation
  req.body = {
    name: payment.name,
    phone: payment.phone,
    court: payment.court,
    date: payment.date,
    startHour: payment.startHour,
    duration: payment.duration
  };
  return createReservationFinal(req, res, loadDB(), false);
});

// Step 2b: Reject payment
app.post('/api/payments/:id/reject', (req, res) => {
  const db = loadDB();
  const payment = db.pendingPayments.find(p => p.id === req.params.id);
  if (!payment) return res.status(404).json({ success: false, message: 'No encontrado' });
  payment.status = 'rejected';
  saveDB(db);
  res.json({ success: true });
});

// Get payment status
app.get('/api/payments/:id', (req, res) => {
  const db = loadDB();
  const payment = db.pendingPayments.find(p => p.id === req.params.id);
  if (!payment) return res.status(404).json({ message: 'No encontrado' });
  res.json(payment);
});

// ==================== RESERVATION ACTIONS ====================
app.put('/api/reservations/:id/cancel', async (req, res) => {
  const db = loadDB();
  const reservation = db.reservations.find(r => r.id === req.params.id);
  if (!reservation) return res.status(404).json({ message: 'No encontrada' });

  reservation.status = 'cancelled';
  saveDB(db);

  // Delete Google Calendar event if exists
  if (reservation.googleEventId) {
    await deleteCalendarEvent(reservation.court, reservation.googleEventId);
  }

  io.emit('reservation-update', { type: 'cancel', reservation });
  res.json({ success: true, reservation });
});

app.put('/api/reservations/:id/confirm-payment', (req, res) => {
  const db = loadDB();
  const reservation = db.reservations.find(r => r.id === req.params.id);
  if (!reservation) return res.status(404).json({ message: 'No encontrada' });

  reservation.paymentConfirmed = true;
  reservation.remaining = 0;
  saveDB(db);

  io.emit('reservation-update', { type: 'payment', reservation });
  res.json({ success: true, reservation });
});

// ==================== VIP CODES ====================
app.get('/api/vip-codes', (req, res) => {
  const db = loadDB();
  res.json(db.vipCodes);
});

app.post('/api/vip-codes', (req, res) => {
  const db = loadDB();
  const { code } = req.body;
  if (db.vipCodes.find(c => c.code === code)) {
    return res.status(400).json({ message: 'El código ya existe' });
  }
  const newCode = { code, active: true, createdAt: new Date().toISOString() };
  db.vipCodes.push(newCode);
  saveDB(db);
  res.json({ success: true, vipCode: newCode });
});

app.put('/api/vip-codes/:code/toggle', (req, res) => {
  const db = loadDB();
  const vipCode = db.vipCodes.find(c => c.code === req.params.code);
  if (!vipCode) return res.status(404).json({ message: 'Código no encontrado' });
  vipCode.active = !vipCode.active;
  saveDB(db);
  res.json({ success: true, vipCode });
});

app.delete('/api/vip-codes/:code', (req, res) => {
  const db = loadDB();
  db.vipCodes = db.vipCodes.filter(c => c.code !== req.params.code);
  saveDB(db);
  res.json({ success: true });
});

// ==================== PROMOTIONS ====================
app.get('/api/promotions', (req, res) => {
  const db = loadDB();
  res.json(db.promotions);
});

app.post('/api/promotions', (req, res) => {
  const db = loadDB();
  const { name, discountPercent, expiresAt } = req.body;
  const promo = {
    id: uuidv4(),
    name,
    discountPercent,
    expiresAt,
    active: true,
    createdAt: new Date().toISOString()
  };
  db.promotions.push(promo);
  saveDB(db);
  res.json({ success: true, promotion: promo });
});

app.put('/api/promotions/:id/toggle', (req, res) => {
  const db = loadDB();
  const promo = db.promotions.find(p => p.id === req.params.id);
  if (!promo) return res.status(404).json({ message: 'Promoción no encontrada' });
  promo.active = !promo.active;
  saveDB(db);
  res.json({ success: true, promotion: promo });
});

app.delete('/api/promotions/:id', (req, res) => {
  const db = loadDB();
  db.promotions = db.promotions.filter(p => p.id !== req.params.id);
  saveDB(db);
  res.json({ success: true });
});

// ==================== SETTINGS ====================
app.get('/api/settings', (req, res) => {
  const db = loadDB();
  res.json(db.settings);
});

app.put('/api/settings', (req, res) => {
  const db = loadDB();
  db.settings = { ...db.settings, ...req.body };
  saveDB(db);
  res.json({ success: true, settings: db.settings });
});

// ==================== GOOGLE CALENDAR ====================
app.get('/api/google/status', (req, res) => {
  res.json({
    configured: isGoogleConfigured(),
    accounts: getConnectedAccounts()
  });
});

app.get('/api/google/auth/:court', (req, res) => {
  const { court } = req.params;
  if (!isGoogleConfigured()) {
    return res.status(400).json({
      success: false,
      message: 'Google no está configurado. Agrega GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.'
    });
  }
  if (court !== 'Capri' && court !== 'Caney') {
    return res.status(400).json({ success: false, message: 'Cancha inválida' });
  }
  const url = getAuthUrl(court);
  res.json({ success: true, url });
});

app.get('/api/google/callback', async (req, res) => {
  const { code, state, court: courtParam } = req.query;
  const court = courtParam || state;
  if (!code || !court) {
    return res.redirect('/admin?google=error');
  }
  try {
    const result = await handleCallback(court, code);
    res.redirect(`/admin?google=success&email=${encodeURIComponent(result.email)}&court=${court}`);
  } catch (err) {
    console.error('OAuth callback error:', err.message);
    res.redirect('/admin?google=error');
  }
});

app.delete('/api/google/disconnect/:court', (req, res) => {
  const { court } = req.params;
  disconnectAccount(court);
  res.json({ success: true });
});

// Public read-only calendar info (only basic data)
app.get('/api/google/public-status', (req, res) => {
  const accounts = getConnectedAccounts();
  res.json({
    Capri: accounts.Capri ? { connected: true } : { connected: false },
    Caney: accounts.Caney ? { connected: true } : { connected: false }
  });
});

// ==================== DAILY STATS ====================
app.get('/api/stats/daily', (req, res) => {
  const db = loadDB();
  const { date } = req.query;
  const today = date || new Date().toISOString().split('T')[0];

  const todayReservations = db.reservations.filter(
    r => r.date === today && r.status !== 'cancelled'
  );

  const totalAdvance = todayReservations.reduce((sum, r) => sum + r.advance, 0);
  const totalRemaining = todayReservations.reduce((sum, r) => sum + r.remaining, 0);
  const capriCount = todayReservations.filter(r => r.court === 'Capri').length;
  const caneyCount = todayReservations.filter(r => r.court === 'Caney').length;

  res.json({
    date: today,
    totalReservations: todayReservations.length,
    totalAdvance,
    totalRemaining,
    mostUsedCourt: capriCount >= caneyCount ? 'Capri' : 'Caney',
    courtCounts: { Capri: capriCount, Caney: caneyCount },
    reservations: todayReservations
  });
});

// ==================== SOCKET.IO ====================
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Catch-all: serve frontend for any non-API route (SPA support)
if (existsSync(distPath)) {
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      res.sendFile(join(distPath, 'index.html'));
    } else {
      next();
    }
  });
}

// ==================== START SERVER ====================
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Google Calendar: ${isGoogleConfigured() ? 'Configurado' : 'NO configurado (agrega GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET)'}`);
});
