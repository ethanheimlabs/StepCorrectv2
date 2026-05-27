"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function cleanSponsorSummary(summary: string) {
  return summary
    .replace(/\bmt landlord\b/gi, "my landlord")
    .replace(/\brasing\b/gi, "raising")
    .replace(
      /Resentful at ([^.]+?) for i'?m resentful at [^.]+? for ([^.]+)\./gi,
      (_match, target: string, facts: string) =>
        `Resentful at ${target.trim().toLowerCase()} for ${facts.trim().toLowerCase()}.`
    )
    .replace(
      /Resentful at ([^.]+?) for i am resentful at [^.]+? for ([^.]+)\./gi,
      (_match, target: string, facts: string) =>
        `Resentful at ${target.trim().toLowerCase()} for ${facts.trim().toLowerCase()}.`
    )
    .replace(/\bI'm afraid that i\b/g, "I'm afraid I")
    .replace(/\bMy part is i\b/g, "My part is I")
    .replace(/([.!?]\s+)i\b/g, "$1I")
    .replace(/\.\./g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

export function SponsorSummaryCard({
  summary,
  title = "Sponsor summary"
}: {
  summary: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);
  const cleanSummary = cleanSponsorSummary(summary);

  async function handleCopy() {
    await navigator.clipboard.writeText(cleanSummary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {title}
            </p>
            <h3 className="mt-2 font-serif text-2xl text-foreground">Ready to share cleanly.</h3>
          </div>
          <Button type="button" variant="outline" onClick={handleCopy}>
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <p className="text-sm leading-7 text-foreground">{cleanSummary}</p>
      </CardContent>
    </Card>
  );
}
