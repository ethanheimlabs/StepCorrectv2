import { z } from "zod";

import { getOpenAIModel, hasOpenAIApiKey, parseStructuredResponse } from "@/lib/openai/client";
import { feedbackCardsPrompt, weeklyReflectionPrompt } from "@/lib/openai/prompts";
import type { FeedbackCardSet, PatternSummary } from "@/lib/types";

const feedbackCardSchema = z.object({
  pattern_card: z.string(),
  impact_card: z.string(),
  behavior_card: z.string(),
  next_right_action_card: z.string()
});

const weeklyReflectionSchema = z.object({
  reflection: z.string()
});

function formatList(values: string[]) {
  return values.length ? values.join(", ") : "none noted yet";
}

function humanize(value: string) {
  return value.replace(/_/g, " ").trim();
}

function capitalize(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function joinTop(values: string[], limit = 2) {
  const items = values.map(humanize).filter(Boolean).slice(0, limit);

  if (!items.length) {
    return "";
  }

  if (items.length === 1) {
    return items[0];
  }

  return `${items[0]} and ${items[1]}`;
}

function firstMeaningful(values: string[]) {
  return values.map(humanize).find(Boolean) ?? null;
}

function buildSummaryFacts(summary: PatternSummary) {
  return [
    `Total entries: ${summary.total_entries}`,
    `Recurring people or topics: ${formatList(summary.recurring_people_or_topics)}`,
    `Top affected areas: ${formatList(summary.top_affected_areas)}`,
    `Top patterns: ${formatList(summary.top_patterns)}`,
    `Similar prior entries: ${summary.similar_entry_count}`,
    `Actions that seem to help: ${formatList(summary.actions_that_help)}`,
    `Trend notes: ${formatList(summary.trend_notes)}`,
    `Top trigger subjects: ${formatList(summary.stats.top_trigger_subjects)}`,
    `Top repeated people: ${formatList(summary.stats.top_repeated_people)}`,
    `Action completion rate: ${Math.round(summary.stats.action_completion_rate * 100)}%`,
    `Same-day action rate: ${Math.round(summary.stats.same_day_action_rate * 100)}%`,
    `Helpful action signals: ${formatList(summary.stats.helpful_action_signals)}`,
    `Incomplete action loops: ${formatList(summary.stats.incomplete_action_loops)}`,
    `Top day of week: ${summary.stats.top_day_of_week ?? "none noted yet"}`,
    `Top time of day: ${summary.stats.top_time_of_day ?? "none noted yet"}`
  ].join("\n");
}

function buildPatternCard(summary: PatternSummary) {
  const repeatedPerson = firstMeaningful(summary.stats.top_repeated_people);
  const repeatedTopic = firstMeaningful(summary.recurring_people_or_topics);
  const triggerSubject = firstMeaningful(summary.stats.top_trigger_subjects);
  const anchor = repeatedPerson ?? repeatedTopic ?? triggerSubject ?? "This pattern";

  if (summary.similar_entry_count >= 2) {
    return `${capitalize(anchor)} keeps coming back. You've been in this lane before.`;
  }

  if (summary.total_entries >= 2) {
    return `${capitalize(anchor)} is becoming a repeat theme.`;
  }

  return `${capitalize(anchor)} is the clearest thread in this entry so far.`;
}

function buildImpactCard(summary: PatternSummary) {
  const impacts = joinTop(summary.top_affected_areas, 2);

  if (impacts) {
    return `${capitalize(impacts)} tend to get hit first when this comes up.`;
  }

  const triggerSubject = firstMeaningful(summary.stats.top_trigger_subjects);

  if (triggerSubject) {
    return `${capitalize(triggerSubject)} seems to land fast when the pressure comes on.`;
  }

  return "This tends to land hard once the resentment gets moving.";
}

function buildBehaviorCard(summary: PatternSummary) {
  const topPatterns = joinTop(summary.top_patterns, 2);
  const helpfulSignal = firstMeaningful(summary.stats.helpful_action_signals);
  const incompleteLoop = firstMeaningful(summary.stats.incomplete_action_loops);
  const fearTrend = summary.trend_notes.find((note) => /fear of /i.test(note));

  if (topPatterns && helpfulSignal) {
    return `${capitalize(topPatterns)} tend to show up here. ${capitalize(helpfulSignal)} seems to help when you actually do it.`;
  }

  if (fearTrend) {
    return fearTrend;
  }

  if (topPatterns && incompleteLoop) {
    return `${capitalize(topPatterns)} keep showing up, and ${incompleteLoop} often gets left undone.`;
  }

  if (summary.trend_notes[0]) {
    return summary.trend_notes[0];
  }

  if (topPatterns) {
    return `${capitalize(topPatterns)} keep showing up in the middle of it.`;
  }

  return "Your repeat move is getting clearer as you keep writing it down.";
}

function buildNextActionCard(summary: PatternSummary) {
  const helpfulAction = firstMeaningful(summary.actions_that_help);
  const helpfulSignal = firstMeaningful(summary.stats.helpful_action_signals);
  const incompleteLoop = firstMeaningful(summary.stats.incomplete_action_loops);

  if (helpfulAction) {
    return `Today's move: ${helpfulAction.replace(/\.$/, "")}.`;
  }

  if (helpfulSignal) {
    return `Today's move: ${helpfulSignal.replace(/\.$/, "")}.`;
  }

  if (incompleteLoop) {
    return `Today's move: follow through on ${incompleteLoop.replace(/\.$/, "")} before the loop builds momentum.`;
  }

  return "Today's move: write the facts, don't react, and take one clean action.";
}

function normalizeGeneratedCard(summary: PatternSummary, value: string, fallback: string) {
  const text = value.trim();

  if (!text) {
    return fallback;
  }

  const lower = text.toLowerCase();

  if (
    /\bthis situation\b/.test(lower) ||
    /\byour peace\b/.test(lower) ||
    /\bstill learning\b/.test(lower) ||
    /\bstarting to stand out\b/.test(lower)
  ) {
    return fallback;
  }

  const anchors = [
    ...summary.recurring_people_or_topics,
    ...summary.top_affected_areas,
    ...summary.top_patterns,
    ...summary.actions_that_help,
    ...summary.stats.top_trigger_subjects,
    ...summary.stats.top_repeated_people
  ]
    .map((item) => item.toLowerCase())
    .filter(Boolean);

  const mentionsKnownFact = anchors.some((item) => lower.includes(item));

  if (!mentionsKnownFact && summary.total_entries > 1) {
    return fallback;
  }

  return text;
}

function generateFeedbackCardsFallback(summary: PatternSummary): FeedbackCardSet {
  if (!summary.total_entries) {
    return {
      pattern_card: "No clear pattern yet. Keep writing the facts and the picture will tighten up.",
      impact_card: "Not enough inventory is in yet to say what gets hit most.",
      behavior_card: "The app is still learning your repeat moves from real entries and follow-up.",
      next_right_action_card: "Today's move: write one honest inventory and take one clean action."
    };
  }

  return {
    pattern_card: buildPatternCard(summary),
    impact_card: buildImpactCard(summary),
    behavior_card: buildBehaviorCard(summary),
    next_right_action_card: buildNextActionCard(summary)
  };
}

function generateWeeklyReflectionFallback(summary: PatternSummary) {
  if (!summary.total_entries) {
    return "Not enough written this week yet to call a pattern. Keep the facts short, honest, and current.";
  }

  const topTopic = summary.recurring_people_or_topics[0] ?? "this pattern";
  const topImpact = summary.top_affected_areas[0] ?? "your peace";
  const action = summary.actions_that_help[0] ?? "same-day honest action";
  const trend = summary.trend_notes[0] ?? `${summary.top_patterns[0] ?? "old reaction"} keeps showing up`;

  return `${topTopic} kept coming back this week, and it usually landed on ${topImpact.toLowerCase()}. ${trend.charAt(0).toUpperCase() + trend.slice(1)}. ${action.charAt(0).toUpperCase() + action.slice(1)} seems to help when you do it sooner.`;
}

export async function generateFeedbackCards(summary: PatternSummary): Promise<FeedbackCardSet> {
  const fallback = generateFeedbackCardsFallback(summary);

  try {
    const parsed = await parseStructuredResponse({
      schema: feedbackCardSchema,
      schemaName: "feedback_cards",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: feedbackCardsPrompt
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildSummaryFacts(summary)
            }
          ]
        }
      ],
      reasoningEffort: "low",
      maxOutputTokens: 260
    });

    if (!parsed) {
      return fallback;
    }

    return {
      pattern_card: normalizeGeneratedCard(summary, parsed.pattern_card, fallback.pattern_card),
      impact_card: normalizeGeneratedCard(summary, parsed.impact_card, fallback.impact_card),
      behavior_card: normalizeGeneratedCard(summary, parsed.behavior_card, fallback.behavior_card),
      next_right_action_card: normalizeGeneratedCard(
        summary,
        parsed.next_right_action_card,
        fallback.next_right_action_card
      )
    };
  } catch (error) {
    console.error("OpenAI feedback card generation failed. Falling back to local copy.", error);
    return fallback;
  }
}

export async function generateWeeklyReflection(summary: PatternSummary) {
  if (!summary.total_entries) {
    return generateWeeklyReflectionFallback(summary);
  }

  try {
    const parsed = await parseStructuredResponse({
      schema: weeklyReflectionSchema,
      schemaName: "weekly_reflection",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: weeklyReflectionPrompt
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildSummaryFacts(summary)
            }
          ]
        }
      ],
      reasoningEffort: "low",
      maxOutputTokens: 220
    });

    return parsed?.reflection.trim() || generateWeeklyReflectionFallback(summary);
  } catch (error) {
    console.error("OpenAI weekly reflection failed. Falling back to local copy.", error);
    return generateWeeklyReflectionFallback(summary);
  }
}

export function feedbackModelLabel() {
  return hasOpenAIApiKey() ? getOpenAIModel() : "fallback-local";
}
