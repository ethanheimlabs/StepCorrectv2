import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { hasSupabaseAuthEnv, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

export async function updateSupabaseSession(request: NextRequest) {
  if (!hasSupabaseAuthEnv() || !supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({
      request
    });
  }

  let response = NextResponse.next({
    request
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({
          request
        });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({
          request
        });
        response.cookies.set({ name, value: "", ...options, maxAge: 0 });
      }
    }
  });

  await supabase.auth.getUser();

  return response;
}
