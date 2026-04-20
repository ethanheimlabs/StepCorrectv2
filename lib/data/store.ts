import { promises as fs } from "fs";
import { randomUUID } from "crypto";
import path from "path";

import { buildInventoryEntryEmbeddingSourceText } from "@/lib/ai/embedding-source";
import { createLocalTextEmbedding } from "@/lib/ai/local-embedding";
import {
  DEFAULT_TONE_MODE,
  DEMO_USER_ID,
  DEMO_USER_NAME,
  STEP_COPY
} from "@/lib/constants";
import type {
  DailyCheckIn,
  InventoryAction,
  InventoryEntry,
  InventoryEntryEmbedding,
  PatternFeedbackRecord,
  Profile,
  StepProgress
} from "@/lib/types";
import { resolveWritableDataPath } from "@/lib/data/storage-path";
import { shouldUseSeededFallbackStore } from "@/lib/runtime-mode";

const STORE_PATH = resolveWritableDataPath("stepcorrect-store.json");

interface StepCorrectStore {
  profiles: Record<string, Profile>;
  inventoryEntries: Record<string, InventoryEntry>;
  inventoryActions: Record<string, InventoryAction>;
  inventoryEntryEmbeddings: Record<string, InventoryEntryEmbedding>;
  patternFeedback: Record<string, PatternFeedbackRecord>;
  dailyCheckins: Record<string, DailyCheckIn>;
  stepProgress: Record<string, StepProgress>;
}

const EMPTY_STORE: StepCorrectStore = {
  profiles: {},
  inventoryEntries: {},
  inventoryActions: {},
  inventoryEntryEmbeddings: {},
  patternFeedback: {},
  dailyCheckins: {},
  stepProgress: {}
};

let storeWriteQueue = Promise.resolve();

function buildFallbackStore() {
  return shouldUseSeededFallbackStore() ? buildDemoSeedStore() : EMPTY_STORE;
}

function recoverJsonDocument(raw: string) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  let endIndex = -1;

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === "\"") {
        inString = false;
      }

      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{" || char === "[") {
      depth += 1;
      continue;
    }

    if (char === "}" || char === "]") {
      depth -= 1;

      if (depth === 0) {
        endIndex = index + 1;
        break;
      }
    }
  }

  if (endIndex === -1) {
    return null;
  }

  const recovered = raw.slice(0, endIndex);

  try {
    JSON.parse(recovered);
    return recovered;
  } catch {
    return null;
  }
}

async function writeJsonAtomically(targetPath: string, value: StepCorrectStore) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });

  const tempPath = `${targetPath}.${process.pid}.${Date.now()}.${randomUUID()}.tmp`;
  const content = JSON.stringify(value, null, 2);

  await fs.writeFile(tempPath, content, "utf8");
  await fs.rename(tempPath, targetPath);
}

async function withStoreWriteLock<T>(operation: () => Promise<T>) {
  const nextOperation = storeWriteQueue.then(operation, operation);

  storeWriteQueue = nextOperation.then(
    () => undefined,
    () => undefined
  );

  return nextOperation;
}

async function parseStoreFile() {
  const content = await fs.readFile(STORE_PATH, "utf8");

  try {
    return JSON.parse(content) as StepCorrectStore;
  } catch (error) {
    const recovered = recoverJsonDocument(content);

    if (recovered) {
      const parsed = JSON.parse(recovered) as StepCorrectStore;
      await fs.writeFile(STORE_PATH, recovered, "utf8");
      return parsed;
    }

    const backupPath = `${STORE_PATH}.corrupt-${Date.now()}`;

    try {
      await fs.writeFile(backupPath, content, "utf8");
    } catch {
      // Best effort only. We still want to recover with a fresh store if backup fails.
    }

    const fallback = buildFallbackStore();
    await writeJsonAtomically(STORE_PATH, fallback);

    if (error instanceof Error) {
      console.error(`Recovered from unreadable StepCorrect store at ${STORE_PATH}.`, error);
    }

    return fallback;
  }
}

function isEmptyStore(store: StepCorrectStore) {
  return (
    !Object.keys(store.profiles).length &&
    !Object.keys(store.inventoryEntries).length &&
    !Object.keys(store.inventoryActions).length &&
    !Object.keys(store.inventoryEntryEmbeddings).length &&
    !Object.keys(store.patternFeedback).length &&
    !Object.keys(store.dailyCheckins).length &&
    !Object.keys(store.stepProgress).length
  );
}

