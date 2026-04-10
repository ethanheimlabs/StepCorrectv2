import { StyleSheet, Text, View } from "react-native";

import { colors, radii } from "@/lib/theme";

export function MetricPill({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: colors.mutedText
  }
});
