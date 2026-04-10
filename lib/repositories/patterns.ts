import { readStore, updateStore } from "@/lib/data/store";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { InventoryEntryEmbedding, PatternFeedbackRecord } from "@/lib/types";

type InventoryEntryEmbeddingRow = {
  id: string;
  entry_id: string;
  user_id: string;
  created_at: string;
  source_text: string;
  embedding: number[];
  model: string;
  dimensions: number;
};

type PatternFeedbackRow = {
  id: string;
  user_id: string;
  created_at: string;
  timeframe: string;
  summary: Record<string, unknown>;
  feedback_text: string;
  model: string;
};

function fromEmbeddingRow(row: InventoryEntryEmbeddingRow): InventoryEntryEmbedding {
  const rawEmbedding = Array.isArray(row.embedding)
    ? row.embedding
    : typeof row.embedding === "string"
      ? JSON.parse(row.embedding)
      : [];

  return {
    id: row.id,
    entryId: row.entry_id,
    userId: row.user_id,
    createdAt: row.created_at,
    sourceText: row.source_text,
    embedding: Array.isArray(rawEmbedding) ? rawEmbedding.map((value) => Number(value)) : [],
    model: row.model,
    dimensions: row.dimensions
  };
}

function toEmbeddingRow(embedding: InventoryEntryEmbedding): InventoryEntryEmbeddingRow {
  return {
    id: embedding.id,
    entry_id: embedding.entryId,
    user_id: embedding.userId,
    created_at: embedding.createdAt,
    source_text: embedding.sourceText,
    embedding: embedding.embedding,
    model: embedding.model,
    dimensions: embedding.dimensions
  };
}

function fromPatternFeedbackRow(row: PatternFeedbackRow): PatternFeedbackRecord {
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    timeframe: row.timeframe,
    summary: row.summary,
    feedbackText: row.feedback_text,
    model: row.model
  };
}

function toPatternFeedbackRow(feedback: PatternFeedbackRecord): PatternFeedbackRow {
  return {
    id: feedback.id,
    user_id: feedback.userId,
    created_at: feedback.createdAt,
    timeframe: feedback.timeframe,
    summary: feedback.summary,
    feedback_text: feedback.feedbackText,
    model: feedback.model
  };
}

export async function getInventoryEntryEmbedding(entryId: string) {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const response = await supabase
      .from("inventory_entry_embeddings")
      .select("*")
      .eq("entry_id", entryId)
      .maybeSingle();

    if (!response.error && response.data) {
      return fromEmbeddingRow(response.data as InventoryEntryEmbeddingRow);
    }
  }

  const store = await readStore();

  return (
    Object.values(store.inventoryEntryEmbeddings).find((embedding) => embedding.entryId === entryId) ??
    null
  );
}

export async function listInventoryEntryEmbeddings(userId: string, limit = 40) {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const response = await supabase
      .from("inventory_entry_embeddings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!response.error && response.data) {
      return (response.data as InventoryEntryEmbeddingRow[]).map(fromEmbeddingRow);
    }
  }

  const store = await readStore();

  return Object.values(store.inventoryEntryEmbeddings)
    .filter((embedding) => embedding.userId === userId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, limit);
}

export async function saveInventoryEntryEmbedding(
  embedding: Omit<InventoryEntryEmbedding, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  }
) {
  const existing = await getInventoryEntryEmbedding(embedding.entryId);
  const nextEmbedding: InventoryEntryEmbedding = {
    id: embedding.id ?? existing?.id ?? crypto.randomUUID(),
    createdAt: embedding.createdAt ?? existing?.createdAt ?? new Date().toISOString(),
    ...embedding
  };
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const response = await supabase
      .from("inventory_entry_embeddings")
      .upsert(toEmbeddingRow(nextEmbedding), {
        onConflict: "entry_id"
      })
      .select("*")
      .single();

    if (!response.error && response.data) {
      return fromEmbeddingRow(response.data as InventoryEntryEmbeddingRow);
    }
  }

  await updateStore((store) => ({
    ...store,
    inventoryEntryEmbeddings: {
      ...store.inventoryEntryEmbeddings,
      [nextEmbedding.id]: nextEmbedding
    }
  }));

  return nextEmbedding;
}

export async function getPatternFeedbackRecord(userId: string, timeframe: string) {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const response = await supabase
      .from("pattern_feedback")
      .select("*")
      .eq("user_id", userId)
      .eq("timeframe", timeframe)
      .maybeSingle();

    if (!response.error && response.data) {
      return fromPatternFeedbackRow(response.data as PatternFeedbackRow);
    }
  }

  const store = await readStore();

  return (
    Object.values(store.patternFeedback).find(
      (feedback) => feedback.userId === userId && feedback.timeframe === timeframe
    ) ?? null
  );
}

export async function savePatternFeedbackRecord(
  feedback: Omit<PatternFeedbackRecord, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  }
) {
  const existing = await getPatternFeedbackRecord(feedback.userId, feedback.timeframe);
  const nextFeedback: PatternFeedbackRecord = {
    id: feedback.id ?? existing?.id ?? crypto.randomUUID(),
    createdAt: feedback.createdAt ?? existing?.createdAt ?? new Date().toISOString(),
    ...feedback
  };
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const response = await supabase
      .from("pattern_feedback")
      .upsert(toPatternFeedbackRow(nextFeedback), {
        onConflict: "user_id,timeframe"
      })
      .select("*")
      .single();

    if (!response.error && response.data) {
      return fromPatternFeedbackRow(response.data as PatternFeedbackRow);
    }
  }

  await updateStore((store) => ({
    ...store,
    patternFeedback: {
      ...store.patternFeedback,
      [nextFeedback.id]: nextFeedback
    }
  }));

  return nextFeedback;
}
