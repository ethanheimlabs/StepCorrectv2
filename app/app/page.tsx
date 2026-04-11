import Link from "next/link";

import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { SectionCard } from "@/components/app/section-card";
import { SafetyNotice } from "@/components/app/safety-notice";
import { PatternInsightSection } from "@/components/feedback/PatternInsightSection";
import { InventoryCard } from "@/components/inventory/inventory-card";
import { buttonVariants } from "@/components/ui/button";
import { hasOpenAIApiKey } from "@/lib/openai/client";
import { getLatestDailyCheckIn } from "@/lib/repositories/checkins";
import {
  buildInventoryPatternInsights,
  getWeeklyPatternReflection
} from "@/lib/patterns/service";
import { listInventoryActions, listInventoryEntries } from "@/lib/repositories/inventory";
import { listStepProgress } from "@/lib/repositories/steps";
import { getCurrentUser } from "@/lib/session";
import { formatGreetingDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const showFallbackNotice = !hasOpenAIApiKey();
  const user = await getCurrentUser();
  const [entries, steps, latestCheckIn] = await Promise.all([
    listInventoryEntries(user.id),
    listStepProgress(user.id),
    getLatestDailyCheckIn(user.id)
  ]);
  const [latestInsights, weeklyReflection] = await Promise.all([
    entries[0] ? buildInventoryPatternInsights(user.id, entries[0].id) : null,
    getWeeklyPatternReflection(user.id)
  ]);
  const recentEntries = entries.slice(0, 3);
  const latestEntry = entries[0] ?? null;
  const latestActions = latestEntry ? await listInventoryActions(latestEntry.id) : [];
  const nextAction = latestActions.find((action) => !action.completed) ?? latestActions[0] ?? null;
  const latestCompleted = entries.find((entry) => entry.status === "completed") ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={formatGreetingDate()}
        title="How are you today?"
        description="Keep it honest, keep it simple, and keep moving."
        actions={
          <>
            <Link className={buttonVariants()} href="/app/inventory/new">
              Start an inventory
            </Link>
            <Link className={buttonVariants({ variant: "outline" })} href="/app/check-in">
              Daily check-in
            </Link>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <SectionCard
            title="Today’s check-in"
            description="Short and direct. Spot the pressure before it starts running the day."
          >
            <p className="text-sm leading-7 text-muted-foreground">
              {latestCheckIn
                ? `Latest check-in: mood ${latestCheckIn.mood}/10, craving ${latestCheckIn.craving}/10.`
                : "No check-in saved yet today."}
            </p>
            <Link className={buttonVariants({ className: "mt-5" })} href="/app/check-in">
              Open check-in
            </Link>
          </SectionCard>

          <SectionCard
            title="Recent reflections"
            description="A short list of what you’ve already written down."
          >
            {recentEntries.length ? (
              <div className="grid gap-4">
                {recentEntries.map((entry) => (
                  <InventoryCard key={entry.id} entry={entry} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No inventory yet"
                description="The first one is usually enough to clear some air."
                action={
                  <Link className={buttonVariants()} href="/app/inventory/new">
                    Start an inventory
                  </Link>
                }
              />
            )}
          </SectionCard>

          {latestInsights ? (
            <PatternInsightSection
              cards={latestInsights.cards}
              summary={latestInsights.summary}
              showFallbackNotice={showFallbackNotice}
            />
          ) : null}
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Today’s next right action"
            description="One clean move beats another hour in your head."
          >
            <p className="text-base leading-7 text-foreground">
              {nextAction?.actionText ?? "Start an inventory and let the next action reveal itself."}
            </p>
          </SectionCard>

          <SectionCard title="Step work" description="A quick look at where your current focus sits.">
            <div className="space-y-3">
              {steps.slice(0, 4).map((step) => (
                <div
                  key={step.id}
                  className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-border/70 bg-white px-4 py-3"
                >
                  <p className="text-sm font-semibold text-foreground">Step {step.stepNumber}</p>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {step.status.replace("_", " ")}
                  </p>
                </div>
              ))}
            </div>
            <Link
              className={buttonVariants({ variant: "outline", className: "mt-5" })}
              href="/app/steps"
            >
              Open step hub
            </Link>
          </SectionCard>

          <SectionCard
            title="Sponsor summary shortcut"
            description="Share the clean version when you need outside eyes."
          >
            <p className="text-sm leading-7 text-muted-foreground">
              {latestCompleted?.shareableSummary
                ? latestCompleted.shareableSummary
                : "Finish an inventory and the summary will be ready here."}
            </p>
            {latestCompleted ? (
              <Link
                className={buttonVariants({ variant: "outline", className: "mt-5" })}
                href={`/app/inventory/${latestCompleted.id}`}
              >
              Open latest summary
            </Link>
            ) : null}
          </SectionCard>

          <SectionCard
            title="Weekly reflection"
            description="A grounded read on what this week has been showing you."
          >
            <div className="space-y-4">
              <div className="grid gap-3">
                <div className="rounded-[1.25rem] border border-border/70 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    This week&apos;s pattern
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    {[
                      weeklyReflection.summary.recurring_people_or_topics[0],
                      weeklyReflection.summary.top_patterns[0]
                    ]
                      .filter(Boolean)
                      .join(" / ") || "Still taking shape"}
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-border/70 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    What got hit most
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    {weeklyReflection.summary.top_affected_areas[0] ?? "Not enough data yet"}
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-border/70 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    What helped
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    {weeklyReflection.summary.actions_that_help[0] ?? "Still learning from follow-up"}
                  </p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-border/70 bg-secondary/45 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  This week&apos;s reflection
                </p>
                <p className="mt-3 text-sm leading-7 text-foreground">{weeklyReflection.reflection}</p>
              </div>
            </div>
          </SectionCard>

          <SafetyNotice compact />
        </div>
      </div>
    </div>
  );
}
