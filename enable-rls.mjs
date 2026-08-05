import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:oZpQKn9sBafrR5XR@db.wuysncxddxivgswqqleh.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function main() {
  try {
    await client.connect();
    
    // Enable RLS
    await client.query('ALTER TABLE items ENABLE ROW LEVEL SECURITY;');
    await client.query('ALTER TABLE history ENABLE ROW LEVEL SECURITY;');
    
    // Drop existing policies if any
    await client.query('DROP POLICY IF EXISTS "Users can manage their own items" ON items;');
    await client.query('DROP POLICY IF EXISTS "Users can manage their own history" ON history;');

    // Create policies
    await client.query(`
      CREATE POLICY "Users can manage their own items" 
      ON items FOR ALL
      USING (auth.uid() = user_id) 
      WITH CHECK (auth.uid() = user_id);
    `);
    
    await client.query(`
      CREATE POLICY "Users can manage their own history" 
      ON history FOR ALL
      USING (auth.uid() = user_id) 
      WITH CHECK (auth.uid() = user_id);
    `);

    console.log("RLS enabled and policies created successfully.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

main();
