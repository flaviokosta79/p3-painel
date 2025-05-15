
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Default URLs for development (these won't work for actual data access but will prevent crashes)
const defaultUrl = 'https://placeholder-project.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MTYxNjY1NTIsImV4cCI6MTkzMTc0MjU1Mn0.placeholder';

// Check if environment variables are properly configured
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anonymous Key is missing from environment variables. Using placeholders for development.");
}

// Create and export the Supabase client
export const supabase = createClient(
  supabaseUrl || defaultUrl, 
  supabaseAnonKey || defaultKey,
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
