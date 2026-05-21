import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { loadDB, saveDB } from './db.js';

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

app.post('/api/reservations', (req, res) => {
  const db = loadDB();
  const { name, phone, court, date, startHour, duration, vipCode, advance } = req.body;

  // Check for conflicts
  const endHour = startHour + duration;
  const conflict = db.reservations.find(r =>
    r.court === court &&
    r.date === date &&
    r.status !== 'cancelled' &&
    ((startHour >= r.startHour && startHour < r.startHour + r.duration) ||
     (endHour > r.startHour && endHour <= r.startHour + r.duration) ||
     (startHour <= r.startHour && endHour >= r.startHour + r.duration))
  );

  if (conflict) {
    return res.status(409).json({ success: false, message: 'Horario no disponible' });
  }

  // Validate VIP code if provided
  let isVip = false;
  if (vipCode) {
    const validCode = db.vipCodes.find(c => c.code === vipCode && c.active);
    if (!validCode) {
      return res.status(400).json({ success: false, message: 'Código VIP inválido' });
    }
    isVip = true;
  }

  const totalPrice = duration * db.settings.pricePerHour;
  const advanceAmount = isVip ? 0 : (advance || Math.round(totalPrice * 0.3));

  // Check active promotions
  let discount = 0;
  const activePromo = db.promotions.find(p => 
    p.active && new Date(p.expiresAt) > new Date()
  );
  if (activePromo) {
    discount = activePromo.discountPercent;
  }

  const finalPrice = totalPrice - (totalPrice * discount / 100);

  const reservation = {
    id: uuidv4(),
    name,
    phone,
    court,
    date,
    startHour,
    duration,
    totalPrice: finalPrice,
    advance: isVip ? 0 : advanceAmount,
    remaining: isVip ? finalPrice : finalPrice - advanceAmount,
    isVip,
    discount,
    status: 'confirmed',
    paymentConfirmed: isVip,
    createdAt: new Date().toISOString()
  };

  db.reservations.push(reservation);
  saveDB(db);

  io.emit('reservation-update', { type: 'new', reservation });
  res.json({ success: true, reservation });
});

app.put('/api/reservations/:id/cancel', (req, res) => {
  const db = loadDB();
  const reservation = db.reservations.find(r => r.id === req.params.id);
  if (!reservation) return res.status(404).json({ message: 'No encontrada' });

  reservation.status = 'cancelled';
  saveDB(db);

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
});
