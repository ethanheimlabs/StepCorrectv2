import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { InventoryProgress } from "@/components/inventory/progress";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export function InventoryShell({
  title,
  helperText,
  step,
  children
}: {
  title: string;
  helperText: string;
  step: "capture" | "clarify" | "review" | "actions" | "done";
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-[100svh] w-full max-w-5xl flex-col px-4 pb-safe pt-safe sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge>StepCorrect</Badge>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:hidden">
              Resentment inventory
            </span>
          </div>
          <div>
            <h1 className="font-serif text-[2rem] leading-none tracking-tight text-foreground sm:text-5xl">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-[15px] leading-7 text-muted-foreground sm:text-lg">
              {helperText}
            </p>
          </div>
        </div>

        {!hasSupabaseEnv() ? (
          <div className="w-fit rounded-full border border-border/80 bg-white/80 px-4 py-2 text-sm text-muted-foreground">
            Local demo persistence active
          </div>
        ) : null}
      </div>

      <InventoryProgress current={step} />

      <Card className="mt-6 overflow-visible sm:mt-8 sm:overflow-hidden">
        <CardContent className="p-5 sm:p-8">{children}</CardContent>
      </Card>
    </main>
  );
}
