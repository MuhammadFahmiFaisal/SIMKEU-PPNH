import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Sanitize URL: Remove trailing slashes and accidental /rest/v1
const supabaseUrl = rawUrl.replace(/\/$/, '').replace(/\/rest\/v1$/, '');
const supabaseAnonKey = rawKey.trim();

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey.includes('YOUR_')) {
  console.error('Supabase Error: URL atau Anon Key tidak ditemukan atau masih menggunakan placeholder di .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
