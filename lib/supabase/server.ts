import { createClient } from "@supabase/supabase-js";

import { hasSupabaseEnv, supabaseAnonKey, supabaseServiceRoleKey, supabaseUrl } from "@/lib/supabase/env";

export function getSupabaseAdmin() {
  if (!hasSupabaseEnv() || !supabaseUrl) {
    return null;
  }

  const key = supabaseServiceRoleKey ?? supabaseAnonKey;

  if (!key) {
    return null;
  }

  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
