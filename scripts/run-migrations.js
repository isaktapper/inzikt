#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Path to migrations directory
const migrationsDir = path.join(__dirname, '..', 'migrations');

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Load .env.local file for Supabase URL and Key
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"]|['"]$/g, '');
        envVars[key] = value;
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('Error loading .env.local file:', error.message);
    process.exit(1);
  }
}

// Run a SQL migration file
function runMigration(filePath, url, key) {
  try {
    console.log(`Running migration: ${path.basename(filePath)}`);
    
    // Use either psql directly if available, or via the Supabase CLI
    try {
      const sql = fs.readFileSync(filePath, 'utf8');
      const command = `PGPASSWORD=${key} psql ${url} -c "${sql.replace(/"/g, '\\"')}"`;
      execSync(command, { stdio: 'inherit' });
    } catch (err) {
      console.log('Direct psql command failed, trying via Supabase CLI...');
      
      // Write SQL to a temp file
      const tempFile = path.join(__dirname, 'temp-migration.sql');
      fs.writeFileSync(tempFile, fs.readFileSync(filePath, 'utf8'));
      
      // Run via Supabase CLI
      execSync(`supabase db execute --file ${tempFile}`, { stdio: 'inherit' });
      
      // Clean up
      fs.unlinkSync(tempFile);
    }
    
    console.log(`✅ Migration completed: ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`❌ Migration failed: ${path.basename(filePath)}`);
    console.error(error.message);
    return false;
  }
}

// Main function
function main() {
  const env = loadEnv();
  const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or key in .env.local file');
    process.exit(1);
  }
  
  // Get all SQL migration files
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .map(file => path.join(migrationsDir, file));
  
  if (migrationFiles.length === 0) {
    console.log('No migration files found');
    process.exit(0);
  }
  
  console.log('Available migrations:');
  migrationFiles.forEach((file, index) => {
    console.log(`${index + 1}. ${path.basename(file)}`);
  });
  
  rl.question('Enter the number of the migration to run (or "all" to run all): ', (answer) => {
    if (answer.toLowerCase() === 'all') {
      let allSucceeded = true;
      
      for (const file of migrationFiles) {
        const success = runMigration(file, supabaseUrl, supabaseKey);
        if (!success) {
          allSucceeded = false;
        }
      }
      
      if (allSucceeded) {
        console.log('✅ All migrations completed successfully');
      } else {
        console.log('⚠️ Some migrations failed');
      }
    } else {
      const index = parseInt(answer, 10) - 1;
      
      if (isNaN(index) || index < 0 || index >= migrationFiles.length) {
        console.error('Invalid selection');
        process.exit(1);
      }
      
      runMigration(migrationFiles[index], supabaseUrl, supabaseKey);
    }
    
    rl.close();
  });
}

main(); 