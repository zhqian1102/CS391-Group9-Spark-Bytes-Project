import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn(" Supabase credentials not configured.");
  console.warn(
    " Check your .env file for SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// confirmation log
console.log("Supabase client initialized with URL:", supabaseUrl);

export default supabase;
