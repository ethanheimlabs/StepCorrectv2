import { StyleSheet, Text, View } from "react-native";

import { colors, radii } from "@/lib/theme";

export function Notice({ text }: { text: string }) {
  return (
    <View style={styles.box}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radii.lg,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text
  }
});
