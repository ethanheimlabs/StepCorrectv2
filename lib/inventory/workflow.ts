import { classifyInventory } from "@/lib/ai/classify-inventory";
import {
  buildSponsorSummary,
  extractResentment
} from "@/lib/ai/extract-resentment";
import { streamResentmentPreview } from "@/lib/ai/stream-resentment-preview";
import { logHandledSafetyCase, syncInventoryEmbedding } from "@/lib/patterns/service";
import {
  createInventoryEntry,
  getInventoryEntry,
  replaceInventoryActions,
  toggleInventoryAction,
  updateInventoryEntry
} from "@/lib/repositories/inventory";
import type { InventoryProgressStatus } from "@/lib/inventory/progress-stream";
import type {
  ClassificationResult,
  InventoryEntry,
  ResentmentExtraction
} from "@/lib/types";

type ProgressHandler = (event: InventoryProgressStatus) => void | Promise<void>;
type PreviewHandler = (delta: string) => void | Promise<void>;

export async function startInventory(
  userId: string,
  rawText: string,
  onProgress?: ProgressHandler,
  onPreviewDelta?: PreviewHandler
) {
  const timestamp = new Date().toISOString();
  const safetyAssessment = await logHandledSafetyCase(userId, rawText);

  if (safetyAssessment.isSafetyCase) {
    await onProgress?.({
      title: "Pausing the normal flow…",
      description:
        safetyAssessment.supportMessage ??
        "This needs human support first, not more inventory work right now."
    });

    return {
      entry: null,
      classification: {
        entry_type: "unknown",
        confidence: {
          resentment: 0,
          fear: 0
        },
        needs_clarification: false,
        clarifying_question: ""
      } satisfies ClassificationResult,
      safetyAssessment
    };
  }

  await onProgress?.({
    title: "Reading it straight…",
    description: "Keeping to the facts of what you wrote before the story grows."
  });
  await onProgress?.({
    title: "Checking the inventory…",
    description: "Sorting resentment from fear so we work the right column."
  });
  const classification = await classifyInventory(rawText);
  const entry: InventoryEntry = {
    id: crypto.randomUUID(),
    userId,
    createdAt: timestamp,
    rawText,
    clarificationText: null,
    entryType: classification.entry_type,
    confidence: classification.confidence,
    extractedResentment: null,
    extractedFear: null,
    shareableSummary: null,
    status: "in_progress",
    deletedAt: null
  };
  const created = await createInventoryEntry(entry);
  await syncInventoryEmbedding(created);

  if (
    !classification.needs_clarification &&
    (classification.entry_type === "resentment" || classification.entry_type === "both")
  ) {
    await onProgress?.({
      title: "Naming the resentment…",
      description: "Pulling out who it is, what happened, and where it hit."
    });
    await onProgress?.({
      title: "Drafting it live…",
      description: "You’re watching the first clean pass take shape."
    });
    const extractionPromise = extractResentment(rawText, rawText);
    const previewPromise = onPreviewDelta
      ? streamResentmentPreview(rawText, rawText, onPreviewDelta).catch((error) => {
          console.error("OpenAI live preview failed during startInventory.", error);
          return null;
        })
      : Promise.resolve(null);
    const [extraction] = await Promise.all([extractionPromise, previewPromise]);
    await onProgress?.({
      title: "Laying out next right actions…",
      description: "Keeping it practical and on your side of the street."
    });
    const updated = await updateInventoryEntry(created.id, {
      extractedResentment: extraction,
      shareableSummary: extraction.shareable_sponsor_summary
    });

    if (updated) {
      await Promise.all([
        replaceInventoryActions(updated.id, updated.userId, extraction.next_right_actions),
        syncInventoryEmbedding(updated)
      ]);

      return {
        entry: updated,
        classification,
        safetyAssessment
      };
    }
  }

  if (classification.needs_clarification) {
    await onProgress?.({
      title: "Tightening the question…",
      description: "One clean follow-up will make the inventory more honest."
    });
  }

  return {
    entry: created,
    classification,
    safetyAssessment
  };
}

