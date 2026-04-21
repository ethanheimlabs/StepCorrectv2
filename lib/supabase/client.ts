"use client";

import { createBrowserClient } from "@supabase/ssr";

import { hasSupabaseAuthEnv, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowserClient() {
  if (!hasSupabaseAuthEnv() || !supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
}
