"use client";

import {
  STEP_COPY,
  buildCheckInGuidance,
  classifyInventory,
  createInventoryEntry,
  extractResentment
} from "@stepcorrect/core";
import type {
  ClassificationResult,
  DailyCheckIn,
  InventoryAction,
  InventoryEntry,
  Profile,
  ResentmentExtraction,
  StepProgress
} from "@stepcorrect/core";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { buildPatternInsights, buildWeeklyReflection } from "@/lib/insights";
import type { SafetyAssessment, WeeklyReflectionSnapshot } from "@/lib/mobile-types";
import { assessInventorySafety } from "@/lib/safety";

const DemoStoreContext = createContext<{
  profile: Profile;
  entries: InventoryEntry[];
  actions: InventoryAction[];
  checkIns: DailyCheckIn[];
  steps: StepProgress[];
  startInventory: (rawText: string) => {
    entry: InventoryEntry | null;
    classification: ClassificationResult;
    safetyAssessment: SafetyAssessment;
  };
  submitClarification: (
    entryId: string,
    clarificationText: string
  ) => {
    entry: InventoryEntry | null;
    safetyAssessment: SafetyAssessment;
  };
  saveReview: (entryId: string, extraction: ResentmentExtraction) => InventoryEntry;
  toggleAction: (actionId: string, completed: boolean) => void;
  finishInventory: (entryId: string) => InventoryEntry;
  saveCheckIn: (checkIn: Omit<DailyCheckIn, "id" | "createdAt">) => string;
  updateProfile: (updates: Partial<Profile>) => void;
  getEntry: (entryId: string) => InventoryEntry | null;
  getEntryActions: (entryId: string) => InventoryAction[];
  getPatternInsights: (entryId?: string) => ReturnType<typeof buildPatternInsights>;
  getWeeklyReflection: () => WeeklyReflectionSnapshot;
} | null>(null);

const INITIAL_PROFILE: Profile = {
  id: "demo-user",
  fullName: "Friend",
  sobrietyDate: null,
  toneMode: "Direct"
};