export async function getClassificationForEntry(entry: InventoryEntry) {
  const classification = await classifyInventory(entry.rawText);

  return {
    ...classification,
    needs_clarification: !entry.clarificationText && classification.needs_clarification
  } satisfies ClassificationResult;
}

export async function submitClarification(id: string, clarificationText: string) {
  return submitClarificationWithProgress(id, clarificationText);
}

export async function submitClarificationWithProgress(
  id: string,
  clarificationText: string,
  onProgress?: ProgressHandler,
  onPreviewDelta?: PreviewHandler
) {
  const entry = await getInventoryEntry(id);

  if (!entry) {
    throw new Error("Inventory entry not found.");
  }

  const safetyAssessment = await logHandledSafetyCase(
    entry.userId,
    `${entry.rawText}\n${clarificationText}`
  );

  if (safetyAssessment.isSafetyCase) {
    await updateInventoryEntry(id, {
      clarificationText
    });
    await onProgress?.({
      title: "Pausing the normal flow...",
      description:
        safetyAssessment.supportMessage ??
        "This needs real human support first, not more inventory work right now."
    });

    return {
      entry: null,
      extraction: null,
      safetyAssessment
    };
  }

  await onProgress?.({
    title: "Working from the facts…",
    description: "Keeping the actual hit and dropping the speech."
  });
  await onProgress?.({
    title: "Naming the resentment…",
    description: "Pulling out the columns you can actually work with."
  });
  await onProgress?.({
    title: "Drafting it live…",
    description: "You’re seeing the resentment get cleaned up in real time."
  });
  const extractionPromise = extractResentment(entry.rawText, clarificationText);
  const previewPromise = onPreviewDelta
    ? streamResentmentPreview(entry.rawText, clarificationText, onPreviewDelta).catch(
        (error) => {
          console.error("OpenAI live preview failed during clarification.", error);
          return null;
        }
      )
    : Promise.resolve(null);
  const [extraction] = await Promise.all([extractionPromise, previewPromise]);
  await onProgress?.({
    title: "Laying out next right actions…",
    description: "Turning the resentment into something useful and actionable."
  });
  const updated = await updateInventoryEntry(id, {
    clarificationText,
    extractedResentment: extraction,
    shareableSummary: extraction.shareable_sponsor_summary,
    status: "in_progress"
  });

  if (!updated) {
    throw new Error("Could not save the clarification.");
  }

  await replaceInventoryActions(updated.id, updated.userId, extraction.next_right_actions);
  await syncInventoryEmbedding(updated);

  return {
    entry: updated,
    extraction,
    safetyAssessment
  };
}

export async function saveReviewedInventory(
  id: string,
  extraction: ResentmentExtraction
) {
  const entry = await getInventoryEntry(id);

  if (!entry) {
    throw new Error("Inventory entry not found.");
  }

  const shareableSummary = buildSponsorSummary(extraction);
  const updated = await updateInventoryEntry(id, {
    extractedResentment: {
      ...extraction,
      shareable_sponsor_summary: shareableSummary
    },
    shareableSummary,
    status: "in_progress"
  });

  if (!updated) {
    throw new Error("Could not save the inventory review.");
  }

  await replaceInventoryActions(
    updated.id,
    updated.userId,
    extraction.next_right_actions
  );
  await syncInventoryEmbedding(updated);

  return updated;
}

export async function setInventoryActionCompleted(actionId: string, completed: boolean) {
  const action = await toggleInventoryAction(actionId, completed);

  if (!action) {
    throw new Error("Action not found.");
  }

  return action;
}

export async function finishInventory(id: string) {
  const entry = await updateInventoryEntry(id, {
    status: "completed"
  });

  if (!entry) {
    throw new Error("Could not finish the inventory.");
  }

  return entry;
}
