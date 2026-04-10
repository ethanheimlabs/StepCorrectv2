"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function PatternChips({
  value,
  onChange
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function addPattern() {
    const next = draft.trim().toLowerCase().replace(/\s+/g, "_");

    if (!next || value.includes(next)) {
      return;
    }

    onChange([...value, next]);
    setDraft("");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {value.map((pattern) => (
          <button
            key={pattern}
            type="button"
            onClick={() => onChange(value.filter((item) => item !== pattern))}
            className={cn(
              "rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            )}
          >
            {pattern.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Add a pattern"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button type="button" variant="outline" onClick={addPattern}>
          Add pattern
        </Button>
      </div>
    </div>
  );
}
