import { createClient } from '@supabase/supabase-js';

// Replace these variables with your actual Supabase URL and Public Key
const SUPABASE_URL = "https://agqxtvotqgndohhtdvov.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_kUE5pMvbhzYTS5HgTUDauQ_i9iKzn-I";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
