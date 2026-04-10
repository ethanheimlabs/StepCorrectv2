import { buildInventoryEntryEmbeddingSourceText } from "@/lib/ai/embedding-source";
import { createEmbeddingVector } from "@/lib/openai/client";
import type { InventoryEntry } from "@/lib/types";

export function buildEmbeddingSourceText(entry: InventoryEntry) {
  return buildInventoryEntryEmbeddingSourceText(entry);
}

export async function createInventoryEntryEmbedding(entry: InventoryEntry) {
  const sourceText = buildEmbeddingSourceText(entry);
  const payload = await createEmbeddingVector(sourceText);

  if (!payload) {
    return null;
  }

  return {
    sourceText,
    embedding: payload.embedding,
    model: payload.model,
    dimensions: payload.dimensions
  };
}
