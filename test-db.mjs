import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wuysncxddxivgswqqleh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1eXNuY3hkZHhpdmdzd3FxbGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NjMwNjQsImV4cCI6MjEwMTMzOTA2NH0.cFOBAng2xYD-JOeJAGwWeUcm7WcZWL3eiyhlPD45ZjQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log("Memulai verifikasi database Supabase...");

  const tablesToTest = ['items', 'templates', 'template_items', 'history', 'history_items'];
  let allPass = true;
  
  for (const table of tablesToTest) {
    const { data, error } = await supabase.from(table).select('id').limit(1);
    
    if (error) {
      console.error(`❌ Gagal: Tabel '${table}' bermasalah atau belum ada. Error:`, error.message);
      allPass = false;
    } else {
      console.log(`✅ Sukses: Tabel '${table}' sudah terpasang dan siap digunakan!`);
    }
  }
  
  if (allPass) {
    console.log("\\n🎉 Selamat! Eksekusi manual Anda 100% tepat. Database sudah siap untuk diproduksi!");
  }
}

testConnection();
