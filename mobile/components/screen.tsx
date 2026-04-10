import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radii } from "@/lib/theme";

export function Screen({
  title,
  description,
  children,
  eyebrow,
  headerSlot
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  headerSlot?: ReactNode;
  children: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.hero}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            <Text style={styles.title}>{title}</Text>
            {description ? <Text style={styles.description}>{description}</Text> : null}
            {headerSlot ? <View style={styles.headerSlot}>{headerSlot}</View> : null}
          </View>
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: 20,
    paddingBottom: 48,
    gap: 18
  },
  header: {
    gap: 8
  },
  hero: {
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 10
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.mutedText
  },
  title: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "700",
    color: colors.text
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.mutedText
  },
  headerSlot: {
    marginTop: 4
  }
});
