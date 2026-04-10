import { Link, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AFFECT_LABELS } from "@stepcorrect/core";

import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
import { PatternInsightSection } from "@/components/pattern-insight-section";
import { Screen } from "@/components/screen";
import { SectionCard } from "@/components/section-card";
import { useDemoStore } from "@/lib/demo-store";
import { colors } from "@/lib/theme";

export default function InventoryDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { getEntry, getEntryActions, getPatternInsights } = useDemoStore();
  const entry = getEntry(params.id);

  if (!entry?.extractedResentment) {
    return (
      <Screen eyebrow="Inventory" title="Not found">
        <SectionCard>Inventory entry not found.</SectionCard>
      </Screen>
    );
  }

  const actions = getEntryActions(entry.id);
  const insights = getPatternInsights(entry.id);
  const activeAffects = Object.entries(entry.extractedResentment.affects)
    .filter(([, enabled]) => enabled)
    .map(([key]) => AFFECT_LABELS[key as keyof typeof AFFECT_LABELS]);

  return (
    <Screen eyebrow="Inventory" title="Saved" description="Keep the lesson. Drop the replay.">
      <SectionCard title="Final inventory">
        <Text style={styles.label}>Raw entry</Text>
        <Text style={styles.value}>{entry.rawText}</Text>
        {entry.clarificationText ? (
          <>
            <Text style={styles.label}>Clarification</Text>
            <Text style={styles.value}>{entry.clarificationText}</Text>
          </>
        ) : null}
        <Text style={styles.label}>Who / What</Text>
        <Text style={styles.value}>{entry.extractedResentment.who_or_what}</Text>
        <Text style={styles.label}>What happened</Text>
        <Text style={styles.value}>{entry.extractedResentment.what_happened_facts}</Text>
        <Text style={styles.label}>Affects my</Text>
        <View style={styles.chips}>
          {activeAffects.map((affect) => (
            <View key={affect} style={styles.badge}>
              <Text style={styles.badgeLabel}>{affect}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.label}>My part</Text>
        <Text style={styles.value}>{entry.extractedResentment.my_part_controlled}</Text>
        <Text style={styles.label}>Next right actions</Text>
        {actions.map((action) => (
          <Text key={action.id} style={styles.value}>
            • {action.actionText}
          </Text>
        ))}
      </SectionCard>

      <SectionCard title="Sponsor summary">
        <Notice text={entry.shareableSummary ?? ""} />
      </SectionCard>

      <PatternInsightSection cards={insights.cards} summary={insights.summary} />

      <Link asChild href="/inventory/new">
        <Button label="Start another inventory" />
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.mutedText
  },
  value: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  badgeLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text
  }
});
