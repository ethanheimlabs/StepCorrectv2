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

function generateFeedbackCardsFallback(summary: PatternSummary): FeedbackCardSet {
  if (!summary.total_entries) {
    return {
      pattern_card: "No clear pattern yet. Keep writing the facts and the picture will tighten up.",
      impact_card: "Not enough inventory is in yet to say what gets hit most.",
      behavior_card: "The app is still learning your repeat moves from real entries and follow-up.",
      next_right_action_card: "Today's move: write one honest inventory and take one clean action."
    };
  }

  const topTopic = summary.recurring_people_or_topics[0] ?? "This situation";
  const topImpact = summary.top_affected_areas[0] ?? "your peace";
  const topPattern = summary.top_patterns[0] ?? "pressure and reaction";
  const nextAction =
    summary.actions_that_help[0] ?? "write the facts, don't react, and reach out today";

  return {
    pattern_card:
      summary.similar_entry_count > 0
        ? `${topTopic} keeps showing up. You've seen this kind of hit before.`
        : `${topTopic} is starting to stand out.`,
    impact_card: `${topImpact} seems to get hit first when this comes up.`,
    behavior_card:
      summary.trend_notes[0] ??
      `${topPattern.replace(/_/g, " ")} keeps showing up in the middle of it.`,
    next_right_action_card: `Today's move: ${nextAction.replace(/\.$/, "")}.`
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

    return parsed ?? generateFeedbackCardsFallback(summary);
  } catch (error) {
    console.error("OpenAI feedback card generation failed. Falling back to local copy.", error);
    return generateFeedbackCardsFallback(summary);
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
