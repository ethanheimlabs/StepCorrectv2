import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AFFECT_LABELS } from "@stepcorrect/core";

import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { Field } from "@/components/field";
import { Screen } from "@/components/screen";
import { SectionCard } from "@/components/section-card";
import { useDemoStore } from "@/lib/demo-store";
import { colors } from "@/lib/theme";

export default function InventoryReviewScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { getEntry, saveReview } = useDemoStore();
  const entry = getEntry(params.id);

  if (!entry?.extractedResentment) {
    return (
      <Screen eyebrow="Inventory" title="Not ready">
        <SectionCard>This inventory needs clarification first.</SectionCard>
      </Screen>
    );
  }

  const [review, setReview] = useState(entry.extractedResentment);

  return (
    <Screen
      eyebrow="Inventory"
      title="Review your columns"
      description="Keep the facts clean and own only your side."
    >
      <SectionCard title="Structured resentment review">
        <Field
          label="Who / What"
          value={review.who_or_what}
          onChangeText={(who_or_what) => setReview((current) => ({ ...current, who_or_what }))}
        />
        <Field
          label="What happened (facts)"
          value={review.what_happened_facts}
          onChangeText={(what_happened_facts) =>
            setReview((current) => ({ ...current, what_happened_facts }))
          }
          multiline
        />
        <Text style={styles.helper}>Facts only. No judgments.</Text>
        <Text style={styles.label}>Affects my...</Text>
        <View style={styles.chipRow}>
          {Object.entries(AFFECT_LABELS).map(([key, label]) => {
            const typedKey = key as keyof typeof review.affects;

            return (
              <Chip
                key={key}
                label={label}
                selected={review.affects[typedKey]}
                onPress={() =>
                  setReview((current) => ({
                    ...current,
                    affects: {
                      ...current.affects,
                      [typedKey]: !current.affects[typedKey]
                    }
                  }))
                }
              />
            );
          })}
        </View>
        <Field
          label="My part"
          value={review.my_part_controlled}
          onChangeText={(my_part_controlled) =>
            setReview((current) => ({ ...current, my_part_controlled }))
          }
          multiline
        />
        <Text style={styles.helper}>My part = what I can control.</Text>
        <Field
          label="Patterns"
          value={review.defects_or_patterns.join(", ")}
          onChangeText={(value) =>
            setReview((current) => ({
              ...current,
              defects_or_patterns: value
                .split(",")
                .map((item) => item.trim().replace(/\s+/g, "_"))
                .filter(Boolean)
            }))
          }
          placeholder="people_pleasing, fear"
        />
        <Field
          label="Next right actions"
          value={review.next_right_actions.join("\n")}
          onChangeText={(value) =>
            setReview((current) => ({
              ...current,
              next_right_actions: value.split("\n").map((item) => item.trim()).filter(Boolean)
            }))
          }
          multiline
        />
        <Button
          label="Save & Continue"
          onPress={() => {
            saveReview(entry.id, {
              ...review,
              shareable_sponsor_summary: review.shareable_sponsor_summary
            });
            router.replace(`/inventory/${entry.id}/actions`);
          }}
        />
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text
  },
  helper: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.mutedText
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  }
});
