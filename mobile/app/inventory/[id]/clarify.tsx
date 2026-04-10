import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import { CLARIFY_QUICK_CHIPS, classifyInventory } from "@stepcorrect/core";

import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { Field } from "@/components/field";
import { Notice } from "@/components/notice";
import { Screen } from "@/components/screen";
import { SectionCard } from "@/components/section-card";
import { useDemoStore } from "@/lib/demo-store";

export default function InventoryClarifyScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { getEntry, submitClarification } = useDemoStore();
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const entry = getEntry(params.id);

  if (!entry) {
    return (
      <Screen eyebrow="Inventory" title="Not found">
        <SectionCard>Inventory entry not found.</SectionCard>
      </Screen>
    );
  }

  const classification = classifyInventory(entry.rawText);

  return (
    <Screen eyebrow="Inventory" title="Quick question" description="Get specific enough to work with.">
      <SectionCard title="Clarify the actual hit">
        <Notice text={classification.clarifying_question ?? "What happened?"} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {CLARIFY_QUICK_CHIPS.map((chip) => (
            <Chip key={chip} label={chip} selected={answer === chip} onPress={() => setAnswer(chip)} />
          ))}
        </View>
        <Field
          label="Short answer"
          value={answer}
          onChangeText={setAnswer}
          multiline
          placeholder="Criticized my recovery"
        />
        {loading ? <Notice text="Building your columns..." /> : null}
        <Button
          label="Continue"
          onPress={() => {
            setLoading(true);
            const result = submitClarification(entry.id, answer);
            router.replace(result.entry ? `/inventory/${entry.id}/review` : "/safety");
          }}
        />
      </SectionCard>
    </Screen>
  );
}
