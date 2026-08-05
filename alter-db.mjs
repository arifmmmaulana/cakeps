import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:oZpQKn9sBafrR5XR@db.wuysncxddxivgswqqleh.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function main() {
  try {
    await client.connect();
    console.log("Terhubung ke Supabase PostgreSQL!");
    
    // Tambah kolom user_id
    await client.query('ALTER TABLE items ADD COLUMN IF NOT EXISTS user_id UUID;');
    console.log("Berhasil menambahkan kolom user_id pada tabel items.");
    
    await client.query('ALTER TABLE history ADD COLUMN IF NOT EXISTS user_id UUID;');
    console.log("Berhasil menambahkan kolom user_id pada tabel history.");

  } catch (err) {
    console.error("Gagal menjalankan query:", err);
  } finally {
    await client.end();
  }
}

main();
