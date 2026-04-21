import { redirect } from "next/navigation";

import { DEFAULT_TONE_MODE, DEMO_USER_ID, DEMO_USER_NAME } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseAuthEnv } from "@/lib/supabase/env";

export type CurrentUser = {
  id: string;
  email: string | null;
  fullName: string;
  toneMode: typeof DEFAULT_TONE_MODE;
};

export async function getCurrentUser() {
  if (hasSupabaseAuthEnv()) {
    const supabase = createSupabaseServerClient();

    if (!supabase) {
      return null;
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const metadata = user.user_metadata ?? {};
    const fullName =
      typeof metadata.full_name === "string" && metadata.full_name.trim()
        ? metadata.full_name.trim()
        : typeof metadata.name === "string" && metadata.name.trim()
          ? metadata.name.trim()
          : user.email?.split("@")[0] ?? "Member";

    return {
      id: user.id,
      email: user.email ?? null,
      fullName,
      toneMode: DEFAULT_TONE_MODE
    } satisfies CurrentUser;
  }

  return {
    id: DEMO_USER_ID,
    email: null,
    fullName: DEMO_USER_NAME,
    toneMode: DEFAULT_TONE_MODE
  } satisfies CurrentUser;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
