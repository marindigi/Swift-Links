import { createClient } from "@supabase/supabase-js";

// ------------------------------------------------------------------
// PASTE YOUR SUPABASE URL AND PUBLIC KEY HERE
// ------------------------------------------------------------------
const SUPABASE_URL = "https://lqrcrqcgzticbzazxorc.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_lhizgd0mwyTZ8XYUpJO6sg_YkRomYze";
// ------------------------------------------------------------------

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
