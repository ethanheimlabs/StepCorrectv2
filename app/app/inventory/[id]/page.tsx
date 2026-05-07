import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { SectionCard } from "@/components/app/section-card";
import { PatternInsightSection } from "@/components/feedback/PatternInsightSection";
import { SponsorSummaryCard } from "@/components/inventory/sponsor-summary-card";
import { buttonVariants } from "@/components/ui/button";
import { AFFECT_LABELS } from "@/lib/constants";
import { hasOpenAIApiKey } from "@/lib/openai/client";
import { buildInventoryPatternInsights } from "@/lib/patterns/service";
import { getInventoryEntry, listInventoryActions } from "@/lib/repositories/inventory";

export const dynamic = "force-dynamic";

function renderLines(lines: string[]) {
  return (
    <div className="mt-2 space-y-2">
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}

function renderParagraphLines(value: string) {
  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return <p className="mt-2">{value}</p>;
  }

  return renderLines(lines);
}

function buildPrayer(whoOrWhat: string) {
  return `God, help me be free of anger toward ${whoOrWhat.toLowerCase()}. Show me where I need to be honest, willing, and at peace.`;
}

export default async function InventoryDetailPage({
  params
}: {
  params: { id: string };
}) {
  const showFallbackNotice = !hasOpenAIApiKey();
  const entry = await getInventoryEntry(params.id);

  if (!entry || !entry.extractedResentment) {
    notFound();
  }

  const actions = await listInventoryActions(entry.id);
  const insights = await buildInventoryPatternInsights(entry.userId, entry.id);
  const activeAffects = Object.entries(entry.extractedResentment.affects)
    .filter(([, enabled]) => enabled)
    .map(([key]) => AFFECT_LABELS[key as keyof typeof AFFECT_LABELS]);
  const prayer = buildPrayer(entry.extractedResentment.who_or_what);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Saved"
        description="Keep the lesson. Drop the replay."
        actions={
          <Link className={buttonVariants()} href="/app/inventory/new">
            Start another inventory
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Final inventory" description="Read-only and ready when you need it.">
          <div className="space-y-5 text-sm leading-7 text-foreground">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Raw entry
              </p>
              <p className="mt-2">{entry.rawText}</p>
            </div>
            {entry.clarificationText ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Clarification
                </p>
                <p className="mt-2">{entry.clarificationText}</p>
              </div>
            ) : null}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                1. Who am I resentful at?
              </p>
              <p className="mt-2">{entry.extractedResentment.who_or_what}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                2. What happened?
              </p>
              <p className="mt-2">{entry.extractedResentment.what_happened_facts}</p>
            </div>
            {entry.extractedResentment.affected_parts_detail.length ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  3. What part of me was affected?
                </p>
                {renderLines(entry.extractedResentment.affected_parts_detail)}
                {activeAffects.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeAffects.map((affect) => (
                      <div
                        key={affect}
                        className="rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-foreground"
                      >
                        {affect}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            {entry.extractedResentment.felt_reactions.length ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  4. What did it make me feel?
                </p>
                {renderLines(entry.extractedResentment.felt_reactions)}
              </div>
            ) : null}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                5. What was my part?
              </p>
              {renderParagraphLines(entry.extractedResentment.my_part_controlled)}
            </div>
            {entry.extractedResentment.fear_inventory.length ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  6. What was I afraid of?
                </p>
                {renderLines(entry.extractedResentment.fear_inventory)}
              </div>
            ) : null}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                7. What character defects showed up?
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {entry.extractedResentment.defects_or_patterns.map((pattern) => (
                  <div
                    key={pattern}
                    className="rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-foreground"
                  >
                    {pattern.replace(/_/g, " ")}
                  </div>
                ))}
              </div>
            </div>
            {entry.extractedResentment.acceptance_needed.length ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  8. What do I need to accept?
                </p>
                {renderLines(entry.extractedResentment.acceptance_needed)}
              </div>
            ) : null}
            {entry.extractedResentment.spiritual_truths.length ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  9. What is the spiritual truth?
                </p>
                {renderLines(entry.extractedResentment.spiritual_truths)}
              </div>
            ) : null}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                10. What is the corrective action?
              </p>
              <div className="mt-2 space-y-2">
                {actions.map((action) => (
                  <div
                    key={action.id}
                    className="rounded-[1.25rem] border border-border/70 bg-white px-4 py-3"
                  >
                    {action.actionText}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Prayer:
              </p>
              <p className="mt-2">{prayer}</p>
            </div>
          </div>
        </SectionCard>

        <SponsorSummaryCard summary={entry.shareableSummary ?? ""} />
      </div>
      <PatternInsightSection
        cards={insights.cards}
        summary={insights.summary}
        showFallbackNotice={showFallbackNotice}
      />
    </div>
  );
}
