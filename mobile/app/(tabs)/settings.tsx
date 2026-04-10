import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { TONE_MODE_OPTIONS } from "@stepcorrect/core";

import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { Field } from "@/components/field";
import { Notice } from "@/components/notice";
import { Screen } from "@/components/screen";
import { SectionCard } from "@/components/section-card";
import { useDemoStore } from "@/lib/demo-store";
import { colors } from "@/lib/theme";

export default function SettingsScreen() {
  const { profile, updateProfile } = useDemoStore();
  const [name, setName] = useState(profile.fullName ?? "");
  const [sobrietyDate, setSobrietyDate] = useState(profile.sobrietyDate ?? "");
  const [saved, setSaved] = useState(false);

  return (
    <Screen eyebrow="Settings" title="Settings" description="Keep the basics clean and usable.">
      <SectionCard title="Profile">
        <Field label="Name" value={name} onChangeText={setName} placeholder="Your name" />
        <Field
          label="Sobriety date"
          value={sobrietyDate}
          onChangeText={setSobrietyDate}
          placeholder="YYYY-MM-DD"
        />
        <Text style={styles.label}>Tone mode</Text>
        <View style={styles.chips}>
          {TONE_MODE_OPTIONS.map((mode) => (
            <Chip
              key={mode}
              label={mode}
              selected={profile.toneMode === mode}
              onPress={() => updateProfile({ toneMode: mode })}
            />
          ))}
        </View>
        <Button
          label="Save settings"
          onPress={() => {
            updateProfile({
              fullName: name.trim() || null,
              sobrietyDate: sobrietyDate.trim() || null
            });
            setSaved(true);
          }}
        />
        {saved ? <Notice text="Settings saved." /> : null}
      </SectionCard>

      <SectionCard title="What’s next">
        <Text style={styles.body}>Reminder preferences</Text>
        <Text style={styles.body}>Privacy notes and account wiring</Text>
        <Text style={styles.body}>Native share and export</Text>
        <Text style={styles.body}>Real backend session handling</Text>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: colors.text
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.mutedText
  }
});
