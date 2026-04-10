import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { Notice } from "@/components/notice";
import { Screen } from "@/components/screen";
import { SectionCard } from "@/components/section-card";
import { useDemoStore } from "@/lib/demo-store";
import { colors } from "@/lib/theme";

export default function InventoryActionsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { getEntry, getEntryActions, toggleAction, finishInventory } = useDemoStore();
  const entry = getEntry(params.id);

  if (!entry?.shareableSummary) {
    return (
      <Screen eyebrow="Inventory" title="Not ready">
        <SectionCard>Review the inventory first.</SectionCard>
      </Screen>
    );
  }

  const actions = getEntryActions(entry.id);

  return (
    <Screen eyebrow="Inventory" title="Next right actions" description="Action over rumination.">
      <SectionCard title="Checklist">
        <View style={styles.list}>
          {actions.map((action) => (
            <Chip
              key={action.id}
              label={`${action.completed ? "Done: " : ""}${action.actionText}`}
              selected={action.completed}
              onPress={() => toggleAction(action.id, !action.completed)}
            />
          ))}
        </View>
        <Button
          label="Mark done & Finish"
          onPress={() => {
            finishInventory(entry.id);
            router.replace(`/inventory/${entry.id}`);
          }}
        />
      </SectionCard>

      <SectionCard title="Sponsor summary">
        <Notice text={entry.shareableSummary} />
        <Text style={styles.shareNote}>Use native share or clipboard wiring in the next pass.</Text>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  shareNote: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.mutedText
  }
});
