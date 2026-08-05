import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:oZpQKn9sBafrR5XR@db.wuysncxddxivgswqqleh.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function main() {
  try {
    await client.connect();
    
    // Add user_id column
    await client.query('ALTER TABLE templates ADD COLUMN IF NOT EXISTS user_id UUID;');
    await client.query('ALTER TABLE template_items ADD COLUMN IF NOT EXISTS user_id UUID;'); // Just in case, but probably templates is enough

    // Enable RLS
    await client.query('ALTER TABLE templates ENABLE ROW LEVEL SECURITY;');
    await client.query('ALTER TABLE template_items ENABLE ROW LEVEL SECURITY;');
    
    // Drop existing policies if any
    await client.query('DROP POLICY IF EXISTS "Users can manage their own templates" ON templates;');
    await client.query('DROP POLICY IF EXISTS "Users can manage their own template_items" ON template_items;');

    // Create policies
    await client.query(`
      CREATE POLICY "Users can manage their own templates" 
      ON templates FOR ALL
      USING (auth.uid() = user_id) 
      WITH CHECK (auth.uid() = user_id);
    `);
    
    // For template items, it might not have user_id, it might just rely on template_id. Let's add user_id policy anyway
    await client.query(`
      CREATE POLICY "Users can manage their own template_items" 
      ON template_items FOR ALL
      USING (auth.uid() = user_id) 
      WITH CHECK (auth.uid() = user_id);
    `);

    console.log("RLS enabled for templates and template_items.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

main();
