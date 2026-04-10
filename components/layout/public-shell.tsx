import type { ReactNode } from "react";

import { PublicHeader } from "@/components/layout/public-header";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(250,251,252,0.98),rgba(241,244,248,0.98))]">
      <PublicHeader />
      <main>{children}</main>
      <footer className="border-t border-border/70 bg-background/80">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm leading-6 text-muted-foreground sm:px-6 lg:px-8">
          StepCorrect supports recovery routines. It does not replace meetings, a sponsor,
          therapy, medical care, or emergency services.
        </div>
      </footer>
    </div>
  );
}
