import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import {
  hasSupabaseAuthEnv,
  hasSupabaseEnv,
  supabaseAnonKey,
  supabaseServiceRoleKey,
  supabaseUrl
} from "@/lib/supabase/env";

export function createSupabaseServerClient() {
  if (!hasSupabaseAuthEnv() || !supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Components cannot always mutate cookies. Middleware and route handlers cover it.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        } catch {
          // Server Components cannot always mutate cookies. Middleware and route handlers cover it.
        }
      }
    }
  });
}

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
