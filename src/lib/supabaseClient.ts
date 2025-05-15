
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly configured
if (!supabaseUrl || !supabaseUrl.includes('supabase.co')) {
  console.error("Supabase URL is missing or invalid. Please set VITE_SUPABASE_URL environment variable.");
}

if (!supabaseAnonKey || supabaseAnonKey.length < 20) {
  console.error("Supabase Anonymous Key is missing or invalid. Please set VITE_SUPABASE_ANON_KEY environment variable.");
}

// Create and export the Supabase client
export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

// Helper function to check if Supabase connection is working
export async function checkSupabaseConnection() {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return { 
        connected: false, 
        error: "Missing Supabase URL or Anonymous Key in environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY." 
      };
    }
    
    // Simple ping to see if we can connect to Supabase
    const { error } = await supabase.from('usuarios').select('count', { count: 'exact' }).limit(1);
    
    if (error) {
      console.error("Supabase connection test failed:", error.message);
      return { connected: false, error: error.message };
    }
    
    return { connected: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error("Supabase connection error:", errorMessage);
    return { connected: false, error: errorMessage };
  }
}
