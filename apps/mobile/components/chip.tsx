import { Pressable, StyleSheet, Text } from "react-native";

import { colors, radii } from "@/lib/theme";

export function Chip({
  label,
  selected = false,
  onPress
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : styles.unselected,
        pressed ? styles.pressed : null
      ]}
    >
      <Text style={[styles.label, selected ? styles.selectedLabel : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  unselected: {
    backgroundColor: colors.card,
    borderColor: colors.border
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text
  },
  selectedLabel: {
    color: "#F8FBFF"
  },
  pressed: {
    opacity: 0.9
  }
});
