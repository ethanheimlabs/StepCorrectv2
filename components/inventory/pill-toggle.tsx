"use client";

import { cn } from "@/lib/utils";

export function PillToggle({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-12 rounded-full border px-4 py-3 text-sm font-semibold leading-tight transition-colors sm:min-h-0 sm:py-2",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-white text-foreground hover:bg-muted"
      )}
    >
      {label}
    </button>
  );
}
