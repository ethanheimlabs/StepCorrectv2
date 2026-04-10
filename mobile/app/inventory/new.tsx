import { router } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";

import { Button } from "@/components/button";
import { Field } from "@/components/field";
import { Notice } from "@/components/notice";
import { Screen } from "@/components/screen";
import { SectionCard } from "@/components/section-card";
import { useDemoStore } from "@/lib/demo-store";

export default function InventoryNewScreen() {
  const { startInventory } = useDemoStore();
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <Screen eyebrow="Inventory" title="Inventory" description="Dump it here. Keep it honest.">
      <SectionCard title="Start with the raw thought">
        <Field
          label="Raw resentment"
          value={rawText}
          onChangeText={setRawText}
          multiline
          placeholder="I’m resentful at my sister"
        />
        {loading ? <Notice text="Sorting this into the right inventory..." /> : null}
        {error ? <Text>{error}</Text> : null}
        <Button
          label="Continue"
          onPress={() => {
            try {
              setLoading(true);
              const { entry, classification, safetyAssessment } = startInventory(rawText);

              if (safetyAssessment.isSafetyCase || !entry) {
                router.replace("/safety");
                return;
              }

              router.replace(
                classification.needs_clarification
                  ? `/inventory/${entry.id}/clarify`
                  : `/inventory/${entry.id}/review`
              );
            } catch (nextError) {
              setError(nextError instanceof Error ? nextError.message : "Could not start inventory.");
            } finally {
              setLoading(false);
            }
          }}
        />
        <Button label="Voice note shell" variant="secondary" />
      </SectionCard>
    </Screen>
  );
}
