import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { SectionCard } from "@/components/section-card";
import { useDemoStore } from "@/lib/demo-store";
import { colors } from "@/lib/theme";
import { STEP_COPY } from "@stepcorrect/core";

export default function StepsScreen() {
  const { steps } = useDemoStore();

  return (
    <Screen eyebrow="Step work" title="Step hub" description="A practical view of the 12 steps.">
      <View style={styles.list}>
        {STEP_COPY.map((step) => {
          const progress = steps.find((item) => item.stepNumber === step.stepNumber);

          return (
            <SectionCard key={step.stepNumber} title={`Step ${step.stepNumber}: ${step.title}`}>
              <Text style={styles.description}>{step.description}</Text>
              <Text style={styles.status}>{progress?.status.replace("_", " ") ?? "not started"}</Text>
            </SectionCard>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 14
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.mutedText
  },
  status: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.text
  }
});
