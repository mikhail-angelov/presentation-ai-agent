import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const supabaseProjectUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseProjectUrl || !supabaseAnonKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
  process.exit(1);
}

console.log(`Connecting to Supabase project: ${supabaseProjectUrl}`);

// Create Supabase client
const supabase = createClient(supabaseProjectUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public'
  }
});

async function runMigration() {
  try {
    // Read SQL file
    const sqlPath = join(__dirname, 'add_session_metrics.sql');
    const sql = readFileSync(sqlPath, 'utf8');
    
    console.log('Running session metrics SQL migration...');
    console.log('SQL to execute:');
    console.log('='.repeat(80));
    console.log(sql);
    console.log('='.repeat(80));
    
    console.log('\nIMPORTANT: This migration adds tokens_used and ml_request_count columns to the sessions table.');
    console.log('Please execute this SQL in your Supabase SQL Editor:');
    console.log('\n1. Go to your Supabase dashboard: https://app.supabase.com');
    console.log('2. Select your project');
    console.log('3. Go to the SQL Editor');
    console.log('4. Copy and paste the SQL above');
    console.log('5. Run the SQL to update the schema');
    
    // Try to execute the SQL directly if possible
    console.log('\nAttempting to execute SQL via Supabase...');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
      console.log(`SQL: ${statement.substring(0, 100)}...`);
      
      try {
        // Try to execute via SQL API if available
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          console.log(`  ⚠️  Could not execute via exec_sql: ${error.message}`);
          console.log('  ℹ️  This statement needs to be executed manually in the Supabase SQL Editor');
          errorCount++;
        } else {
          console.log('  ✅ Statement executed successfully');
          successCount++;
        }
      } catch (err) {
        console.log(`  ❌ Error: ${err.message}`);
        console.log('  ℹ️  This statement needs to be executed manually in the Supabase SQL Editor');
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`Migration summary:`);
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ⚠️  Needs manual execution: ${errorCount}`);
    console.log('\nIf any statements failed, please execute them manually in the Supabase SQL Editor.');
    console.log('The application will still work with fallback mechanisms.');
    
  } catch (error) {
    console.error('Error running migration:', error);
    console.log('\nPlease execute the SQL manually in the Supabase SQL Editor.');
    console.log('The application will still work with fallback mechanisms.');
  }
}

runMigration();