function isoDaysAgo(days: number, hour: number, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function buildInitialSteps(): StepProgress[] {
  return STEP_COPY.map((step) => ({
    id: `step-${step.stepNumber}`,
    stepNumber: step.stepNumber,
    status:
      step.stepNumber <= 2 ? "completed" : step.stepNumber <= 4 ? "in_progress" : "not_started",
    updatedAt: isoDaysAgo(12 - Math.min(step.stepNumber, 6), 9)
  }));
}

function seededEntries(): InventoryEntry[] {
  return [
    {
      id: "mobile-entry-1",
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
      shareableSummary:
        "Resentful at my sister for criticizing my recovery in front of family. It hit self-esteem, security, pride, and relationships. My part is chasing approval instead of holding a boundary. I am calling my sponsor and writing the facts down.",
      status: "completed"
    },
    {
      id: "mobile-entry-2",
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
      shareableSummary:
        "Resentful at my boss for questioning my reliability after I moved a meeting. It hit self-esteem, security, ambitions, pride, and money fear. My part is reacting before I have the facts.",
      status: "completed"
    },
    {
      id: "mobile-entry-3",
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
      shareableSummary:
        "Resentful at my partner for bringing up my last relapse during an argument. It hit self-esteem, security, pride, and the relationship. My part is staying in the fight after I am already lit up.",
      status: "completed"
    },
    {
      id: "mobile-entry-4",
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
      shareableSummary:
        "Resentful at my sister for telling family I am not doing enough in recovery. It hit self-esteem, security, pride, and relationships. My part is chasing approval instead of keeping a boundary.",
      status: "completed"
    }
  ];
}

function seededActions(): InventoryAction[] {
  return [
    {
      id: "action-1",
      entryId: "mobile-entry-1",
      actionText: "Call sponsor before talking to family again",
      completed: true,
      completedAt: isoDaysAgo(7, 19, 30)
    },
    {
      id: "action-2",
      entryId: "mobile-entry-1",
      actionText: "Write a short 10th Step on the facts",
      completed: true,
      completedAt: isoDaysAgo(7, 20, 0)
    },
    {
      id: "action-3",
      entryId: "mobile-entry-1",
      actionText: "Do not argue about recovery tonight",
      completed: true,
      completedAt: isoDaysAgo(7, 20, 15)
    },
    {
      id: "action-4",
      entryId: "mobile-entry-2",
      actionText: "Write the facts before replying",
      completed: true,
      completedAt: isoDaysAgo(4, 18, 0)
    },
    {
      id: "action-5",
      entryId: "mobile-entry-2",
      actionText: "Ask one calm follow-up instead of assuming",
      completed: false,
      completedAt: null
    },
    {
      id: "action-6",
      entryId: "mobile-entry-2",
      actionText: "Call sponsor if I stay spun up after work",
      completed: false,
      completedAt: null
    },
    {
      id: "action-7",
      entryId: "mobile-entry-3",
      actionText: "Pause before replying again",
      completed: true,
      completedAt: isoDaysAgo(2, 20, 45)
    },
    {
      id: "action-8",
      entryId: "mobile-entry-3",
      actionText: "Write the facts instead of the speech",
      completed: true,
      completedAt: isoDaysAgo(1, 7, 30)
    },
    {
      id: "action-9",
      entryId: "mobile-entry-3",
      actionText: "Talk it through with sponsor before making it bigger",
      completed: false,
      completedAt: null
    },
    {
      id: "action-10",
      entryId: "mobile-entry-4",
      actionText: "Call sponsor before replying to family",
      completed: false,
      completedAt: null
    },
    {
      id: "action-11",
      entryId: "mobile-entry-4",
      actionText: "Write the facts before talking tonight",
      completed: false,
      completedAt: null
    },
    {
      id: "action-12",
      entryId: "mobile-entry-4",
      actionText: "Do not argue by text today",
      completed: false,
      completedAt: null
    }
  ];
}

function seededCheckIns(): DailyCheckIn[] {
  return [
    {
      id: "checkin-1",
      createdAt: isoDaysAgo(7, 8),
      mood: 4,
      craving: 6,
      halt: { hungry: false, angry: true, lonely: true, tired: false },
      note: "Already carrying family stuff."
    },
    {
      id: "checkin-2",
      createdAt: isoDaysAgo(6, 8),
      mood: 6,
      craving: 3,
      halt: { hungry: false, angry: false, lonely: false, tired: false },
      note: "Felt better after writing and reaching out."
    },
    {
      id: "checkin-3",
      createdAt: isoDaysAgo(4, 8),
      mood: 5,
      craving: 5,
      halt: { hungry: false, angry: true, lonely: false, tired: false },
      note: "Work pressure."
    },
    {
      id: "checkin-4",
      createdAt: isoDaysAgo(3, 8),
      mood: 5,
      craving: 5,
      halt: { hungry: false, angry: false, lonely: false, tired: true },
      note: "Still a little spun."
    },
    {
      id: "checkin-5",
      createdAt: isoDaysAgo(2, 8),
      mood: 4,
      craving: 6,
      halt: { hungry: false, angry: true, lonely: true, tired: false },
      note: "Relationship argument still running in my head."
    },
    {
      id: "checkin-6",
      createdAt: isoDaysAgo(1, 8),
      mood: 7,
      craving: 3,
      halt: { hungry: false, angry: false, lonely: false, tired: false },
      note: "Writing it out helped."
    },
    {
      id: "checkin-7",
      createdAt: isoDaysAgo(0, 9),
      mood: 6,
      craving: 4,
      halt: { hungry: false, angry: false, lonely: false, tired: false },
      note: "Family call still tender but not as loaded."
    }
  ];
}

function createActions(entryId: string, items: string[]): InventoryAction[] {
  return items.map((actionText, index) => ({
    id: `${entryId}-action-${index + 1}`,
    entryId,
    actionText,
    completed: false,
    completedAt: null
  }));
}

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [entries, setEntries] = useState<InventoryEntry[]>(() => seededEntries());
  const [actions, setActions] = useState<InventoryAction[]>(() => seededActions());
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>(() => seededCheckIns());
  const [steps] = useState<StepProgress[]>(buildInitialSteps());

  function getEntry(entryId: string) {
    return entries.find((entry) => entry.id === entryId) ?? null;
  }

  function getEntryActions(entryId: string) {
    return actions.filter((action) => action.entryId === entryId);
  }

  function getPatternInsights(entryId?: string) {
    return buildPatternInsights(entries, actions, checkIns, entryId);
  }

  function getWeeklyReflection() {
    return buildWeeklyReflection(entries, actions, checkIns);
  }

  function startInventory(rawText: string) {
    const safetyAssessment = assessInventorySafety(rawText);

    if (safetyAssessment.isSafetyCase) {
      return {
        entry: null,
        classification: {
          entry_type: "unknown",
          confidence: {
            resentment: 0,
            fear: 0
          },
          needs_clarification: false,
          clarifying_question: null
        } satisfies ClassificationResult,
        safetyAssessment
      };
    }

    const entry = createInventoryEntry(rawText);
    const classification = classifyInventory(rawText);

    if (!classification.needs_clarification && classification.entry_type === "resentment") {
      const extraction = extractResentment(rawText, rawText);
      entry.extractedResentment = extraction;
      entry.shareableSummary = extraction.shareable_sponsor_summary;
      setActions((current) => [...createActions(entry.id, extraction.next_right_actions), ...current]);
    }

    setEntries((current) => [entry, ...current]);

    return {
      entry,
      classification,
      safetyAssessment
    };
  }

  function submitClarification(entryId: string, clarificationText: string) {
    const current = getEntry(entryId);

    if (!current) {
      throw new Error("Inventory entry not found.");
    }

    const safetyAssessment = assessInventorySafety(`${current.rawText}\n${clarificationText}`);

    if (safetyAssessment.isSafetyCase) {
      return {
        entry: null,
        safetyAssessment
      };
    }

    const extraction = extractResentment(current.rawText, clarificationText);
    const nextEntry: InventoryEntry = {
      ...current,
      clarificationText,
      extractedResentment: extraction,
      shareableSummary: extraction.shareable_sponsor_summary
    };

    setEntries((items) => items.map((entry) => (entry.id === entryId ? nextEntry : entry)));
    setActions((items) => [
      ...items.filter((action) => action.entryId !== entryId),
      ...createActions(entryId, extraction.next_right_actions)
    ]);

    return {
      entry: nextEntry,
      safetyAssessment
    };
  }

  function saveReview(entryId: string, extraction: ResentmentExtraction) {
    const current = getEntry(entryId);

    if (!current) {
      throw new Error("Inventory entry not found.");
    }

    const nextEntry: InventoryEntry = {
      ...current,
      extractedResentment: extraction,
      shareableSummary: extraction.shareable_sponsor_summary
    };

    setEntries((items) => items.map((entry) => (entry.id === entryId ? nextEntry : entry)));
    setActions((items) => [
      ...items.filter((action) => action.entryId !== entryId),
      ...createActions(entryId, extraction.next_right_actions)
    ]);

    return nextEntry;
  }

  function toggleAction(actionId: string, completed: boolean) {
    setActions((current) =>
      current.map((action) =>
        action.id === actionId
          ? {
              ...action,
              completed,
              completedAt: completed ? new Date().toISOString() : null
            }
          : action
      )
    );
  }

  function finishInventory(entryId: string) {
    const current = getEntry(entryId);

    if (!current) {
      throw new Error("Inventory entry not found.");
    }

    const nextEntry: InventoryEntry = {
      ...current,
      status: "completed"
    };

    setEntries((items) => items.map((entry) => (entry.id === entryId ? nextEntry : entry)));
    return nextEntry;
  }

  function saveCheckIn(checkIn: Omit<DailyCheckIn, "id" | "createdAt">) {
    const nextCheckIn: DailyCheckIn = {
      id: `checkin-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...checkIn
    };

    setCheckIns((current) => [nextCheckIn, ...current]);
    return buildCheckInGuidance(nextCheckIn);
  }

  function updateProfile(updates: Partial<Profile>) {
    setProfile((current) => ({
      ...current,
      ...updates
    }));
  }

  const value = useMemo(
    () => ({
      profile,
      entries,
      actions,
      checkIns,
      steps,
      startInventory,
      submitClarification,
      saveReview,
      toggleAction,
      finishInventory,
      saveCheckIn,
      updateProfile,
      getEntry,
      getEntryActions,
      getPatternInsights,
      getWeeklyReflection
    }),
    [profile, entries, actions, checkIns, steps]
  );

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>;
}

export function useDemoStore() {
  const value = useContext(DemoStoreContext);

  if (!value) {
    throw new Error("Demo store is missing.");
  }

  return value;
}
