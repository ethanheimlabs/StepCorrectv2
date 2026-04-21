"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
      disabled={isPending}
      type="button"
      onClick={() =>
        startTransition(async () => {
          const supabase = createSupabaseBrowserClient();

          if (!supabase) {
            router.replace("/login");
            router.refresh();
            return;
          }

          await supabase.auth.signOut();
          router.replace("/login");
          router.refresh();
        })
      }
    >
      {isPending ? "Signing out..." : "Log out"}
    </button>
  );
}
