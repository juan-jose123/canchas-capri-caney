import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, 'data.json');

const defaultData = {
  reservations: [],
  vipCodes: [
    { code: 'ADMIN2024', active: true, createdAt: new Date().toISOString() }
  ],
  promotions: [],
  pendingPayments: [],
  googleTokens: {
    Capri: null,
    Caney: null
  },
  settings: {
    pricing: {
      Capri: { beforeNight: 80000, night: 110000 },
      Caney: { beforeNight: 70000, night: 100000 }
    },
    nightHour: 18,
    fixedAdvance: 30000,
    openTime: 6,
    closeTime: 23,
    courts: ['Capri', 'Caney'],
    adminPassword: 'admin123'
  }
};

function loadDB() {
  if (!existsSync(DB_PATH)) {
    writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2));
    return JSON.parse(JSON.stringify(defaultData));
  }
  try {
    const raw = readFileSync(DB_PATH, 'utf-8');
    const data = JSON.parse(raw);
    // Migrate old data structure
    if (!data.pendingPayments) data.pendingPayments = [];
    if (!data.googleTokens) data.googleTokens = { Capri: null, Caney: null };
    if (!data.settings.pricing) {
      data.settings.pricing = defaultData.settings.pricing;
      data.settings.nightHour = 18;
      data.settings.fixedAdvance = 30000;
    }
    return data;
  } catch {
    return JSON.parse(JSON.stringify(defaultData));
  }
}

function saveDB(data) {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export { loadDB, saveDB };
