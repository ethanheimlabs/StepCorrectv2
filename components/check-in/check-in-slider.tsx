"use client";

import { cn } from "@/lib/utils";

export function CheckInSlider({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">
          {value}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
        {Array.from({ length: 10 }, (_, index) => index + 1).map((scale) => (
          <button
            key={scale}
            type="button"
            onClick={() => onChange(scale)}
            className={cn(
              "rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors",
              value === scale
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-white text-foreground hover:bg-muted"
            )}
          >
            {scale}
          </button>
        ))}
      </div>
    </div>
  );
}
