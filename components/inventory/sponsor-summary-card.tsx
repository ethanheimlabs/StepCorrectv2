"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function SponsorSummaryCard({
  summary,
  title = "Sponsor summary"
}: {
  summary: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(summary);
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
        <p className="text-sm leading-7 text-foreground">{summary}</p>
      </CardContent>
    </Card>
  );
}
