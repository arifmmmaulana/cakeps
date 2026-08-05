import { supabase } from './src/lib/supabase.js';

async function checkItems() {
  const { data } = await supabase.from('items').select('*');
  console.log(data);
}
checkItems();
