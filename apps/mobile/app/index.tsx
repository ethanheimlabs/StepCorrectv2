import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
import { Screen } from "@/components/screen";
import { SectionCard } from "@/components/section-card";
import { colors } from "@/lib/theme";

export default function WelcomeScreen() {
  return (
    <Screen
      eyebrow="StepCorrect"
      title="Clear your head. Take the next right action."
      description="A structured recovery companion for daily inventory, step work, and sponsor-style reflection."
    >
      <SectionCard title="Trusted sponsor-style structure" description="Serious, calm, practical.">
        <View style={styles.stack}>
          <Link asChild href="/(tabs)">
            <Button label="Open app" />
          </Link>
          <Link asChild href="/signup">
            <Button label="Create account" variant="secondary" />
          </Link>
        </View>
      </SectionCard>

      <Notice text="StepCorrect supports recovery routines. It does not replace meetings, a sponsor, therapy, medical care, or emergency services." />

      <View style={styles.copyBlock}>
        <Text style={styles.copyTitle}>What you can do here</Text>
        <Text style={styles.copyItem}>Daily inventory</Text>
        <Text style={styles.copyItem}>Sponsor-style reflection</Text>
        <Text style={styles.copyItem}>Step work made clearer</Text>
        <Text style={styles.copyItem}>Action over rumination</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 12
  },
  copyBlock: {
    gap: 8,
    paddingTop: 8
  },
  copyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text
  },
  copyItem: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.mutedText
  }
});
