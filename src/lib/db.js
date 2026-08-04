import Database from 'better-sqlite3';
import { join } from 'path';

// Lokasi database di root project
const dbPath = join(process.cwd(), 'cakeps.db');
const db = new Database(dbPath);

// Konfigurasi WAL mode untuk performa lebih cepat
db.pragma('journal_mode = WAL');

// Buat tabel jika belum ada
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity REAL DEFAULT 1,
    unit TEXT DEFAULT 'pcs',
    estimatedPrice INTEGER DEFAULT 0,
    actualPrice INTEGER DEFAULT 0,
    checked INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    createdAt TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS template_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    templateId INTEGER NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity REAL DEFAULT 1,
    unit TEXT DEFAULT 'pcs',
    estimatedPrice INTEGER DEFAULT 0,
    FOREIGN KEY(templateId) REFERENCES templates(id) ON DELETE CASCADE
  );
`);

// Insert default templates & items if database is totally empty
const checkEmpty = db.prepare('SELECT COUNT(*) as count FROM templates').get();
if (checkEmpty.count === 0) {
  // Tambah template contoh
  const insertTemplate = db.prepare('INSERT INTO templates (name) VALUES (?)');
  const insertTemplateItem = db.prepare(`
    INSERT INTO template_items (templateId, name, category, quantity, unit, estimatedPrice)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const templateId = insertTemplate.run('Belanjaan Mingguan Standar').lastInsertRowid;
  
  // Masukkan beberapa contoh item belanjaan pekanan khas Indonesia
  const defaultItems = [
    { name: 'Kangkung', category: 'Sayuran', quantity: 2, unit: 'ikat', estimatedPrice: 3000 },
    { name: 'Bayam', category: 'Sayuran', quantity: 2, unit: 'ikat', estimatedPrice: 3000 },
    { name: 'Daging Ayam', category: 'Lauk/Daging', quantity: 1, unit: 'kg', estimatedPrice: 35000 },
    { name: 'Bawang Merah', category: 'Bumbu', quantity: 0.25, unit: 'kg', estimatedPrice: 10000 },
    { name: 'Cabai Rawit', category: 'Bumbu', quantity: 0.1, unit: 'kg', estimatedPrice: 5000 },
    { name: 'Minyak Goreng', category: 'Sembako', quantity: 2, unit: 'liter', estimatedPrice: 36000 },
    { name: 'Deterjen Bubuk', category: 'Laundry', quantity: 1, unit: 'bungkus', estimatedPrice: 18000 },
    { name: 'Keripik Singkong', category: 'Cemilan', quantity: 2, unit: 'bungkus', estimatedPrice: 10000 }
  ];

  for (const item of defaultItems) {
    insertTemplateItem.run(
      templateId,
      item.name,
      item.category,
      item.quantity,
      item.unit,
      item.estimatedPrice
    );
  }

  // Juga masukkan beberapa barang aktif agar halaman pertama kali tidak kosong
  const insertActiveItem = db.prepare(`
    INSERT INTO items (name, category, quantity, unit, estimatedPrice, actualPrice, checked)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `);
  for (const item of defaultItems) {
    insertActiveItem.run(item.name, item.category, item.quantity, item.unit, item.estimatedPrice, 0);
  }
}

export default db;
