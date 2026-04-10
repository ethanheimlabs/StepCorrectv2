"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface EditableActionItem {
  id: string;
  actionText: string;
  completed?: boolean;
}

export function EditableActionList({
  value,
  onChange,
  checklist = false,
  onToggle
}: {
  value: EditableActionItem[];
  onChange?: (next: EditableActionItem[]) => void;
  checklist?: boolean;
  onToggle?: (id: string, completed: boolean) => void;
}) {
  const [draft, setDraft] = useState("");

  return (
    <div className="space-y-3">
      {value.map((item, index) => (
        <div
          key={item.id}
          className={cn(
            "flex items-start gap-3 rounded-[1.25rem] border border-border/70 bg-white px-4 py-3",
            item.completed && "bg-muted/70"
          )}
        >
          {checklist ? (
            <input
              className="mt-1 h-4 w-4 accent-current"
              type="checkbox"
              checked={Boolean(item.completed)}
              onChange={(event) => onToggle?.(item.id, event.target.checked)}
            />
          ) : null}

          {onChange ? (
            <Input
              className="h-12 border-0 px-0 shadow-none focus-visible:ring-0"
              value={item.actionText}
              onChange={(event) => {
                const next = [...value];
                next[index] = {
                  ...next[index],
                  actionText: event.target.value
                };
                onChange(next);
              }}
            />
          ) : (
            <p className="text-sm leading-6 text-foreground">{item.actionText}</p>
          )}

          {onChange ? (
            <button
              type="button"
              onClick={() => onChange(value.filter((action) => action.id !== item.id))}
              className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
            >
              Remove
            </button>
          ) : null}
        </div>
      ))}

      {onChange ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Add another next right action"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const nextText = draft.trim();

              if (!nextText) {
                return;
              }

              onChange([
                ...value,
                {
                  id: crypto.randomUUID(),
                  actionText: nextText
                }
              ]);
              setDraft("");
            }}
          >
            Add action
          </Button>
        </div>
      ) : null}
    </div>
  );
}
