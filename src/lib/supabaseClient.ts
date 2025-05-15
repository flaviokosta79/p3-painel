
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly configured
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anonymous Key is missing from environment variables.");
}

// Create and export the Supabase client
export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || '',
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
    // Simple check to see if we can query the database
    const { data, error } = await supabase.from('usuarios').select('count', { count: 'exact' }).limit(1);
    
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
