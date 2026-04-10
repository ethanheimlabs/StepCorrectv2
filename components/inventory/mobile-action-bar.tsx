import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function MobileActionBar({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 -mx-5 mt-8 border-t border-border/80 bg-background/95 px-5 pb-safe pt-4 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:hidden",
        className
      )}
    >
      <div className="space-y-3">{children}</div>
    </div>
  );
}
