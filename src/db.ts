import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '..', 'inventory.db');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'user'
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

// Seed default user if not exists
const userExists = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
if (!userExists) {
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', 'admin123', 'admin');
}

export default db;
