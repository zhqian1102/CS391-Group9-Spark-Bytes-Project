import { createClient } from "@supabase/supabase-js";

export const APP_API_URL = process.env.REACT_APP_API_URL;
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "";
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "";

let supabase = null;

if (
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== "your-supabase-url-here"
) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log("✅ Supabase client initialized");
} else {
  console.log("⚠️  Supabase credentials not configured");
}

export default supabase;
