import { StyleSheet, View } from "react-native";

import type { FeedbackCardSet } from "@/lib/mobile-types";

import { FeedbackCard } from "./feedback-card";

export function FeedbackCardGrid({ cards }: { cards: FeedbackCardSet }) {
  return (
    <View style={styles.grid}>
      <FeedbackCard title="Pattern" body={cards.pattern_card} />
      <FeedbackCard title="Impact" body={cards.impact_card} />
      <FeedbackCard title="Behavior" body={cards.behavior_card} />
      <FeedbackCard title="Next right action" body={cards.next_right_action_card} />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  }
});
