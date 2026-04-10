import { readStore, updateStore } from "@/lib/data/store";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { InventoryAction, InventoryEntry, ResentmentExtraction } from "@/lib/types";

type InventoryEntryRow = {
  id: string;
  user_id: string;
  created_at: string;
  raw_text: string;
  clarification_text: string | null;
  entry_type: InventoryEntry["entryType"];
  confidence: InventoryEntry["confidence"];
  extracted_resentment: ResentmentExtraction | null;
  extracted_fear: Record<string, unknown> | null;
  shareable_summary: string | null;
  status: InventoryEntry["status"];
  deleted_at: string | null;
};

type InventoryActionRow = {
  id: string;
  entry_id: string;
  user_id: string;
  action_text: string;
  completed: boolean;
  completed_at: string | null;
};

function fromEntryRow(row: InventoryEntryRow): InventoryEntry {
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    rawText: row.raw_text,
    clarificationText: row.clarification_text,
    entryType: row.entry_type,
    confidence: row.confidence,
    extractedResentment: row.extracted_resentment,
    extractedFear: row.extracted_fear,
    shareableSummary: row.shareable_summary,
    status: row.status,
    deletedAt: row.deleted_at
  };
}

function toEntryRow(entry: InventoryEntry): InventoryEntryRow {
  return {
    id: entry.id,
    user_id: entry.userId,
    created_at: entry.createdAt,
    raw_text: entry.rawText,
    clarification_text: entry.clarificationText,
    entry_type: entry.entryType,
    confidence: entry.confidence,
    extracted_resentment: entry.extractedResentment,
    extracted_fear: entry.extractedFear,
    shareable_summary: entry.shareableSummary,
    status: entry.status,
    deleted_at: entry.deletedAt
  };
}

function toEntryUpdateRow(entry: InventoryEntry) {
  return {
    user_id: entry.userId,
    raw_text: entry.rawText,
    clarification_text: entry.clarificationText,
    entry_type: entry.entryType,
    confidence: entry.confidence,
    extracted_resentment: entry.extractedResentment,
    extracted_fear: entry.extractedFear,
    shareable_summary: entry.shareableSummary,
    status: entry.status,
    deleted_at: entry.deletedAt
  };
}

function fromActionRow(row: InventoryActionRow): InventoryAction {
  return {
    id: row.id,
    entryId: row.entry_id,
    userId: row.user_id,
    actionText: row.action_text,
    completed: row.completed,
    completedAt: row.completed_at
  };
}

function toActionRow(action: InventoryAction): InventoryActionRow {
  return {
    id: action.id,
    entry_id: action.entryId,
    user_id: action.userId,
    action_text: action.actionText,
    completed: action.completed,
    completed_at: action.completedAt
  };
}

export async function listInventoryEntries(userId: string) {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const response = await supabase
      .from("inventory_entries")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (!response.error && response.data) {
      return (response.data as InventoryEntryRow[]).map(fromEntryRow);
    }
  }

  const store = await readStore();

  return Object.values(store.inventoryEntries)
    .filter((entry) => entry.userId === userId && !entry.deletedAt)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getInventoryEntry(id: string) {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const response = await supabase
      .from("inventory_entries")
      .select("*")
      .eq("id", id)
      .single();

    if (!response.error && response.data) {
      return fromEntryRow(response.data as InventoryEntryRow);
    }
  }

  const store = await readStore();
  return store.inventoryEntries[id] ?? null;
}

export async function createInventoryEntry(entry: InventoryEntry) {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const response = await supabase
      .from("inventory_entries")
      .insert(toEntryRow(entry))
      .select("*")
      .single();

    if (!response.error && response.data) {
      return fromEntryRow(response.data as InventoryEntryRow);
    }
  }

  await updateStore((store) => ({
    ...store,
    inventoryEntries: {
      ...store.inventoryEntries,
      [entry.id]: entry
    }
  }));

  return entry;
}

export async function updateInventoryEntry(
  id: string,
  updates: Partial<InventoryEntry>
) {
  const current = await getInventoryEntry(id);

  if (!current) {
    return null;
  }

  const nextEntry: InventoryEntry = {
    ...current,
    ...updates
  };
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const response = await supabase
      .from("inventory_entries")
      .update(toEntryUpdateRow(nextEntry))
      .eq("id", id)
      .select("*")
      .single();

    if (!response.error && response.data) {
      return fromEntryRow(response.data as InventoryEntryRow);
    }
  }

  await updateStore((store) => ({
    ...store,
    inventoryEntries: {
      ...store.inventoryEntries,
      [id]: nextEntry
    }
  }));

  return nextEntry;
}

export async function listInventoryActions(entryId: string) {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const response = await supabase
      .from("inventory_actions")
      .select("*")
      .eq("entry_id", entryId)
      .order("id", { ascending: true });

    if (!response.error && response.data) {
      return (response.data as InventoryActionRow[]).map(fromActionRow);
    }
  }

  const store = await readStore();

  return Object.values(store.inventoryActions).filter((action) => action.entryId === entryId);
}

export async function replaceInventoryActions(
  entryId: string,
  userId: string,
  actions: string[]
) {
  const existingActions = await listInventoryActions(entryId);
  const existingByText = new Map(existingActions.map((action) => [action.actionText, action]));

  const nextActions = actions.map((actionText) => {
    const existing = existingByText.get(actionText);

    return {
      id: existing?.id ?? crypto.randomUUID(),
      entryId,
      userId,
      actionText,
      completed: existing?.completed ?? false,
      completedAt: existing?.completedAt ?? null
    } satisfies InventoryAction;
  });
  const supabase = getSupabaseAdmin();

  if (supabase) {
    await supabase.from("inventory_actions").delete().eq("entry_id", entryId);

    if (nextActions.length) {
      const response = await supabase
        .from("inventory_actions")
        .insert(nextActions.map(toActionRow))
        .select("*");

      if (!response.error && response.data) {
        return (response.data as InventoryActionRow[]).map(fromActionRow);
      }
    }
  }

  await updateStore((store) => {
    const remainingActions = Object.fromEntries(
      Object.entries(store.inventoryActions).filter(([, action]) => action.entryId !== entryId)
    );

    return {
      ...store,
      inventoryActions: {
        ...remainingActions,
        ...Object.fromEntries(nextActions.map((action) => [action.id, action]))
      }
    };
  });

  return nextActions;
}

export async function toggleInventoryAction(actionId: string, completed: boolean) {
  const store = await readStore();
  const localAction = store.inventoryActions[actionId] ?? null;
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const response = await supabase
      .from("inventory_actions")
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null
      })
      .eq("id", actionId)
      .select("*")
      .single();

    if (!response.error && response.data) {
      return fromActionRow(response.data as InventoryActionRow);
    }
  }

  if (!localAction) {
    return null;
  }

  const nextAction: InventoryAction = {
    ...localAction,
    completed,
    completedAt: completed ? new Date().toISOString() : null
  };

  await updateStore((current) => ({
    ...current,
    inventoryActions: {
      ...current.inventoryActions,
      [actionId]: nextAction
    }
  }));

  return nextAction;
}
