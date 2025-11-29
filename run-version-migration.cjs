const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🔧 Running game versions migration...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/003_game_versions.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('Trying direct SQL execution...');
      const { error: directError } = await supabase.from('game_versions').select('count').limit(0);

      if (directError && directError.message.includes('does not exist')) {
        console.log('⚠️  Need to run migration via Supabase CLI or dashboard');
        console.log('\nPlease run this SQL in Supabase SQL Editor:');
        console.log('File: supabase/migrations/003_game_versions.sql\n');
        console.log(migrationSQL);
        return;
      }

      throw error;
    }

    console.log('✅ Migration completed successfully!');
    console.log('📊 Game versions table created');
    console.log('🔒 RLS policies enabled');
    console.log('⚙️  Auto-cleanup trigger configured');
    console.log('📦 RPC functions created');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 Please run the migration manually via Supabase dashboard:');
    console.log('   Dashboard → SQL Editor → New Query → Paste migration SQL');
    process.exit(1);
  }
}

runMigration();
