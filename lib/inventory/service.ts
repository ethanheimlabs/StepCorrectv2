import {
  buildActionPlan,
  buildStructuredReview,
  mockClassifyInventory
} from "@/lib/inventory/mock";
import {
  createInventoryEntry,
  getInventoryEntry,
  updateInventoryEntry
} from "@/lib/inventory/repository";
import type { ActionPlan, StructuredReview } from "@/lib/inventory/types";

export async function startInventory(rawText: string) {
  const created = await createInventoryEntry(rawText);
  const result = mockClassifyInventory(rawText);

  const structuredReview = result.needsClarification
    ? null
    : buildStructuredReview(rawText);
  const actionPlan = structuredReview ? buildActionPlan(structuredReview) : null;
  const status = result.needsClarification ? "clarify" : "review";

  const updated = await updateInventoryEntry(created.id, {
    status,
    entryType: result.entryType,
    confidence: result.confidence,
    needsClarification: result.needsClarification,
    clarifyingQuestion: result.clarifyingQuestion,
    structuredReview,
    actionPlan
  });

  if (!updated) {
    throw new Error("Could not start inventory.");
  }

  return updated;
}

export async function saveClarification(id: string, answer: string) {
  const entry = await getInventoryEntry(id);

  if (!entry) {
    throw new Error("Inventory entry not found.");
  }

  const structuredReview = buildStructuredReview(entry.rawText, answer);
  const actionPlan = buildActionPlan(structuredReview);

  const updated = await updateInventoryEntry(id, {
    clarifyingAnswer: answer,
    structuredReview,
    actionPlan,
    status: "review"
  });

  if (!updated) {
    throw new Error("Could not save clarification.");
  }

  return updated;
}

export async function saveReview(id: string, review: StructuredReview) {
  const actionPlan = buildActionPlan(review);
  const updated = await updateInventoryEntry(id, {
    structuredReview: review,
    actionPlan,
    needsClarification: false,
    status: "actions"
  });

  if (!updated) {
    throw new Error("Could not save review.");
  }

  return updated;
}

export async function saveActionPlan(id: string, actionPlan: ActionPlan) {
  const updated = await updateInventoryEntry(id, {
    actionPlan,
    status: "complete"
  });

  if (!updated) {
    throw new Error("Could not save action plan.");
  }

  return updated;
}
