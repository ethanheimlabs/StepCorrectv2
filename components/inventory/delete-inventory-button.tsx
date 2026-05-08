"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DeleteInventoryButton({
  inventoryId,
  className
}: {
  inventoryId: string;
  className?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);

    const confirmed = window.confirm(
      "Delete this inventory? This will remove the entry and its action list."
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/inventory/${inventoryId}`, {
          method: "DELETE"
        });
        const data = (await response.json()) as {
          error?: string;
          nextPath?: string;
        };

        if (!response.ok) {
          setError(data.error ?? "Could not delete inventory.");
          return;
        }

        router.replace((data.nextPath ?? "/app/inventory") as Route);
        router.refresh();
      } catch {
        setError("Could not delete inventory.");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        className={cn(
          buttonVariants({ variant: "outline" }),
          "border-destructive/25 text-destructive hover:bg-destructive/5",
          className
        )}
        disabled={isPending}
        onClick={handleDelete}
        type="button"
      >
        {isPending ? "Deleting..." : "Delete inventory"}
      </button>
      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
