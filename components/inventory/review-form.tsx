"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { AffectsToggleGroup } from "@/components/inventory/affects-toggle-group";
import { EditableActionList } from "@/components/inventory/editable-action-list";
import { MobileActionBar } from "@/components/inventory/mobile-action-bar";
import { PatternChips } from "@/components/inventory/pattern-chips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ResentmentExtraction } from "@/lib/types";

export function ReviewForm({
  id,
  initialValue,
  editRawHref
}: {
  id: string;
  initialValue: ResentmentExtraction;
  editRawHref: string;
}) {
  const router = useRouter();
  const [review, setReview] = useState<ResentmentExtraction>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/inventory/${id}/review`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(review)
        });
        const data = (await response.json()) as {
          error?: string;
          nextPath?: string;
        };

        if (!response.ok || !data.nextPath) {
          setError(data.error ?? "Could not save this review.");
          return;
        }

        router.push(data.nextPath as Route);
      } catch {
        setError("Could not save this review.");
      }
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3">
          <Label htmlFor="who_or_what">Who / What</Label>
          <Input
            id="who_or_what"
            value={review.who_or_what}
            onChange={(event) =>
              setReview((current) => ({ ...current, who_or_what: event.target.value }))
            }
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="my_part_controlled">My part</Label>
          <Textarea
            id="my_part_controlled"
            className="min-h-[140px]"
            value={review.my_part_controlled}
            onChange={(event) =>
              setReview((current) => ({
                ...current,
                my_part_controlled: event.target.value
              }))
            }
          />
          <p className="text-sm leading-6 text-muted-foreground">
            My part = what I can control.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="what_happened_facts">What happened (facts)</Label>
        <Textarea
          id="what_happened_facts"
          className="min-h-[160px]"
          value={review.what_happened_facts}
          onChange={(event) =>
            setReview((current) => ({
              ...current,
              what_happened_facts: event.target.value
            }))
          }
        />
        <p className="text-sm leading-6 text-muted-foreground">Facts only. No judgments.</p>
      </div>

      <div className="space-y-3">
        <Label>Affects my…</Label>
        <AffectsToggleGroup
          value={review.affects}
          onChange={(affects) => setReview((current) => ({ ...current, affects }))}
        />
      </div>

      <div className="space-y-3">
        <Label>Patterns</Label>
        <PatternChips
          value={review.defects_or_patterns}
          onChange={(defects_or_patterns) =>
            setReview((current) => ({ ...current, defects_or_patterns }))
          }
        />
      </div>

      <div className="space-y-3">
        <Label>Next right actions</Label>
        <EditableActionList
          value={review.next_right_actions.map((action) => ({
            id: action,
            actionText: action
          }))}
          onChange={(next) =>
            setReview((current) => ({
              ...current,
              next_right_actions: next.map((item) => item.actionText.trim()).filter(Boolean)
            }))
          }
        />
      </div>

      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

      <div className="hidden flex-col gap-3 sm:flex sm:flex-row">
        <Button disabled={isPending} type="submit">
          {isPending ? "Saving..." : "Save & Continue"}
        </Button>
        <Link
          className="inline-flex h-12 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-foreground"
          href={editRawHref as Route}
        >
          Edit raw entry
        </Link>
      </div>

      <MobileActionBar>
        <Button className="w-full" disabled={isPending} type="submit">
          {isPending ? "Saving..." : "Save & Continue"}
        </Button>
        <Link
          className="inline-flex h-12 w-full items-center justify-center rounded-full border border-border bg-white px-5 text-sm font-semibold text-foreground"
          href={editRawHref as Route}
        >
          Edit raw entry
        </Link>
      </MobileActionBar>
    </form>
  );
}
