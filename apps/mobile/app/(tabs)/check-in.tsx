import { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

import { Button } from "@/components/button";
import { Field } from "@/components/field";
import { Screen } from "@/components/screen";
import { SectionCard } from "@/components/section-card";
import { useDemoStore } from "@/lib/demo-store";
import { colors } from "@/lib/theme";

const haltKeys = [
  { key: "hungry", label: "Hungry" },
  { key: "angry", label: "Angry" },
  { key: "lonely", label: "Lonely" },
  { key: "tired", label: "Tired" }
] as const;

export default function CheckInScreen() {
  const { saveCheckIn } = useDemoStore();
  const [mood, setMood] = useState("6");
  const [craving, setCraving] = useState("3");
  const [note, setNote] = useState("");
  const [guidance, setGuidance] = useState("");
  const [halt, setHalt] = useState({
    hungry: false,
    angry: false,
    lonely: false,
    tired: false
  });

  return (
    <Screen
      eyebrow="Daily check-in"
      title="Check in"
      description="Keep it short. Tell the truth about the temperature of the day."
    >
      <SectionCard title="Today’s check-in">
        <Field label="Mood (1-10)" value={mood} onChangeText={setMood} placeholder="6" />
        <Field label="Craving (1-10)" value={craving} onChangeText={setCraving} placeholder="3" />
        <View style={styles.toggleBlock}>
          <Text style={styles.label}>HALT</Text>
          {haltKeys.map((item) => (
            <View key={item.key} style={styles.toggleRow}>
              <Text style={styles.toggleText}>{item.label}</Text>
              <Switch
                value={halt[item.key]}
                onValueChange={(value) =>
                  setHalt((current) => ({
                    ...current,
                    [item.key]: value
                  }))
                }
              />
            </View>
          ))}
        </View>
        <Field
          label="Short note"
          value={note}
          onChangeText={setNote}
          multiline
          placeholder="What feels most important right now?"
        />
        <Button
          label="Save check-in"
          onPress={() => {
            const next = saveCheckIn({
              mood: Number(mood) || 1,
              craving: Number(craving) || 1,
              halt,
              note: note.trim() || null
            });
            setGuidance(next);
          }}
        />
        {guidance ? <Text style={styles.guidance}>{guidance}</Text> : null}
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toggleBlock: {
    gap: 10
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4
  },
  toggleText: {
    fontSize: 15,
    color: colors.text
  },
  guidance: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text
  }
});
