import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '..', 'inventory.db');
let db: Database.Database;

try {
  db = new Database(dbPath);
  console.log(`📂 Database connected at: ${dbPath}`);
} catch (error) {
  console.error(`❌ Failed to connect to database at ${dbPath}:`, error);
  // Fallback to in-memory if file fails (useful for some environments)
  db = new Database(':memory:');
  console.warn('⚠️ Using in-memory database as fallback');
}

// Initialize tables
try {
  db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'viewer'
  );

  CREATE TABLE IF NOT EXISTS vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact TEXT,
    address TEXT
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_code TEXT UNIQUE,
    item_name TEXT NOT NULL,
    category_id INTEGER,
    barcode_number TEXT UNIQUE,
    quantity REAL DEFAULT 0,
    rate REAL DEFAULT 0,
    unit TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS purchase_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendor_id INTEGER,
    purchase_date TEXT,
    item_code TEXT,
    item_name TEXT,
    category_id INTEGER,
    unit TEXT,
    weight REAL,
    quantity REAL,
    rate REAL,
    pn TEXT,
    kn TEXT,
    per_kg_rate REAL,
    barcode_number TEXT,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );
`);
} catch (error) {
  console.error('❌ Failed to initialize database tables:', error);
}

// Ensure role column exists (in case table was created without it)
try {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'viewer'");
} catch (e) {
  // Column already exists
}

// Seed default users if not exists
const adminExists = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
if (!adminExists) {
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', 'admin123', 'admin');
} else {
  // Ensure the admin user has the admin role and correct password if it was lost
  db.prepare('UPDATE users SET role = ?, password = ? WHERE username = ?').run('admin', 'admin123', 'admin');
}

const editorExists = db.prepare('SELECT * FROM users WHERE username = ?').get('editor');
if (!editorExists) {
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('editor', 'editor123', 'editor');
} else {
  // Ensure the editor user has the editor role and correct password if it was lost
  db.prepare('UPDATE users SET role = ?, password = ? WHERE username = ?').run('editor', 'editor123', 'editor');
}

const viewerExists = db.prepare('SELECT * FROM users WHERE username = ?').get('viewer');
if (!viewerExists) {
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('viewer', 'viewer123', 'viewer');
} else {
  // Ensure the viewer user has the viewer role and correct password if it was lost
  db.prepare('UPDATE users SET role = ?, password = ? WHERE username = ?').run('viewer', 'viewer123', 'viewer');
}

export default db;
