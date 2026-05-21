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
  settings: {
    pricePerHour: 80000,
    openTime: 6,
    closeTime: 23,
    courts: ['Capri', 'Caney'],
    adminPassword: 'admin123'
  }
};

function loadDB() {
  if (!existsSync(DB_PATH)) {
    writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    const raw = readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return defaultData;
  }
}

function saveDB(data) {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export { loadDB, saveDB };
