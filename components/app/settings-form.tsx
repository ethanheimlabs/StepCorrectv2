"use client";

import type { ChangeEvent } from "react";
import { useState, useTransition } from "react";

import { TONE_MODE_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/lib/types";

export function SettingsForm({ profile }: { profile: Profile }) {
  const [fullName, setFullName] = useState(profile.fullName ?? "");
  const [sobrietyDate, setSobrietyDate] = useState(profile.sobrietyDate ?? "");
  const [toneMode, setToneMode] = useState(profile.toneMode ?? "Direct");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            fullName,
            sobrietyDate,
            toneMode
          })
        });
        const data = (await response.json()) as { error?: string; message?: string };

        if (!response.ok) {
          setError(data.error ?? "Could not save settings.");
          return;
        }

        setMessage(data.message ?? "Settings saved.");
      } catch {
        setError("Could not save settings.");
      }
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3">
          <Label htmlFor="fullName">Name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="sobrietyDate">Sobriety date</Label>
          <Input
            id="sobrietyDate"
            type="date"
            value={sobrietyDate}
            onChange={(event) => setSobrietyDate(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="toneMode">Tone mode</Label>
        <select
          id="toneMode"
          className="flex h-12 w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm text-foreground shadow-sm outline-none"
          value={toneMode}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            setToneMode(event.target.value as Profile["toneMode"] ?? "Direct")
          }
        >
          {TONE_MODE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
          Reminder preferences placeholder. Daily nudges and sponsor-summary reminders will live
          here.
        </div>
        <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
          Privacy note: keep sensitive details minimal when you plan to share a summary.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
          Export placeholder.
        </div>
        <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
          Delete account placeholder.
        </div>
      </div>

      {message ? <p className="text-sm font-medium text-foreground">{message}</p> : null}
      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

      <Button disabled={isPending} type="submit">
        {isPending ? "Saving..." : "Save settings"}
      </Button>
    </form>
  );
}
