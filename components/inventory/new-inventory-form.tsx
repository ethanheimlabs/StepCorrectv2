"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { LoadingStateCard } from "@/components/app/loading-state-card";
import {
  consumeProgressStream,
  type InventoryProgressStatus
} from "@/lib/inventory/progress-stream";
import { MobileActionBar } from "@/components/inventory/mobile-action-bar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function NewInventoryForm() {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
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
        title: "Sorting this into the right inventory…",
        description: "Give it a second. We’re organizing the facts before the story runs away."
      }
    ]);

    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-stepcorrect-stream": "1"
        },
        body: JSON.stringify({ rawText })
      });

      if (!response.ok && !response.body) {
        const data = (await response.json()) as {
          error?: string;
        };
        setError(data.error ?? "Could not start this inventory.");
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
        setError("Could not start this inventory.");
        return;
      }

      router.push(nextPath as Route);
    } catch {
      setError("Could not start this inventory.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-3">
        <Label htmlFor="rawText">Dump it here. Keep it honest.</Label>
        <Textarea
          id="rawText"
          name="rawText"
          className="min-h-[240px] sm:min-h-[160px]"
          placeholder="I’m resentful at my sister..."
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
        />
        <p className="text-sm leading-6 text-muted-foreground">
          Start with who or what you’re resentful at. We’ll help sort the rest.
        </p>
      </div>

      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

      {isSubmitting ? (
        <LoadingStateCard
          title={history[history.length - 1]?.title ?? "Sorting this into the right inventory…"}
          description={
            history[history.length - 1]?.description ??
            "Give it a second. We’re organizing the facts before the story runs away."
          }
          history={history}
          previewText={previewText}
        />
      ) : null}

      <div className="hidden flex-col gap-3 sm:flex sm:flex-row">
        <Button className="sm:min-w-[170px]" disabled={isSubmitting} type="submit">
          Continue
        </Button>
        <Button disabled type="button" variant="outline">
          Voice note
        </Button>
      </div>

      <MobileActionBar>
        <Button className="w-full" disabled={isSubmitting} type="submit">
          Continue
        </Button>
        <Button className="w-full" disabled type="button" variant="outline">
          Voice note
        </Button>
      </MobileActionBar>
    </form>
  );
}
