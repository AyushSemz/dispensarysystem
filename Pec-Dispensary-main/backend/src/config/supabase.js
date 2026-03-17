import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client with service role key for backend operations
// This bypasses Row Level Security (RLS) and has full access
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Helper function to handle Supabase errors
export const handleSupabaseError = (error, defaultMessage = 'Database operation failed') => {
    console.error('Supabase Error:', error);
    return {
        message: error.message || defaultMessage,
        code: error.code,
        details: error.details
    };
};
