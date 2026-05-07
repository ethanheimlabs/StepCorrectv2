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

function listToTextarea(values: string[]) {
  return values.join("\n");
}

function textareaToList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

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
          <Label htmlFor="who_or_what">Who am I resentful at?</Label>
          <Input
            id="who_or_what"
            value={review.who_or_what}
            onChange={(event) =>
              setReview((current) => ({ ...current, who_or_what: event.target.value }))
            }
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="my_part_controlled">What was my part?</Label>
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
            Keep this to what you can own, change, or do differently now.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="what_happened_facts">What happened?</Label>
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

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3">
          <Label htmlFor="affected_parts_detail">What part of me was affected?</Label>
          <Textarea
            id="affected_parts_detail"
            className="min-h-[180px]"
            value={listToTextarea(review.affected_parts_detail)}
            onChange={(event) =>
              setReview((current) => ({
                ...current,
                affected_parts_detail: textareaToList(event.target.value)
              }))
            }
          />
          <p className="text-sm leading-6 text-muted-foreground">
            One short line per area that got hit.
          </p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="felt_reactions">What did it make me feel?</Label>
          <Textarea
            id="felt_reactions"
            className="min-h-[180px]"
            value={listToTextarea(review.felt_reactions)}
            onChange={(event) =>
              setReview((current) => ({
                ...current,
                felt_reactions: textareaToList(event.target.value)
              }))
            }
          />
          <p className="text-sm leading-6 text-muted-foreground">
            Keep each line short and plain.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Affects my…</Label>
        <AffectsToggleGroup
          value={review.affects}
          onChange={(affects) => setReview((current) => ({ ...current, affects }))}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3">
          <Label htmlFor="fear_inventory">What was I afraid of?</Label>
          <Textarea
            id="fear_inventory"
            className="min-h-[180px]"
            value={listToTextarea(review.fear_inventory)}
            onChange={(event) =>
              setReview((current) => ({
                ...current,
                fear_inventory: textareaToList(event.target.value)
              }))
            }
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="acceptance_needed">What do I need to accept?</Label>
          <Textarea
            id="acceptance_needed"
            className="min-h-[180px]"
            value={listToTextarea(review.acceptance_needed)}
            onChange={(event) =>
              setReview((current) => ({
                ...current,
                acceptance_needed: textareaToList(event.target.value)
              }))
            }
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>What character defects showed up?</Label>
        <PatternChips
          value={review.defects_or_patterns}
          onChange={(defects_or_patterns) =>
            setReview((current) => ({ ...current, defects_or_patterns }))
          }
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="spiritual_truths">What is the spiritual truth?</Label>
        <Textarea
          id="spiritual_truths"
          className="min-h-[160px]"
          value={listToTextarea(review.spiritual_truths)}
          onChange={(event) =>
            setReview((current) => ({
              ...current,
              spiritual_truths: textareaToList(event.target.value)
            }))
          }
        />
        <p className="text-sm leading-6 text-muted-foreground">
          Keep it grounded and practical, not preachy.
        </p>
      </div>

      <div className="space-y-3">
        <Label>What is the corrective action?</Label>
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
