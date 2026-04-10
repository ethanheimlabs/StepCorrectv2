import { Text } from "react-native";

import { Screen } from "@/components/screen";
import { SectionCard } from "@/components/section-card";

export default function SafetyScreen() {
  return (
    <Screen
      eyebrow="Safety"
      title="Clear boundaries, calm language."
      description="Support for recovery routines, not a replacement for care or urgent help."
    >
      <SectionCard title="What StepCorrect is">
        <Text>
          It helps with daily inventory, step work, next right action thinking, and sponsor-style
          reflection.
        </Text>
      </SectionCard>
      <SectionCard title="What it is not">
        <Text>
          It is not a sponsor, not therapy, not medical care, not a diagnosis tool, and not an
          emergency response system.
        </Text>
      </SectionCard>
      <SectionCard title="When to reach out">
        <Text>
          Contact your sponsor when you are stuck in resentment, isolating, close to acting out, or
          unsure what honest action looks like.
        </Text>
      </SectionCard>
      <SectionCard title="Emergency help">
        <Text>
          If you may hurt yourself or someone else, or you are in immediate danger, call emergency
          services or go to the nearest emergency room right away.
        </Text>
      </SectionCard>
    </Screen>
  );
}
