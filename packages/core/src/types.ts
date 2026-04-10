export type ToneMode = "Gentle" | "Direct" | "Old-school" | "Coach-style";

export type InventoryEntryType = "resentment" | "fear" | "unknown";

export type InventoryStatus = "draft" | "in_progress" | "completed";

export type StepStatus = "not_started" | "in_progress" | "completed";

export interface AffectFlags {
  self_esteem: boolean;
  security: boolean;
  ambitions: boolean;
  personal_relations: boolean;
  sex_relations: boolean;
  pride: boolean;
  pocketbook: boolean;
}

export interface ClassificationResult {
  entry_type: InventoryEntryType;
  confidence: {
    resentment: number;
    fear: number;
    [key: string]: number;
  };
  needs_clarification: boolean;
  clarifying_question: string | null;
}

export interface ResentmentExtraction {
  type: "resentment";
  who_or_what: string;
  what_happened_facts: string;
  affects: AffectFlags;
  my_part_controlled: string;
  defects_or_patterns: string[];
  next_right_actions: string[];
  shareable_sponsor_summary: string;
}

export interface Profile {
  id: string;
  fullName: string | null;
  sobrietyDate: string | null;
  toneMode: ToneMode | null;
}

export interface InventoryEntry {
  id: string;
  createdAt: string;
  rawText: string;
  clarificationText: string | null;
  entryType: InventoryEntryType;
  confidence: ClassificationResult["confidence"];
  extractedResentment: ResentmentExtraction | null;
  shareableSummary: string | null;
  status: InventoryStatus;
}

export interface InventoryAction {
  id: string;
  entryId: string;
  actionText: string;
  completed: boolean;
  completedAt: string | null;
}

export interface DailyCheckIn {
  id: string;
  createdAt: string;
  mood: number;
  craving: number;
  halt: {
    hungry: boolean;
    angry: boolean;
    lonely: boolean;
    tired: boolean;
  };
  note: string | null;
}

export interface StepProgress {
  id: string;
  stepNumber: number;
  status: StepStatus;
  updatedAt: string;
}
