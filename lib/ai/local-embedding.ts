const LOCAL_EMBEDDING_DIMENSIONS = 64;

function hashString(value: string, seed = 0) {
  let hash = 2166136261 ^ seed;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function normalizeVector(vector: number[]) {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));

  if (!norm) {
    return vector;
  }

  return vector.map((value) => Number((value / norm).toFixed(6)));
}

export function createLocalTextEmbedding(input: string) {
  const normalized = input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = normalized.split(" ").filter(Boolean);
  const ngrams = [
    ...tokens,
    ...tokens.slice(0, -1).map((token, index) => `${token} ${tokens[index + 1]}`)
  ];
  const vector = Array.from({ length: LOCAL_EMBEDDING_DIMENSIONS }, () => 0);

  for (const token of ngrams) {
    const primary = hashString(token);
    const secondary = hashString(token, 11);
    const weight = token.includes(" ") ? 1.35 : 1;
    const firstIndex = primary % LOCAL_EMBEDDING_DIMENSIONS;
    const secondIndex = secondary % LOCAL_EMBEDDING_DIMENSIONS;
    const sign = (primary & 1) === 0 ? 1 : -1;

    vector[firstIndex] += sign * weight;
    vector[secondIndex] += (secondary & 1) === 0 ? weight * 0.5 : -weight * 0.5;
  }

  return {
    embedding: normalizeVector(vector),
    model: "fallback-local-hash",
    dimensions: LOCAL_EMBEDDING_DIMENSIONS
  };
}
