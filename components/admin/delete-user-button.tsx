"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

export function DeleteUserButton({
  userId,
  fullName,
  disabled = false
}: {
  userId: string;
  fullName: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);

    const confirmed = window.confirm(
      `Delete ${fullName}'s account and all StepCorrect data? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: "DELETE"
        });
        const data = (await response.json()) as { error?: string };

        if (!response.ok) {
          setError(data.error ?? "Could not delete user.");
          return;
        }

        router.refresh();
      } catch {
        setError("Could not delete user.");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        className="border-destructive/25 text-destructive hover:bg-destructive/5"
        disabled={disabled || isPending}
        onClick={handleDelete}
        type="button"
        variant="outline"
      >
        {isPending ? "Deleting..." : disabled ? "Current admin" : "Delete user"}
      </Button>
      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
