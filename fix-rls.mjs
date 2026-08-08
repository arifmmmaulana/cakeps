import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:oZpQKn9sBafrR5XR@db.wuysncxddxivgswqqleh.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function main() {
  try {
    await client.connect();
    console.log("Terhubung ke Supabase PostgreSQL...");

    // 1. Tambahkan kolom user_id jika belum ada, dan beri nilai default auth.uid()
    // auth.uid() adalah fungsi bawaan Supabase untuk mengambil ID user yang sedang login/anonim.
    
    // Untuk history_items
    await client.query('ALTER TABLE history_items ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();');
    await client.query('ALTER TABLE history_items ALTER COLUMN user_id SET DEFAULT auth.uid();'); // Pastikan defaultnya di-set
    
    // Untuk template_items
    await client.query('ALTER TABLE template_items ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();');
    await client.query('ALTER TABLE template_items ALTER COLUMN user_id SET DEFAULT auth.uid();');

    console.log("Kolom user_id (default: auth.uid()) berhasil disiapkan.");

    // 2. Aktifkan Row Level Security (RLS)
    await client.query('ALTER TABLE history_items ENABLE ROW LEVEL SECURITY;');
    await client.query('ALTER TABLE template_items ENABLE ROW LEVEL SECURITY;');
    console.log("Row Level Security diaktifkan untuk tabel anak.");

    // 3. Hapus policy lama jika ada (untuk menghindari duplikat)
    await client.query('DROP POLICY IF EXISTS "Users can manage their own history_items" ON history_items;');
    await client.query('DROP POLICY IF EXISTS "Users can manage their own template_items" ON template_items;');

    // 4. Buat Policy RLS
    await client.query(`
      CREATE POLICY "Users can manage their own history_items" 
      ON history_items FOR ALL
      USING (auth.uid() = user_id) 
      WITH CHECK (auth.uid() = user_id);
    `);
    
    await client.query(`
      CREATE POLICY "Users can manage their own template_items" 
      ON template_items FOR ALL
      USING (auth.uid() = user_id) 
      WITH CHECK (auth.uid() = user_id);
    `);

    console.log("Policy RLS berhasil dibuat! Database sekarang aman dari akses tak berizin.");
  } catch (err) {
    console.error("Gagal menjalankan query:", err);
  } finally {
    await client.end();
  }
}

main();
