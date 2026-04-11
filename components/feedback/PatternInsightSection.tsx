import type { FeedbackCardSet, PatternSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

import { AIFallbackNotice } from "./AIFallbackNotice";
import { FeedbackCardGrid } from "./FeedbackCardGrid";

function buildMeta(summary: PatternSummary) {
  const completionRate = summary.stats.total_actions
    ? `${Math.round(summary.stats.action_completion_rate * 100)}% action follow-through`
    : null;
  const recurrenceWindow =
    summary.stats.top_day_of_week && summary.stats.top_time_of_day
      ? `${summary.stats.top_day_of_week} / ${summary.stats.top_time_of_day}`
      : summary.stats.top_day_of_week ?? summary.stats.top_time_of_day;

  return [
    summary.recurring_people_or_topics[0]
      ? `Keeps showing up: ${summary.recurring_people_or_topics[0]}`
      : null,
    summary.top_affected_areas[0]
      ? `Gets hit most: ${summary.top_affected_areas[0]}`
      : null,
    completionRate,
    recurrenceWindow ? `Usual window: ${recurrenceWindow}` : null,
    summary.similar_entry_count > 0
      ? `Similar prior entries: ${summary.similar_entry_count}`
      : null
  ].filter((item): item is string => Boolean(item));
}

export function PatternInsightSection({
  cards,
  summary,
  showFallbackNotice = false,
  className
}: {
  cards: FeedbackCardSet;
  summary: PatternSummary;
  showFallbackNotice?: boolean;
  className?: string;
}) {
  const meta = buildMeta(summary);

  return (
    <section
      className={cn(
        "rounded-[2rem] border border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(240,244,248,0.9))] p-5 shadow-[0_22px_70px_-36px_rgba(32,51,84,0.45)] sm:p-6",
        className
      )}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            What StepCorrect is noticing
          </p>
          <h2 className="mt-3 font-serif text-[2rem] leading-tight text-foreground">
            Short, grounded pattern feedback from what you’ve already written.
          </h2>
        </div>

        {meta.length ? (
          <div className="flex flex-wrap gap-2">
            {meta.map((item) => (
              <div
                key={item}
                className="rounded-full border border-border/70 bg-white/90 px-3 py-1 text-xs font-semibold text-muted-foreground"
              >
                {item}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        {showFallbackNotice ? <AIFallbackNotice /> : null}
        <FeedbackCardGrid cards={cards} />
      </div>
    </section>
  );
}
