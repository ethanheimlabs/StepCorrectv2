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
      title="You’ve been here before. Here’s the pattern. Here’s what helps."
      description="A calm mobile home for inventory, next-right-action thinking, and grounded sponsor-style reflection."
    >
      <SectionCard
        title="Built for daily recovery rhythm"
        description="Short, practical, sponsor-style support without the fluff."
      >
        <View style={styles.stack}>
          <Link asChild href="/(tabs)">
            <Button label="Open mobile app" />
          </Link>
          <Link asChild href="/signup">
            <Button label="Create account shell" variant="secondary" />
          </Link>
        </View>
      </SectionCard>

      <Notice text="StepCorrect supports recovery routines. It does not replace meetings, a sponsor, therapy, medical care, or emergency services." />

      <View style={styles.copyBlock}>
        <Text style={styles.copyTitle}>What the mobile app covers</Text>
        <Text style={styles.copyItem}>Write the resentment before it grows legs</Text>
        <Text style={styles.copyItem}>See what keeps repeating</Text>
        <Text style={styles.copyItem}>Track what seems to help next-day check-ins</Text>
        <Text style={styles.copyItem}>Carry one clean next action instead of the whole speech</Text>
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
