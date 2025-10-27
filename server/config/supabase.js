const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your-supabase-url-here') {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase client initialized');
} else {
  console.log('⚠️  Supabase credentials not configured. Please update .env file.');
  console.log('⚠️  Get your credentials from: https://app.supabase.com/project/_/settings/api');
}

module.exports = supabase;
