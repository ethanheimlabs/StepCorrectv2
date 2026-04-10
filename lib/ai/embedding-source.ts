import type { InventoryEntry } from "@/lib/types";

export function buildInventoryEntryEmbeddingSourceText(entry: InventoryEntry) {
  const lines = [
    `Raw: ${entry.rawText}`,
    entry.clarificationText ? `Clarification: ${entry.clarificationText}` : null,
    entry.extractedResentment?.who_or_what
      ? `Who or what: ${entry.extractedResentment.who_or_what}`
      : null,
    entry.extractedResentment?.what_happened_facts
      ? `Facts: ${entry.extractedResentment.what_happened_facts}`
      : null,
    entry.extractedResentment?.my_part_controlled
      ? `My part: ${entry.extractedResentment.my_part_controlled}`
      : null,
    entry.extractedResentment?.defects_or_patterns.length
      ? `Patterns: ${entry.extractedResentment.defects_or_patterns.join(", ")}`
      : null,
    entry.extractedResentment?.next_right_actions.length
      ? `Actions: ${entry.extractedResentment.next_right_actions.join(", ")}`
      : null
  ];

  return lines.filter((line): line is string => Boolean(line)).join("\n");
}
