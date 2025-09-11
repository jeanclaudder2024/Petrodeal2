const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

async function migrateDatabase() {
  console.log('🚀 Starting PetroDealHub database migration...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Read the migration SQL
  const migrationSQL = fs.readFileSync('./complete-migration.sql', 'utf8');
  
  try {
    console.log('🔄 Executing database migration...');
    
    // Execute the migration using Supabase client
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 All tables and data have been created');
    
    // Verify tables were created
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (!tablesError && tables) {
      console.log(`📋 Created ${tables.length} tables`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📝 Please run the migration manually:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy content from complete-migration.sql');
    console.log('4. Paste and execute');
  }
}

migrateDatabase();