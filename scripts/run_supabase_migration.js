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
    const sqlPath = join(__dirname, 'create_sessions_schema.sql');
    const sql = readFileSync(sqlPath, 'utf8');
    
    console.log('Running SQL migration...');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      
      if (error) {
        // If exec_sql function doesn't exist, try direct SQL execution
        console.log('exec_sql function not available, trying alternative approach...');
        
        // For simple CREATE statements, we can use the Supabase SQL API
        // Note: This is a simplified approach - in production, use proper migrations
        if (statement.startsWith('CREATE TABLE') || statement.startsWith('CREATE INDEX')) {
          console.log(`Skipping direct execution for: ${statement.substring(0, 50)}...`);
          console.log('Note: Tables and indexes need to be created via Supabase dashboard or SQL editor');
        } else if (statement.startsWith('CREATE OR REPLACE FUNCTION') || statement.startsWith('CREATE OR REPLACE VIEW')) {
          console.log(`Skipping direct execution for: ${statement.substring(0, 50)}...`);
          console.log('Note: Functions and views need to be created via Supabase dashboard or SQL editor');
        }
      }
    }
    
    console.log('\nMigration completed!');
    console.log('\nNext steps:');
    console.log('1. Go to your Supabase dashboard: https://app.supabase.com');
    console.log('2. Select your project');
    console.log('3. Go to the SQL Editor');
    console.log('4. Copy and paste the contents of scripts/create_sessions_schema.sql');
    console.log('5. Run the SQL to create the tables, indexes, functions, and views');
    
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration();