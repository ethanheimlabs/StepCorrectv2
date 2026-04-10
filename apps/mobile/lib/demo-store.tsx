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
import { createContext, useContext, useState } from "react";

const DemoStoreContext = createContext<{
  profile: Profile;
  entries: InventoryEntry[];
  actions: InventoryAction[];
  checkIns: DailyCheckIn[];
  steps: StepProgress[];
  startInventory: (rawText: string) => {
    entry: InventoryEntry;
    classification: ClassificationResult;
  };
  submitClarification: (entryId: string, clarificationText: string) => InventoryEntry;
  saveReview: (entryId: string, extraction: ResentmentExtraction) => InventoryEntry;
  toggleAction: (actionId: string, completed: boolean) => void;
  finishInventory: (entryId: string) => InventoryEntry;
  saveCheckIn: (checkIn: Omit<DailyCheckIn, "id" | "createdAt">) => string;
  updateProfile: (updates: Partial<Profile>) => void;
  getEntry: (entryId: string) => InventoryEntry | null;
  getEntryActions: (entryId: string) => InventoryAction[];
} | null>(null);

const INITIAL_PROFILE: Profile = {
  id: "demo-user",
  fullName: "Friend",
  sobrietyDate: null,
  toneMode: "Direct"
};

function buildInitialSteps(): StepProgress[] {
  const timestamp = new Date().toISOString();

  return STEP_COPY.map((step) => ({
    id: `step-${step.stepNumber}`,
    stepNumber: step.stepNumber,
    status:
      step.stepNumber < 4 ? "completed" : step.stepNumber === 4 ? "in_progress" : "not_started",
    updatedAt: timestamp
  }));
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

export function DemoStoreProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [entries, setEntries] = useState<InventoryEntry[]>([]);
  const [actions, setActions] = useState<InventoryAction[]>([]);
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const [steps] = useState<StepProgress[]>(buildInitialSteps());

  function getEntry(entryId: string) {
    return entries.find((entry) => entry.id === entryId) ?? null;
  }

  function getEntryActions(entryId: string) {
    return actions.filter((action) => action.entryId === entryId);
  }

  function startInventory(rawText: string) {
    const entry = createInventoryEntry(rawText);
    const classification = classifyInventory(rawText);

    if (!classification.needs_clarification && classification.entry_type === "resentment") {
      const extraction = extractResentment(rawText, rawText);
      entry.extractedResentment = extraction;
      entry.shareableSummary = extraction.shareable_sponsor_summary;
      setActions((current) => [...createActions(entry.id, extraction.next_right_actions), ...current]);
    }

    setEntries((current) => [entry, ...current]);

    return { entry, classification };
  }

  function submitClarification(entryId: string, clarificationText: string) {
    const current = getEntry(entryId);

    if (!current) {
      throw new Error("Inventory entry not found.");
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

    return nextEntry;
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

  return (
    <DemoStoreContext.Provider
      value={{
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
        getEntryActions
      }}
    >
      {children}
    </DemoStoreContext.Provider>
  );
}

export function useDemoStore() {
  const value = useContext(DemoStoreContext);

  if (!value) {
    throw new Error("Demo store is missing.");
  }

  return value;
}