function isoDaysAgo(days: number, hour: number, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function buildDemoSeedStore(): StepCorrectStore {
  const entries: InventoryEntry[] = [
    {
      id: "00000000-0000-0000-0000-000000000101",
      userId: DEMO_USER_ID,
      createdAt: isoDaysAgo(7, 18),
      rawText: "I'm resentful at my sister",
      clarificationText: "Criticized my recovery in front of my mom",
      entryType: "resentment",
      confidence: {
        resentment: 0.93,
        fear: 0.18
      },
      extractedResentment: {
        type: "resentment",
        who_or_what: "My sister",
        what_happened_facts:
          "She criticized my recovery in front of family and said I am still not doing enough",
        affects: {
          self_esteem: true,
          security: true,
          ambitions: false,
          personal_relations: true,
          sex_relations: false,
          pride: true,
          pocketbook: false
        },
        my_part_controlled:
          "I keep chasing her approval and I have not been clear about what recovery conversations I am willing to have",
        defects_or_patterns: ["people_pleasing", "fear", "control"],
        next_right_actions: [
          "Call sponsor before talking to family again",
          "Write a short 10th Step on the facts",
          "Do not argue about recovery tonight"
        ],
        shareable_sponsor_summary:
          "Resentful at my sister for criticizing my recovery in front of family. It hit self-esteem, security, pride, and relationships. My part is chasing approval instead of holding a boundary. I am calling my sponsor and writing the facts down."
      },
      extractedFear: null,
      shareableSummary:
        "Resentful at my sister for criticizing my recovery in front of family. It hit self-esteem, security, pride, and relationships. My part is chasing approval instead of holding a boundary. I am calling my sponsor and writing the facts down.",
      status: "completed",
      deletedAt: null
    },
    {
      id: "00000000-0000-0000-0000-000000000102",
      userId: DEMO_USER_ID,
      createdAt: isoDaysAgo(4, 17),
      rawText: "I'm resentful at my boss",
      clarificationText: "Questioned whether I was reliable after I moved a meeting",
      entryType: "resentment",
      confidence: {
        resentment: 0.9,
        fear: 0.22
      },
      extractedResentment: {
        type: "resentment",
        who_or_what: "My boss",
        what_happened_facts:
          "He questioned whether I was serious about work after I asked to move a meeting",
        affects: {
          self_esteem: true,
          security: true,
          ambitions: true,
          personal_relations: false,
          sex_relations: false,
          pride: true,
          pocketbook: true
        },
        my_part_controlled:
          "I started defending myself before I had the facts and I let one comment turn into a whole story",
        defects_or_patterns: ["defensiveness", "fear", "control"],
        next_right_actions: [
          "Write the facts before replying",
          "Ask one calm follow-up instead of assuming",
          "Call sponsor if I stay spun up after work"
        ],
        shareable_sponsor_summary:
          "Resentful at my boss for questioning my reliability after I moved a meeting. It hit self-esteem, security, ambitions, pride, and money fear. My part is reacting before I have the facts."
      },
      extractedFear: null,
      shareableSummary:
        "Resentful at my boss for questioning my reliability after I moved a meeting. It hit self-esteem, security, ambitions, pride, and money fear. My part is reacting before I have the facts.",
      status: "completed",
      deletedAt: null
    },
    {
      id: "00000000-0000-0000-0000-000000000103",
      userId: DEMO_USER_ID,
      createdAt: isoDaysAgo(2, 20),
      rawText: "I'm resentful at my partner",
      clarificationText: "Brought up my last relapse in an argument",
      entryType: "resentment",
      confidence: {
        resentment: 0.91,
        fear: 0.24
      },
      extractedResentment: {
        type: "resentment",
        who_or_what: "My partner",
        what_happened_facts:
          "She brought up my last relapse during an argument and used it to make her point",
        affects: {
          self_esteem: true,
          security: true,
          ambitions: false,
          personal_relations: true,
          sex_relations: false,
          pride: true,
          pocketbook: false
        },
        my_part_controlled:
          "I was already loaded up, I kept pushing to be understood, and I did not pause before answering",
        defects_or_patterns: ["resentment_loop", "control", "fear"],
        next_right_actions: [
          "Pause before replying again",
          "Write the facts instead of the speech",
          "Talk it through with sponsor before making it bigger"
        ],
        shareable_sponsor_summary:
          "Resentful at my partner for bringing up my last relapse during an argument. It hit self-esteem, security, pride, and the relationship. My part is staying in the fight after I am already lit up."
      },
      extractedFear: null,
      shareableSummary:
        "Resentful at my partner for bringing up my last relapse during an argument. It hit self-esteem, security, pride, and the relationship. My part is staying in the fight after I am already lit up.",
      status: "completed",
      deletedAt: null
    },
    {
      id: "00000000-0000-0000-0000-000000000104",
      userId: DEMO_USER_ID,
      createdAt: isoDaysAgo(0, 16),
      rawText: "I'm resentful at my sister",
      clarificationText: "Told family I am still not doing enough in recovery",
      entryType: "resentment",
      confidence: {
        resentment: 0.94,
        fear: 0.21
      },
      extractedResentment: {
        type: "resentment",
        who_or_what: "My sister",
        what_happened_facts:
          "She told family I am still not doing enough in recovery and kept pushing the point on a call",
        affects: {
          self_esteem: true,
          security: true,
          ambitions: false,
          personal_relations: true,
          sex_relations: false,
          pride: true,
          pocketbook: false
        },
        my_part_controlled:
          "I am still looking for approval from her and I have not kept the conversation on my side of the street",
        defects_or_patterns: ["people_pleasing", "resentment_loop", "control"],
        next_right_actions: [
          "Call sponsor before replying to family",
          "Write the facts before talking tonight",
          "Do not argue by text today"
        ],
        shareable_sponsor_summary:
          "Resentful at my sister for telling family I am not doing enough in recovery. It hit self-esteem, security, pride, and relationships. My part is chasing approval instead of keeping a boundary."
      },
      extractedFear: null,
      shareableSummary:
        "Resentful at my sister for telling family I am not doing enough in recovery. It hit self-esteem, security, pride, and relationships. My part is chasing approval instead of keeping a boundary.",
      status: "completed",
      deletedAt: null
    }
  ];

  const actions: InventoryAction[] = [
    {
      id: "00000000-0000-0000-0000-000000000201",
      entryId: entries[0].id,
      userId: DEMO_USER_ID,
      actionText: "Call sponsor before talking to family again",
      completed: true,
      completedAt: isoDaysAgo(7, 19, 30)
    },
    {
      id: "00000000-0000-0000-0000-000000000202",
      entryId: entries[0].id,
      userId: DEMO_USER_ID,
      actionText: "Write a short 10th Step on the facts",
      completed: true,
      completedAt: isoDaysAgo(7, 20, 0)
    },
    {
      id: "00000000-0000-0000-0000-000000000203",
      entryId: entries[0].id,
      userId: DEMO_USER_ID,
      actionText: "Do not argue about recovery tonight",
      completed: true,
      completedAt: isoDaysAgo(7, 20, 15)
    },
    {
      id: "00000000-0000-0000-0000-000000000204",
      entryId: entries[1].id,
      userId: DEMO_USER_ID,
      actionText: "Write the facts before replying",
      completed: true,
      completedAt: isoDaysAgo(4, 18, 0)
    },
    {
      id: "00000000-0000-0000-0000-000000000205",
      entryId: entries[1].id,
      userId: DEMO_USER_ID,
      actionText: "Ask one calm follow-up instead of assuming",
      completed: false,
      completedAt: null
    },
    {
      id: "00000000-0000-0000-0000-000000000206",
      entryId: entries[1].id,
      userId: DEMO_USER_ID,
      actionText: "Call sponsor if I stay spun up after work",
      completed: false,
      completedAt: null
    },
    {
      id: "00000000-0000-0000-0000-000000000207",
      entryId: entries[2].id,
      userId: DEMO_USER_ID,
      actionText: "Pause before replying again",
      completed: true,
      completedAt: isoDaysAgo(2, 20, 45)
    },
    {
      id: "00000000-0000-0000-0000-000000000208",
      entryId: entries[2].id,
      userId: DEMO_USER_ID,
      actionText: "Write the facts instead of the speech",
      completed: true,
      completedAt: isoDaysAgo(1, 7, 30)
    },
    {
      id: "00000000-0000-0000-0000-000000000209",
      entryId: entries[2].id,
      userId: DEMO_USER_ID,
      actionText: "Talk it through with sponsor before making it bigger",
      completed: false,
      completedAt: null
    },
    {
      id: "00000000-0000-0000-0000-000000000210",
      entryId: entries[3].id,
      userId: DEMO_USER_ID,
      actionText: "Call sponsor before replying to family",
      completed: false,
      completedAt: null
    },
    {
      id: "00000000-0000-0000-0000-000000000211",
      entryId: entries[3].id,
      userId: DEMO_USER_ID,
      actionText: "Write the facts before talking tonight",
      completed: false,
      completedAt: null
    },
    {
      id: "00000000-0000-0000-0000-000000000212",
      entryId: entries[3].id,
      userId: DEMO_USER_ID,
      actionText: "Do not argue by text today",
      completed: false,
      completedAt: null
    }
  ];

  const dailyCheckins: DailyCheckIn[] = [
    {
      id: "00000000-0000-0000-0000-000000000301",
      userId: DEMO_USER_ID,
      createdAt: isoDaysAgo(7, 8),
      mood: 4,
      craving: 6,
      halt: { hungry: false, angry: true, lonely: true, tired: false },
      note: "Already carrying family stuff."
    },
    {
      id: "00000000-0000-0000-0000-000000000302",
      userId: DEMO_USER_ID,
      createdAt: isoDaysAgo(6, 8),
      mood: 6,
      craving: 3,
      halt: { hungry: false, angry: false, lonely: false, tired: false },
      note: "Felt better after writing and reaching out."
    },
    {
      id: "00000000-0000-0000-0000-000000000303",
      userId: DEMO_USER_ID,
      createdAt: isoDaysAgo(4, 8),
      mood: 5,
      craving: 5,
      halt: { hungry: false, angry: true, lonely: false, tired: false },
      note: "Work pressure."
    },
    {
      id: "00000000-0000-0000-0000-000000000304",
      userId: DEMO_USER_ID,
      createdAt: isoDaysAgo(3, 8),
      mood: 5,
      craving: 5,
      halt: { hungry: false, angry: false, lonely: false, tired: true },
      note: "Still a little spun."
    },
    {
      id: "00000000-0000-0000-0000-000000000305",
      userId: DEMO_USER_ID,
      createdAt: isoDaysAgo(2, 8),
      mood: 4,
      craving: 6,
      halt: { hungry: false, angry: true, lonely: true, tired: false },
      note: "Relationship argument still running in my head."
    },
    {
      id: "00000000-0000-0000-0000-000000000306",
      userId: DEMO_USER_ID,
      createdAt: isoDaysAgo(1, 8),
      mood: 7,
      craving: 3,
      halt: { hungry: false, angry: false, lonely: false, tired: false },
      note: "Writing it out helped."
    },
    {
      id: "00000000-0000-0000-0000-000000000307",
      userId: DEMO_USER_ID,
      createdAt: isoDaysAgo(0, 9),
      mood: 6,
      craving: 4,
      halt: { hungry: false, angry: false, lonely: false, tired: false },
      note: "Family call still tender but not as loaded."
    }
  ];

  const inventoryEntryEmbeddings = Object.fromEntries(
    entries.map((entry, index) => {
      const sourceText = buildInventoryEntryEmbeddingSourceText(entry);
      const embeddingPayload = createLocalTextEmbedding(sourceText);
      const embedding: InventoryEntryEmbedding = {
        id: `00000000-0000-0000-0000-00000000040${index + 1}`,
        entryId: entry.id,
        userId: entry.userId,
        createdAt: entry.createdAt,
        sourceText,
        embedding: embeddingPayload.embedding,
        model: embeddingPayload.model,
        dimensions: embeddingPayload.dimensions
      };

      return [embedding.id, embedding];
    })
  );

  const profiles: Record<string, Profile> = {
    [DEMO_USER_ID]: {
      id: DEMO_USER_ID,
      createdAt: isoDaysAgo(30, 9),
      fullName: DEMO_USER_NAME,
      sobrietyDate: null,
      toneMode: DEFAULT_TONE_MODE
    }
  };

  const stepProgress: Record<string, StepProgress> = Object.fromEntries(
    STEP_COPY.slice(0, 4).map((step, index) => {
      const progress: StepProgress = {
        id: `00000000-0000-0000-0000-00000000050${index + 1}`,
        userId: DEMO_USER_ID,
        stepNumber: step.stepNumber,
        status:
          step.stepNumber === 1
            ? "completed"
            : step.stepNumber === 2
              ? "completed"
              : step.stepNumber === 3
                ? "in_progress"
                : "in_progress",
        updatedAt: isoDaysAgo(index + 1, 9)
      };

      return [progress.id, progress];
    })
  );

  return {
    profiles,
    inventoryEntries: Object.fromEntries(entries.map((entry) => [entry.id, entry])),
    inventoryActions: Object.fromEntries(actions.map((action) => [action.id, action])),
    inventoryEntryEmbeddings,
    patternFeedback: {},
    dailyCheckins: Object.fromEntries(dailyCheckins.map((checkIn) => [checkIn.id, checkIn])),
    stepProgress
  };
}

async function ensureStore() {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });

  try {
    await fs.access(STORE_PATH);
  } catch {
    await writeJsonAtomically(STORE_PATH, buildFallbackStore());
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    const parsed = await parseStoreFile();

    if (isEmptyStore(parsed)) {
      await writeJsonAtomically(STORE_PATH, buildDemoSeedStore());
    }
  }
}

export async function readStore() {
  await ensureStore();
  return parseStoreFile();
}

export async function writeStore(store: StepCorrectStore) {
  await withStoreWriteLock(async () => {
    await ensureStore();
    await writeJsonAtomically(STORE_PATH, store);
  });
}

export async function updateStore(
  updater: (store: StepCorrectStore) => StepCorrectStore | Promise<StepCorrectStore>
) {
  return withStoreWriteLock(async () => {
    const current = await readStore();
    const next = await updater(current);
    await writeJsonAtomically(STORE_PATH, next);
    return next;
  });
}
