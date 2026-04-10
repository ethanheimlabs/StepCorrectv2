"use client";

import type { DailyCheckIn } from "@/lib/types";
import { cn } from "@/lib/utils";

const HALT_ITEMS = [
  { key: "hungry", label: "Hungry" },
  { key: "angry", label: "Angry" },
  { key: "lonely", label: "Lonely" },
  { key: "tired", label: "Tired" }
] as const;

export function HALTToggleGroup({
  value,
  onChange
}: {
  value: DailyCheckIn["halt"];
  onChange: (value: DailyCheckIn["halt"]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {HALT_ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() =>
            onChange({
              ...value,
              [item.key]: !value[item.key]
            })
          }
          className={cn(
            "rounded-full border px-4 py-3 text-sm font-semibold transition-colors",
            value[item.key]
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-white text-foreground hover:bg-muted"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
