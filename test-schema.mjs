import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const urlMatch = env.match(/PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/PUBLIC_SUPABASE_ANON_KEY=(.*)/);

if (urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());
  
  async function check() {
    const { data, error } = await supabase.from('items').select('*').limit(1);
    console.log("Data:", JSON.stringify(data));
    console.log("Error:", error);
  }
  check();
} else {
  console.log("No env");
}
