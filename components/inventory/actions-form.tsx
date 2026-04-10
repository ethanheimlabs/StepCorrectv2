"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { EditableActionList } from "@/components/inventory/editable-action-list";
import { MobileActionBar } from "@/components/inventory/mobile-action-bar";
import { SponsorSummaryCard } from "@/components/inventory/sponsor-summary-card";
import { Button } from "@/components/ui/button";
import type { InventoryAction } from "@/lib/types";

export function ActionsForm({
  id,
  summary,
  initialActions
}: {
  id: string;
  summary: string;
  initialActions: InventoryAction[];
}) {
  const router = useRouter();
  const [actions, setActions] = useState(initialActions);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/inventory/${id}/finish`, {
          method: "POST"
        });
        const data = (await response.json()) as {
          error?: string;
          nextPath?: string;
        };

        if (!response.ok || !data.nextPath) {
          setError(data.error ?? "Could not finish the inventory.");
          return;
        }

        router.push(data.nextPath as Route);
      } catch {
        setError("Could not finish the inventory.");
      }
    });
  }

  async function handleShare() {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <EditableActionList
        checklist
        value={actions.map((action) => ({
          id: action.id,
          actionText: action.actionText,
          completed: action.completed
        }))}
        onToggle={(actionId, completed) => {
          setActions((current) =>
            current.map((action) =>
              action.id === actionId
                ? {
                    ...action,
                    completed
                  }
                : action
            )
          );

          void fetch(`/api/inventory/${id}/actions`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ actionId, completed })
          });
        }}
      />

      <SponsorSummaryCard summary={summary} />

      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

      <div className="hidden flex-col gap-3 sm:flex sm:flex-row">
        <Button disabled={isPending} type="submit">
          {isPending ? "Finishing..." : "Mark done & Finish"}
        </Button>
        <Button type="button" variant="outline" onClick={handleShare}>
          {copied ? "Copied" : "Share summary with sponsor"}
        </Button>
      </div>

      <MobileActionBar>
        <Button className="w-full" disabled={isPending} type="submit">
          {isPending ? "Finishing..." : "Mark done & Finish"}
        </Button>
        <Button className="w-full" type="button" variant="outline" onClick={handleShare}>
          {copied ? "Copied" : "Share summary with sponsor"}
        </Button>
      </MobileActionBar>
    </form>
  );
}
