"use client";

import { AFFECT_LABELS } from "@/lib/constants";
import type { AffectFlags } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AffectsToggleGroup({
  value,
  onChange
}: {
  value: AffectFlags;
  onChange: (next: AffectFlags) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {Object.entries(AFFECT_LABELS).map(([key, label]) => {
        const typedKey = key as keyof AffectFlags;

        return (
          <button
            key={key}
            type="button"
            onClick={() =>
              onChange({
                ...value,
                [typedKey]: !value[typedKey]
              })
            }
            className={cn(
              "rounded-full border px-4 py-3 text-sm font-semibold transition-colors",
              value[typedKey]
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-white text-foreground hover:bg-muted"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
