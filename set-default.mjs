import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:oZpQKn9sBafrR5XR@db.wuysncxddxivgswqqleh.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function main() {
  try {
    await client.connect();
    
    // Set default value for user_id so inserts automatically get the user's ID
    await client.query("ALTER TABLE items ALTER COLUMN user_id SET DEFAULT auth.uid();");
    await client.query("ALTER TABLE history ALTER COLUMN user_id SET DEFAULT auth.uid();");
    await client.query("ALTER TABLE templates ALTER COLUMN user_id SET DEFAULT auth.uid();");
    await client.query("ALTER TABLE template_items ALTER COLUMN user_id SET DEFAULT auth.uid();");

    console.log("Default values set for user_id");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

main();
