import { hasSupabaseEnv } from "@/lib/supabase/env";

function envFlag(name: string) {
  const value = process.env[name]?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

export function isDemoSeedEnabled() {
  return envFlag("STEPCORRECT_ENABLE_DEMO_SEED");
}

export function shouldUseSeededFallbackStore() {
  return !hasSupabaseEnv() && (process.env.NODE_ENV !== "production" || isDemoSeedEnabled());
}

export function isLaunchDemoMode() {
  return process.env.NODE_ENV === "production" && !hasSupabaseEnv() && isDemoSeedEnabled();
}
