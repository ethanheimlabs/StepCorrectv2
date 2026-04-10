import { StyleSheet, Text, View } from "react-native";

import { colors, radii, shadow } from "@/lib/theme";

export function FeedbackCard({
  title,
  body
}: {
  title: string;
  body: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: "48%",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardTint,
    padding: 16,
    gap: 10,
    ...shadow.card
  },
  title: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.3,
    textTransform: "uppercase",
    color: colors.mutedText
  },
  body: {
    fontSize: 19,
    lineHeight: 28,
    fontWeight: "600",
    color: colors.text
  }
});
