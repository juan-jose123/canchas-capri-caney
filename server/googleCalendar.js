import { google } from 'googleapis';
import { loadDB, saveDB } from './db.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_BASE = process.env.PUBLIC_URL || 'http://localhost:3001';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

export function isGoogleConfigured() {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}

export function createOAuth2Client(court) {
  const redirectUri = `${REDIRECT_BASE}/api/google/callback?court=${court}`;
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

export function getAuthUrl(court) {
  const oauth2Client = createOAuth2Client(court);
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state: court
  });
}

export async function handleCallback(court, code) {
  const oauth2Client = createOAuth2Client(court);
  const { tokens } = await oauth2Client.getToken(code);

  // Get user email
  oauth2Client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data: profile } = await oauth2.userinfo.get();

  const db = loadDB();
  db.googleTokens[court] = {
    tokens,
    email: profile.email,
    name: profile.name,
    connectedAt: new Date().toISOString()
  };
  saveDB(db);

  return { email: profile.email, name: profile.name };
}

export function getConnectedAccounts() {
  const db = loadDB();
  return {
    Capri: db.googleTokens?.Capri ? {
      email: db.googleTokens.Capri.email,
      name: db.googleTokens.Capri.name,
      connectedAt: db.googleTokens.Capri.connectedAt
    } : null,
    Caney: db.googleTokens?.Caney ? {
      email: db.googleTokens.Caney.email,
      name: db.googleTokens.Caney.name,
      connectedAt: db.googleTokens.Caney.connectedAt
    } : null
  };
}

export function disconnectAccount(court) {
  const db = loadDB();
  if (db.googleTokens) {
    db.googleTokens[court] = null;
    saveDB(db);
  }
}

async function getAuthorizedClient(court) {
  const db = loadDB();
  const tokenData = db.googleTokens?.[court];
  if (!tokenData) return null;

  const oauth2Client = createOAuth2Client(court);
  oauth2Client.setCredentials(tokenData.tokens);

  // Refresh token if needed
  oauth2Client.on('tokens', (newTokens) => {
    const updatedDb = loadDB();
    if (updatedDb.googleTokens?.[court]) {
      updatedDb.googleTokens[court].tokens = {
        ...updatedDb.googleTokens[court].tokens,
        ...newTokens
      };
      saveDB(updatedDb);
    }
  });

  return oauth2Client;
}

export async function createCalendarEvent(reservation) {
  try {
    const auth = await getAuthorizedClient(reservation.court);
    if (!auth) return { success: false, reason: 'not_connected' };

    const calendar = google.calendar({ version: 'v3', auth });

    // Build dates
    const [year, month, day] = reservation.date.split('-').map(Number);
    const startDate = new Date(year, month - 1, day, reservation.startHour, 0, 0);
    const endDate = new Date(startDate.getTime() + reservation.duration * 60 * 60 * 1000);

    const event = {
      summary: `${reservation.name} - Cancha ${reservation.court}`,
      description: `Cliente: ${reservation.name}\nTeléfono: ${reservation.phone}\nAnticipo pagado: $${reservation.advance.toLocaleString('es-CO')}\nResta por pagar: $${reservation.remaining.toLocaleString('es-CO')}\nTotal: $${reservation.totalPrice.toLocaleString('es-CO')}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'America/Bogota'
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'America/Bogota'
      },
      colorId: reservation.court === 'Capri' ? '10' : '7'
    };

    const result = await calendar.events.insert({
      calendarId: 'primary',
      resource: event
    });

    return { success: true, eventId: result.data.id, eventLink: result.data.htmlLink };
  } catch (err) {
    console.error('Error creando evento en Google Calendar:', err.message);
    return { success: false, reason: err.message };
  }
}

export async function deleteCalendarEvent(court, eventId) {
  try {
    const auth = await getAuthorizedClient(court);
    if (!auth || !eventId) return false;
    const calendar = google.calendar({ version: 'v3', auth });
    await calendar.events.delete({
      calendarId: 'primary',
      eventId
    });
    return true;
  } catch (err) {
    console.error('Error eliminando evento:', err.message);
    return false;
  }
}
