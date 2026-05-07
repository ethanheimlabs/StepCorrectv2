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
    entry.extractedResentment?.affected_parts_detail.length
      ? `Affected details: ${entry.extractedResentment.affected_parts_detail.join(", ")}`
      : null,
    entry.extractedResentment?.felt_reactions.length
      ? `Feelings: ${entry.extractedResentment.felt_reactions.join(", ")}`
      : null,
    entry.extractedResentment?.my_part_controlled
      ? `My part: ${entry.extractedResentment.my_part_controlled}`
      : null,
    entry.extractedResentment?.fear_inventory.length
      ? `Fears: ${entry.extractedResentment.fear_inventory.join(", ")}`
      : null,
    entry.extractedResentment?.defects_or_patterns.length
      ? `Patterns: ${entry.extractedResentment.defects_or_patterns.join(", ")}`
      : null,
    entry.extractedResentment?.acceptance_needed.length
      ? `Acceptance: ${entry.extractedResentment.acceptance_needed.join(", ")}`
      : null,
    entry.extractedResentment?.spiritual_truths.length
      ? `Spiritual truth: ${entry.extractedResentment.spiritual_truths.join(", ")}`
      : null,
    entry.extractedResentment?.next_right_actions.length
      ? `Actions: ${entry.extractedResentment.next_right_actions.join(", ")}`
      : null
  ];

  return lines.filter((line): line is string => Boolean(line)).join("\n");
}
