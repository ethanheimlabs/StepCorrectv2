import { createInventoryEntryEmbedding } from "@/lib/ai/create-embedding";
import {
  feedbackModelLabel,
  generateFeedbackCards,
  generateWeeklyReflection
} from "@/lib/ai/generate-feedback-cards";
import { assessInventorySafety } from "@/lib/ai/safety";
import { findSimilarEmbeddings } from "@/lib/ai/similarity";
import { listDailyCheckIns } from "@/lib/repositories/checkins";
import { getInventoryEntry, listInventoryActions, listInventoryEntries } from "@/lib/repositories/inventory";
import {
  getInventoryEntryEmbedding,
  getPatternFeedbackRecord,
  listInventoryEntryEmbeddings,
  saveInventoryEntryEmbedding,
  savePatternFeedbackRecord
} from "@/lib/repositories/patterns";
import type {
  FeedbackCardSet,
  InventoryAction,
  InventoryEntry,
  PatternSummary
} from "@/lib/types";

import { buildPatternSummary } from "./build-pattern-summary";

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const delta = day === 0 ? -6 : 1 - day;

  next.setDate(next.getDate() + delta);
  next.setHours(0, 0, 0, 0);

  return next;
}

function endOfWeek(date: Date) {
  const next = startOfWeek(date);

  next.setDate(next.getDate() + 6);
  next.setHours(23, 59, 59, 999);

  return next;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function weeklyTimeframeKey(date = new Date()) {
  return `weekly:${toDateKey(startOfWeek(date))}`;
}

async function listActionsForEntries(entries: InventoryEntry[]) {
  const actionLists = await Promise.all(entries.map((entry) => listInventoryActions(entry.id)));

  return Object.fromEntries(
    entries.map((entry, index) => [entry.id, actionLists[index] satisfies InventoryAction[]])
  );
}

function buildEntryMap(entries: InventoryEntry[]) {
  return new Map(entries.map((entry) => [entry.id, entry]));
}

function countPriorSimilarEntries(
  targets: InventoryEntry[],
  allEntries: InventoryEntry[],
  embeddings: Awaited<ReturnType<typeof listInventoryEntryEmbeddings>>
) {
  const entryById = buildEntryMap(allEntries);
  const uniqueMatchIds = new Set<string>();

  for (const target of targets) {
    const targetEmbedding = embeddings.find((embedding) => embedding.entryId === target.id);

    if (!targetEmbedding) {
      continue;
    }

    const matches = findSimilarEmbeddings(
      targetEmbedding,
      embeddings.filter((candidate) => {
        if (candidate.entryId === target.id) {
          return false;
        }

        const candidateEntry = entryById.get(candidate.entryId);

        return Boolean(candidateEntry && candidateEntry.createdAt < target.createdAt);
      })
    );

    for (const match of matches) {
      uniqueMatchIds.add(match.entryId);
    }
  }

  return uniqueMatchIds.size;
}

export async function syncInventoryEmbedding(entry: InventoryEntry) {
  try {
    const embeddingPayload = await createInventoryEntryEmbedding(entry);

    if (!embeddingPayload) {
      return null;
    }

    return saveInventoryEntryEmbedding({
      entryId: entry.id,
      userId: entry.userId,
      sourceText: embeddingPayload.sourceText,
      embedding: embeddingPayload.embedding,
      model: embeddingPayload.model,
      dimensions: embeddingPayload.dimensions
    });
  } catch (error) {
    console.error("Could not sync inventory embedding.", error);
    return null;
  }
}

export async function buildInventoryPatternInsights(
  userId: string,
  focusEntryId?: string
): Promise<{
  summary: PatternSummary;
  cards: FeedbackCardSet;
}> {
  const entries = await listInventoryEntries(userId);
  const focusEntry = focusEntryId
    ? entries.find((entry) => entry.id === focusEntryId) ?? (await getInventoryEntry(focusEntryId))
    : entries[0] ?? null;

  const relevantEntries = focusEntry
    ? entries.filter((entry) => entry.createdAt <= focusEntry.createdAt)
    : entries;

  const [actionsByEntryId, checkIns, embeddings, focusEmbedding] = await Promise.all([
    listActionsForEntries(relevantEntries.slice(0, 24)),
    listDailyCheckIns(userId, 40),
    listInventoryEntryEmbeddings(userId, 40),
    focusEntry ? getInventoryEntryEmbedding(focusEntry.id) : Promise.resolve(null)
  ]);
  const entryById = buildEntryMap(relevantEntries);

  const similarEntries = findSimilarEmbeddings(
    focusEmbedding,
    embeddings.filter((embedding) => {
      if (embedding.entryId === focusEmbedding?.entryId) {
        return false;
      }

      const candidateEntry = entryById.get(embedding.entryId);

      return Boolean(
        candidateEntry && focusEntry && candidateEntry.createdAt <= focusEntry.createdAt
      );
    })
  );
  const summary = buildPatternSummary({
    entries: relevantEntries.slice(0, 24),
    actionsByEntryId,
    checkIns,
    similarEntryCount: similarEntries.length
  });
  const cards = await generateFeedbackCards(summary);

  return {
    summary,
    cards
  };
}

export async function getWeeklyPatternReflection(userId: string) {
  const timeframe = weeklyTimeframeKey();
  const existing = await getPatternFeedbackRecord(userId, timeframe);

  const [entries, checkIns, embeddings] = await Promise.all([
    listInventoryEntries(userId),
    listDailyCheckIns(userId, 20),
    listInventoryEntryEmbeddings(userId, 20)
  ]);
  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());
  const weeklyEntries = entries.filter((entry) => {
    const createdAt = new Date(entry.createdAt);
    return createdAt >= weekStart && createdAt <= weekEnd;
  });
  const actionsByEntryId = await listActionsForEntries(weeklyEntries);
  const existingCreatedAt = existing ? new Date(existing.createdAt).getTime() : 0;
  const hasNewWeeklyEntry = weeklyEntries.some(
    (entry) => new Date(entry.createdAt).getTime() > existingCreatedAt
  );
  const hasNewCheckIn = checkIns.some(
    (checkIn) => new Date(checkIn.createdAt).getTime() > existingCreatedAt
  );
  const hasNewActionUpdate = Object.values(actionsByEntryId)
    .flat()
    .some((action) => action.completedAt && new Date(action.completedAt).getTime() > existingCreatedAt);

  if (existing && !hasNewWeeklyEntry && !hasNewCheckIn && !hasNewActionUpdate) {
    return {
      timeframe,
      summary: existing.summary as unknown as PatternSummary,
      reflection: existing.feedbackText,
      model: existing.model
    };
  }

  const summary = buildPatternSummary({
    entries: weeklyEntries,
    actionsByEntryId,
    checkIns,
    similarEntryCount: countPriorSimilarEntries(weeklyEntries, entries, embeddings)
  });
  const reflection = await generateWeeklyReflection(summary);
  const record = await savePatternFeedbackRecord({
    userId,
    timeframe,
    summary: summary as unknown as Record<string, unknown>,
    feedbackText: reflection,
    model: feedbackModelLabel()
  });

  return {
    timeframe,
    summary,
    reflection,
    model: record.model
  };
}

export async function logHandledSafetyCase(userId: string, rawText: string) {
  const assessment = assessInventorySafety(rawText);

  if (!assessment.isSafetyCase) {
    return assessment;
  }

  try {
    await savePatternFeedbackRecord({
      userId,
      timeframe: `safety:${new Date().toISOString()}`,
      summary: {
        type: "safety_case",
        tags: assessment.tags
      },
      feedbackText: assessment.supportMessage ?? "",
      model: "safety-rule"
    });
  } catch (error) {
    console.error("Could not log handled safety case.", error);
  }

  return assessment;
}
