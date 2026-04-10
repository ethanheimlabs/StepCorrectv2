"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { LoadingStateCard } from "@/components/app/loading-state-card";
import { CLARIFY_QUICK_CHIPS } from "@/lib/constants";
import {
  consumeProgressStream,
  type InventoryProgressStatus
} from "@/lib/inventory/progress-stream";
import { MobileActionBar } from "@/components/inventory/mobile-action-bar";
import { PillToggle } from "@/components/inventory/pill-toggle";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ClarifyForm({
  id,
  question,
  defaultValue
}: {
  id: string;
  question: string;
  defaultValue?: string | null;
}) {
  const router = useRouter();
  const [answer, setAnswer] = useState(defaultValue ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<InventoryProgressStatus[]>([]);
  const [previewText, setPreviewText] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    setPreviewText("");
    setHistory([
      {
        title: "Building your columns…",
        description: "We’re turning the resentment into something you can actually work with."
      }
    ]);

    try {
      const response = await fetch(`/api/inventory/${id}/clarify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-stepcorrect-stream": "1"
        },
        body: JSON.stringify({ answer })
      });

      if (!response.ok && !response.body) {
        const data = (await response.json()) as {
          error?: string;
        };
        setError(data.error ?? "Could not save that answer.");
        setIsSubmitting(false);
        return;
      }

      let nextPath: string | null = null;
      let streamError: string | null = null;

      await consumeProgressStream(response, {
        onStatus(event) {
          setHistory((current) => {
            const last = current[current.length - 1];

            if (
              last &&
              last.title === event.title &&
              last.description === event.description
            ) {
              return current;
            }

            return [...current, event];
          });
        },
        onPreviewDelta(delta) {
          setPreviewText((current) => current + delta);
        },
        onComplete(event) {
          nextPath = event.nextPath;
        },
        onError(message) {
          streamError = message;
        }
      });

      if (streamError) {
        setError(streamError);
        return;
      }

      if (!nextPath) {
        setError("Could not save that answer.");
        return;
      }

      router.push(nextPath as Route);
    } catch {
      setError("Could not save that answer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="rounded-[1.5rem] bg-secondary/70 p-5 text-[15px] leading-7 text-secondary-foreground">
        {question}
      </div>

      <div className="space-y-3">
        <Label>Quick picks</Label>
        <div className="flex flex-wrap gap-3">
          {CLARIFY_QUICK_CHIPS.map((chip) => (
            <PillToggle
              key={chip}
              active={answer === chip}
              label={chip}
              onClick={() => setAnswer(chip)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="clarification">Say what happened. Skip the speech.</Label>
        <Textarea
          id="clarification"
          name="clarification"
          className="min-h-[180px]"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
        />
        <p className="text-sm leading-6 text-muted-foreground">
          Keep it concrete: words, actions, and the moment it turned.
        </p>
      </div>

      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

      {isSubmitting ? (
        <LoadingStateCard
          title={history[history.length - 1]?.title ?? "Building your columns…"}
          description={
            history[history.length - 1]?.description ??
            "We’re turning the resentment into something you can actually work with."
          }
          history={history}
          previewText={previewText}
        />
      ) : null}

      <Button className="hidden sm:inline-flex" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Building your columns..." : "Continue"}
      </Button>

      <MobileActionBar>
        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Building your columns..." : "Continue"}
        </Button>
      </MobileActionBar>
    </form>
  );
}
