import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://wuysncxddxivgswqqleh.supabase.co', process.env.SUPABASE_KEY || 'your-key-here');
// Wait, I don't have the anon key.
