import { useState } from "react";
import { Text } from "react-native";

import { TONE_MODE_OPTIONS } from "@stepcorrect/core";

import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { Field } from "@/components/field";
import { Screen } from "@/components/screen";
import { SectionCard } from "@/components/section-card";
import { useDemoStore } from "@/lib/demo-store";

export default function SettingsScreen() {
  const { profile, updateProfile } = useDemoStore();
  const [name, setName] = useState(profile.fullName ?? "");
  const [sobrietyDate, setSobrietyDate] = useState(profile.sobrietyDate ?? "");
  const [saved, setSaved] = useState(false);

  return (
    <Screen eyebrow="Settings" title="Settings" description="Scaffold the basics without slowing the product down.">
      <SectionCard title="Profile">
        <Field label="Name" value={name} onChangeText={setName} placeholder="Your name" />
        <Field
          label="Sobriety date"
          value={sobrietyDate}
          onChangeText={setSobrietyDate}
          placeholder="YYYY-MM-DD"
        />
        <Text>Tone mode</Text>
        {TONE_MODE_OPTIONS.map((mode) => (
          <Chip
            key={mode}
            label={mode}
            selected={profile.toneMode === mode}
            onPress={() => updateProfile({ toneMode: mode })}
          />
        ))}
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
        {saved ? <Text>Settings saved.</Text> : null}
      </SectionCard>

      <SectionCard title="Placeholders">
        <Text>Reminder preferences placeholder</Text>
        <Text>Privacy note placeholder</Text>
        <Text>Export placeholder</Text>
        <Text>Delete account placeholder</Text>
      </SectionCard>
    </Screen>
  );
}
