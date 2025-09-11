const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function runMigration() {
  // Extract database URL from Supabase URL
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  
  if (!projectId) {
    console.error('❌ Could not extract project ID from Supabase URL');
    return;
  }

  // Construct PostgreSQL connection string
  const connectionString = `postgresql://postgres:[YOUR_DB_PASSWORD]@db.${projectId}.supabase.co:5432/postgres`;
  
  console.log('🚀 Starting database migration...');
  console.log(`📍 Project ID: ${projectId}`);
  
  // Read the migration SQL file
  const migrationSQL = fs.readFileSync('./complete-migration.sql', 'utf8');
  
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase database');
    
    // Execute the migration
    console.log('🔄 Executing migration...');
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Database tables and data have been created');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📝 Manual steps required:');
    console.log('1. Go to https://supabase.com/dashboard/project/' + projectId);
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy content from complete-migration.sql');
    console.log('4. Paste and execute in SQL Editor');
  } finally {
    await client.end();
  }
}

// Note: You need to replace [YOUR_DB_PASSWORD] with your actual database password
console.log('⚠️  Please update the database password in this script first');
console.log('📋 Get your database password from: https://supabase.com/dashboard/project/' + process.env.VITE_SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] + '/settings/database');

// Uncomment the line below after setting your password
// runMigration();