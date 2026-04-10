import { Link, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
import { PatternInsightSection } from "@/components/pattern-insight-section";
import { Screen } from "@/components/screen";
import { SectionCard } from "@/components/section-card";
import { useDemoStore } from "@/lib/demo-store";
import { colors } from "@/lib/theme";
import { formatShortDate } from "@/lib/utils";

export default function DashboardScreen() {
  const {
    profile,
    entries,
    checkIns,
    getEntryActions,
    getPatternInsights,
    getWeeklyReflection,
    steps
  } = useDemoStore();
  const latestEntry = entries[0] ?? null;
  const latestCheckIn = checkIns[0] ?? null;
  const nextAction =
    latestEntry ? getEntryActions(latestEntry.id).find((item) => !item.completed) ?? null : null;
  const latestInsights = getPatternInsights(latestEntry?.id);
  const weeklyReflection = getWeeklyReflection();

  return (
    <Screen
      eyebrow="Dashboard"
      title={`How are you today, ${profile.fullName ?? "friend"}?`}
      description="Keep it honest, keep it simple, and keep moving."
      headerSlot={
        <View style={styles.headerActions}>
          <Link asChild href="/inventory/new">
            <Button label="New inventory" />
          </Link>
          <Link asChild href="/(tabs)/check-in">
            <Button label="Daily check-in" variant="secondary" />
          </Link>
        </View>
      }
    >
      <SectionCard title="Today’s check-in">
        <Text style={styles.bodyText}>
          {latestCheckIn
            ? `Latest check-in: mood ${latestCheckIn.mood}/10, craving ${latestCheckIn.craving}/10.`
            : "No check-in saved yet today."}
        </Text>
      </SectionCard>

      <PatternInsightSection cards={latestInsights.cards} summary={latestInsights.summary} />

      <SectionCard title="Recent reflections">
        {entries.length ? (
          <View style={styles.list}>
            {entries.slice(0, 3).map((entry) => (
              <Pressable
                key={entry.id}
                onPress={() =>
                  router.push(
                    entry.status === "completed"
                      ? `/inventory/${entry.id}`
                      : entry.extractedResentment
                        ? `/inventory/${entry.id}/review`
                        : `/inventory/${entry.id}/clarify`
                  )
                }
                style={styles.listCard}
              >
                  <Text style={styles.listTitle}>{entry.rawText}</Text>
                  <Text style={styles.listMeta}>{formatShortDate(entry.createdAt)}</Text>
                </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.bodyText}>No inventory yet. The first one usually clears some air.</Text>
        )}
      </SectionCard>

      <SectionCard title="Today’s next right action">
        <Text style={styles.bodyText}>
          {nextAction?.actionText ?? "Start an inventory and let the next action reveal itself."}
        </Text>
      </SectionCard>

      <SectionCard
        title="Weekly reflection"
        description="A short read on what the week has been showing you."
      >
        <View style={styles.weeklyGrid}>
          <View style={styles.weeklyMetric}>
            <Text style={styles.metricLabel}>This week’s pattern</Text>
            <Text style={styles.metricValue}>
              {[
                weeklyReflection.summary.recurring_people_or_topics[0],
                weeklyReflection.summary.top_patterns[0]
              ]
                .filter(Boolean)
                .join(" / ") || "Still taking shape"}
            </Text>
          </View>
          <View style={styles.weeklyMetric}>
            <Text style={styles.metricLabel}>What got hit most</Text>
            <Text style={styles.metricValue}>
              {weeklyReflection.summary.top_affected_areas[0] ?? "Not enough data yet"}
            </Text>
          </View>
          <View style={styles.weeklyMetric}>
            <Text style={styles.metricLabel}>What helped</Text>
            <Text style={styles.metricValue}>
              {weeklyReflection.summary.actions_that_help[0] ?? "Still learning from follow-up"}
            </Text>
          </View>
        </View>
        <Notice text={weeklyReflection.reflection} />
      </SectionCard>

      <SectionCard title="Step work">
        <View style={styles.list}>
          {steps.slice(0, 4).map((step) => (
            <View key={step.id} style={styles.stepRow}>
              <Text style={styles.listTitle}>Step {step.stepNumber}</Text>
              <Text style={styles.listMeta}>{step.status.replace("_", " ")}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <Notice text="StepCorrect supports recovery routines. It does not replace meetings, a sponsor, therapy, medical care, or emergency services." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    gap: 10
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.mutedText
  },
  list: {
    gap: 10
  },
  listCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6
  },
  listTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text
  },
  listMeta: {
    fontSize: 12,
    color: colors.mutedText,
    textTransform: "uppercase"
  },
  stepRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.cardTint,
    borderWidth: 1,
    borderColor: colors.border
  },
  weeklyGrid: {
    gap: 10
  },
  weeklyMetric: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardTint,
    padding: 14,
    gap: 6
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: colors.mutedText
  },
  metricValue: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text
  }
});
