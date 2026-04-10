import type { InventoryEntryEmbedding } from "@/lib/types";

export interface SimilarEmbeddingMatch extends InventoryEntryEmbedding {
  similarity: number;
}

function compatibleEmbeddings(left: InventoryEntryEmbedding, right: InventoryEntryEmbedding) {
  return left.embedding.length > 0 && left.embedding.length === right.embedding.length;
}

export function cosineSimilarity(left: number[], right: number[]) {
  if (!left.length || !right.length || left.length !== right.length) {
    return 0;
  }

  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] * left[index];
    rightNorm += right[index] * right[index];
  }

  if (!leftNorm || !rightNorm) {
    return 0;
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

export function findSimilarEmbeddings(
  target: InventoryEntryEmbedding | null,
  candidates: InventoryEntryEmbedding[],
  options?: {
    limit?: number;
    minSimilarity?: number;
  }
) {
  if (!target) {
    return [] satisfies SimilarEmbeddingMatch[];
  }

  const limit = options?.limit ?? 5;
  const minSimilarity = options?.minSimilarity ?? 0.72;

  return candidates
    .filter((candidate) => candidate.entryId !== target.entryId)
    .filter((candidate) => compatibleEmbeddings(target, candidate))
    .map((candidate) => ({
      ...candidate,
      similarity: Number(cosineSimilarity(target.embedding, candidate.embedding).toFixed(3))
    }))
    .filter((candidate) => candidate.similarity >= minSimilarity)
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, limit);
}

export function countUniqueSimilarEmbeddings(
  targets: InventoryEntryEmbedding[],
  candidates: InventoryEntryEmbedding[],
  options?: {
    limitPerTarget?: number;
    minSimilarity?: number;
  }
) {
  const uniqueMatchIds = new Set<string>();

  for (const target of targets) {
    const matches = findSimilarEmbeddings(target, candidates, {
      limit: options?.limitPerTarget ?? 5,
      minSimilarity: options?.minSimilarity
    });

    for (const match of matches) {
      uniqueMatchIds.add(match.entryId);
    }
  }

  return uniqueMatchIds.size;
}
