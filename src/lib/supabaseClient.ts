
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if environment variables are properly configured
if (!supabaseUrl || !supabaseUrl.includes('supabase.co')) {
  console.error("Supabase URL is missing or invalid. Please set VITE_SUPABASE_URL environment variable.");
}

if (!supabaseAnonKey || supabaseAnonKey.length < 20) {
  console.error("Supabase Anonymous Key is missing or invalid. Please set VITE_SUPABASE_ANON_KEY environment variable.");
}

// Create a fallback URL and key for development (these won't work for actual data access)
// But they allow the app to initialize without crashing when env vars aren't set
const finalSupabaseUrl = supabaseUrl || 'https://kjvecnxolzzikjuxyynt.supabase.co';
const finalSupabaseKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqdmVjbnhvbHp6aWtqdXh5eW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNTM3NjIsImV4cCI6MjA2MjgyOTc2Mn0.o0cdMaMDHXuB6PcwTvXBptBgF3lvSqbfeeC6mzS_mWo';

// Create and export the Supabase client
export const supabase = createClient(
  finalSupabaseUrl,
  finalSupabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

// Helper function to check if Supabase connection is working
export interface ConnectionStatus {
  connected: boolean;
  error?: string;
}

export async function checkSupabaseConnection(): Promise<ConnectionStatus> {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Supabase configuration error:", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
        url: supabaseUrl || 'Not set',
        keyLength: supabaseAnonKey?.length || 0
      });
      return { 
        connected: false, 
        error: "Missing Supabase URL or Anonymous Key in environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY." 
      };
    }
    
    // Test the connection with a simple query
    // Apenas log em desenvolvimento
    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_LOGS === 'true') {
      console.log('Testing Supabase connection to:', supabaseUrl);
    }
    
    const { data, error } = await supabase
      .from('usuarios')
      .select('count', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.error("Supabase connection test failed:", {
        error: error.message,
        details: error.details
      });
      return { 
        connected: false, 
        error: `Supabase connection failed: ${error.message}` 
      };
    }
    
    // Apenas log em desenvolvimento
    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_LOGS === 'true') {
      console.log('Supabase connection successful:', data);
    }
    return { connected: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error("Supabase connection error:", errorMessage);
    return { connected: false, error: errorMessage };
  }
}
