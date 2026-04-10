import { Link, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/button";
import { Screen } from "@/components/screen";
import { SectionCard } from "@/components/section-card";
import { useDemoStore } from "@/lib/demo-store";
import { colors } from "@/lib/theme";
import { formatShortDate } from "@/lib/utils";

export default function InventoryListScreen() {
  const { entries } = useDemoStore();

  return (
    <Screen eyebrow="Inventory" title="Inventory" description="Recent resentment work, saved in one place.">
      <Link asChild href="/inventory/new">
        <Button label="New inventory" />
      </Link>

      <SectionCard>
        {entries.length ? (
          <View style={styles.list}>
            {entries.map((entry) => (
              <Pressable
                key={entry.id}
                onPress={() =>
                  router.push(
                    entry.status === "completed"
                      ? `/inventory/${entry.id}`
                      : entry.extractedResentment
                        ? `/inventory/${entry.id}/review`
                        : `/inventory/${entry.id}/clarify`
                  )
                }
                style={styles.item}
              >
                <Text style={styles.title}>{entry.rawText}</Text>
                <Text style={styles.meta}>
                  {entry.status.replace("_", " ")} • {formatShortDate(entry.createdAt)}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.empty}>No inventories yet.</Text>
        )}
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12
  },
  item: {
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surface,
    padding: 14
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text
  },
  meta: {
    fontSize: 12,
    color: colors.mutedText,
    textTransform: "uppercase"
  },
  empty: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.mutedText
  }
});
