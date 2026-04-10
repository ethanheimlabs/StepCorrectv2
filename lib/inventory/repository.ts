import { promises as fs } from "fs";
import path from "path";

import type { PostgrestSingleResponse } from "@supabase/supabase-js";

import type {
  ActionPlan,
  InventoryConfidence,
  InventoryEntry,
  InventoryEntryType,
  InventoryStatus,
  StructuredReview
} from "@/lib/inventory/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const STORE_PATH = path.join(process.cwd(), ".data", "inventory-entries.json");
const TABLE_NAME = "inventory_entries";

type InventoryRow = {
  id: string;
  created_at: string;
  updated_at: string;
  status: InventoryStatus;
  raw_text: string;
  entry_type: InventoryEntryType;
  confidence: InventoryConfidence;
  needs_clarification: boolean;
  clarifying_question: string | null;
  clarifying_answer: string | null;
  structured_review: StructuredReview | null;
  action_plan: ActionPlan | null;
};

type InventoryUpdate = Partial<
  Pick<
    InventoryEntry,
    | "status"
    | "entryType"
    | "confidence"
    | "needsClarification"
    | "clarifyingQuestion"
    | "clarifyingAnswer"
    | "structuredReview"
    | "actionPlan"
  >
>;

function fromRow(row: InventoryRow): InventoryEntry {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    rawText: row.raw_text,
    entryType: row.entry_type,
    confidence: row.confidence,
    needsClarification: row.needs_clarification,
    clarifyingQuestion: row.clarifying_question,
    clarifyingAnswer: row.clarifying_answer,
    structuredReview: row.structured_review,
    actionPlan: row.action_plan
  };
}

function toRow(entry: InventoryEntry): InventoryRow {
  return {
    id: entry.id,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
    status: entry.status,
    raw_text: entry.rawText,
    entry_type: entry.entryType,
    confidence: entry.confidence,
    needs_clarification: entry.needsClarification,
    clarifying_question: entry.clarifyingQuestion,
    clarifying_answer: entry.clarifyingAnswer,
    structured_review: entry.structuredReview,
    action_plan: entry.actionPlan
  };
}

function toSupabaseUpdate(update: InventoryUpdate) {
  return {
    updated_at: new Date().toISOString(),
    ...(update.status ? { status: update.status } : {}),
    ...(update.entryType ? { entry_type: update.entryType } : {}),
    ...(update.confidence ? { confidence: update.confidence } : {}),
    ...(typeof update.needsClarification === "boolean"
      ? { needs_clarification: update.needsClarification }
      : {}),
    ...(update.clarifyingQuestion !== undefined
      ? { clarifying_question: update.clarifyingQuestion }
      : {}),
    ...(update.clarifyingAnswer !== undefined
      ? { clarifying_answer: update.clarifyingAnswer }
      : {}),
    ...(update.structuredReview !== undefined
      ? { structured_review: update.structuredReview }
      : {}),
    ...(update.actionPlan !== undefined ? { action_plan: update.actionPlan } : {})
  };
}

async function ensureStore() {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });

  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, JSON.stringify({}, null, 2), "utf8");
  }
}

async function readStore(): Promise<Record<string, InventoryEntry>> {
  await ensureStore();
  const content = await fs.readFile(STORE_PATH, "utf8");
  return JSON.parse(content) as Record<string, InventoryEntry>;
}

async function writeStore(entries: Record<string, InventoryEntry>) {
  await ensureStore();
  await fs.writeFile(STORE_PATH, JSON.stringify(entries, null, 2), "utf8");
}

async function maybeSingle<T>(response: PostgrestSingleResponse<T>) {
  if (response.error) {
    throw new Error(response.error.message);
  }

  if (!response.data) {
    return null;
  }

  return response.data;
}

export async function createInventoryEntry(rawText: string) {
  const timestamp = new Date().toISOString();
  const entry: InventoryEntry = {
    id: crypto.randomUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
    status: "captured",
    rawText,
    entryType: "unknown",
    confidence: {
      resentment: 0,
      fear: 0
    },
    needsClarification: false,
    clarifyingQuestion: null,
    clarifyingAnswer: null,
    structuredReview: null,
    actionPlan: null
  };
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const row = toRow(entry);
    const response = await supabase.from(TABLE_NAME).insert(row).select().single();
    const data = await maybeSingle(response);
    return data ? fromRow(data as InventoryRow) : entry;
  }

  const entries = await readStore();
  entries[entry.id] = entry;
  await writeStore(entries);
  return entry;
}

export async function getInventoryEntry(id: string) {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const response = await supabase.from(TABLE_NAME).select("*").eq("id", id).single();
    const data = await maybeSingle(response);
    return data ? fromRow(data as InventoryRow) : null;
  }

  const entries = await readStore();
  return entries[id] ?? null;
}

export async function updateInventoryEntry(id: string, update: InventoryUpdate) {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const response = await supabase
      .from(TABLE_NAME)
      .update(toSupabaseUpdate(update))
      .eq("id", id)
      .select("*")
      .single();

    const data = await maybeSingle(response);
    return data ? fromRow(data as InventoryRow) : null;
  }

  const entries = await readStore();
  const current = entries[id];

  if (!current) {
    return null;
  }

  const nextEntry: InventoryEntry = {
    ...current,
    ...update,
    updatedAt: new Date().toISOString()
  };

  entries[id] = nextEntry;
  await writeStore(entries);
  return nextEntry;
}
