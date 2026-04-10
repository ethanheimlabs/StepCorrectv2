import { StyleSheet, Text, View } from "react-native";

import type { FeedbackCardSet, PatternSummary } from "@/lib/mobile-types";
import { colors, radii } from "@/lib/theme";

import { FeedbackCardGrid } from "./feedback-card-grid";
import { MetricPill } from "./metric-pill";

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
  summary
}: {
  cards: FeedbackCardSet;
  summary: PatternSummary;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>What StepCorrect is noticing</Text>
      <Text style={styles.title}>
        Short, grounded pattern feedback from what you’ve already written.
      </Text>
      <View style={styles.meta}>
        {buildMeta(summary).map((item) => (
          <MetricPill key={item} label={item} />
        ))}
      </View>
      <FeedbackCardGrid cards={cards} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 14
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.mutedText
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: colors.text
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  }
});
