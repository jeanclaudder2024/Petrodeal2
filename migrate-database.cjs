const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

async function migrateDatabase() {
  console.log('🚀 Starting PetroDealHub database migration...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Read the migration SQL
  const migrationSQL = fs.readFileSync('./complete-migration.sql', 'utf8');
  
  // Split the SQL into individual statements
  const statements = migrationSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  
  console.log(`📄 Found ${statements.length} SQL statements to execute`);
  
  try {
    console.log('🔄 Executing database migration...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', {
            sql: statement + ';'
          });
          
          if (error) {
            console.log(`⚠️  Statement ${i + 1} warning:`, error.message);
            errorCount++;
          } else {
            successCount++;
          }
          
          // Progress indicator
          if ((i + 1) % 10 === 0) {
            console.log(`📊 Progress: ${i + 1}/${statements.length} statements`);
          }
          
        } catch (err) {
          console.log(`❌ Error in statement ${i + 1}:`, err.message);
          errorCount++;
        }
      }
    }
    
    console.log('✅ Migration process completed!');
    console.log(`📊 Success: ${successCount}, Warnings/Errors: ${errorCount}`);
    
    // Test connection by checking if tables exist
    const { data: companies, error: testError } = await supabase
      .from('companies')
      .select('count')
      .limit(1);
    
    if (!testError) {
      console.log('🎉 Database connection verified - tables are accessible!');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📝 Manual migration required:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy content from complete-migration.sql');
    console.log('4. Paste and execute in SQL Editor');
  }
}

migrateDatabase();