import { Link, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
import { Screen } from "@/components/screen";
import { SectionCard } from "@/components/section-card";
import { useDemoStore } from "@/lib/demo-store";
import { colors } from "@/lib/theme";
import { formatShortDate } from "@/lib/utils";

export default function DashboardScreen() {
  const { profile, entries, checkIns, getEntryActions, steps } = useDemoStore();
  const latestEntry = entries[0] ?? null;
  const latestCheckIn = checkIns[0] ?? null;
  const nextAction =
    latestEntry ? getEntryActions(latestEntry.id).find((item) => !item.completed) ?? null : null;

  return (
    <Screen
      eyebrow="Dashboard"
      title={`How are you today, ${profile.fullName ?? "friend"}?`}
      description="Keep it honest, keep it simple, and keep moving."
    >
      <SectionCard title="Start an inventory">
        <Link asChild href="/inventory/new">
          <Button label="New resentment inventory" />
        </Link>
      </SectionCard>

      <SectionCard title="Today’s check-in">
        <Text style={styles.bodyText}>
          {latestCheckIn
            ? `Latest check-in: mood ${latestCheckIn.mood}/10, craving ${latestCheckIn.craving}/10.`
            : "No check-in saved yet today."}
        </Text>
      </SectionCard>

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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  }
});
