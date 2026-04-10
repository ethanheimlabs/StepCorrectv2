import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, radii } from "@/lib/theme";

export function SectionCard({
  title,
  description,
  children
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {description ? <Text style={styles.description}>{description}</Text> : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 8
  },
  title: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "700",
    color: colors.text
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.mutedText
  },
  body: {
    gap: 12,
    marginTop: 4
  }
});
