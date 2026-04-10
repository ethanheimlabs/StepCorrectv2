"use client";

import { useState, useTransition } from "react";

import { CheckInSlider } from "@/components/check-in/check-in-slider";
import { HALTToggleGroup } from "@/components/check-in/halt-toggle-group";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DailyCheckIn } from "@/lib/types";

const INITIAL_HALT: DailyCheckIn["halt"] = {
  hungry: false,
  angry: false,
  lonely: false,
  tired: false
};

export function CheckInForm() {
  const [mood, setMood] = useState(6);
  const [craving, setCraving] = useState(3);
  const [halt, setHalt] = useState(INITIAL_HALT);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guidance, setGuidance] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/check-in", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            mood,
            craving,
            halt,
            note
          })
        });
        const data = (await response.json()) as { error?: string; guidance?: string };

        if (!response.ok || !data.guidance) {
          setError(data.error ?? "Could not save the check-in.");
          return;
        }

        setGuidance(data.guidance);
      } catch {
        setError("Could not save the check-in.");
      }
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <CheckInSlider label="Mood" value={mood} onChange={setMood} />
      <CheckInSlider label="Craving" value={craving} onChange={setCraving} />

      <div className="space-y-3">
        <Label>HALT</Label>
        <HALTToggleGroup value={halt} onChange={setHalt} />
      </div>

      <div className="space-y-3">
        <Label htmlFor="note">Short note</Label>
        <Textarea
          id="note"
          className="min-h-[140px]"
          placeholder="What feels most important right now?"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>

      {guidance ? (
        <div className="rounded-[1.5rem] border border-border/70 bg-secondary/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Next step
          </p>
          <p className="mt-2 text-sm leading-7 text-secondary-foreground">{guidance}</p>
        </div>
      ) : null}

      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

      <Button disabled={isPending} type="submit">
        {isPending ? "Saving..." : "Save check-in"}
      </Button>
    </form>
  );
}
