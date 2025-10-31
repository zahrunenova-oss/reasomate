import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'db.json');
const adapter = new JSONFile(dbPath);
const db = new Low(adapter, {});

// Initialize database with default structure
async function initDb() {
  await db.read();
  
  // Set default data if file is empty, null, or missing required fields
  if (!db.data || !db.data.users || !db.data.pulses || !db.data.messages || !db.data.threads) {
    db.data = {
      users: [],
      pulses: [],
      messages: [],
      threads: []
    };
    await db.write();
  }
  
  console.log(`Database initialized at: ${dbPath}`);
}

export { db, initDb };