export type InventoryEntryType = "resentment" | "fear" | "unknown";

export type InventoryStatus =
  | "captured"
  | "clarify"
  | "review"
  | "actions"
  | "complete";

export type AffectKey =
  | "selfEsteem"
  | "security"
  | "ambitions"
  | "personalRelations"
  | "sexRelations"
  | "pocketbook";

export type InventoryPattern =
  | "self-seeking"
  | "dishonest"
  | "frightened"
  | "inconsiderate";

export interface InventoryConfidence {
  resentment: number;
  fear: number;
  [key: string]: number;
}

export interface StructuredReview {
  resentfulAt: string;
  cause: string;
  story: string;
  affects: Record<AffectKey, boolean>;
}

export interface ActionPlan {
  myPart: string;
  patterns: InventoryPattern[];
  prayer: string;
  nextAction: string;
  amends: string;
}

export interface InventoryEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: InventoryStatus;
  rawText: string;
  entryType: InventoryEntryType;
  confidence: InventoryConfidence;
  needsClarification: boolean;
  clarifyingQuestion: string | null;
  clarifyingAnswer: string | null;
  structuredReview: StructuredReview | null;
  actionPlan: ActionPlan | null;
}

export const DEFAULT_AFFECTS: Record<AffectKey, boolean> = {
  selfEsteem: false,
  security: false,
  ambitions: false,
  personalRelations: false,
  sexRelations: false,
  pocketbook: false
};

export const AFFECT_LABELS: Record<AffectKey, string> = {
  selfEsteem: "Self-esteem",
  security: "Security",
  ambitions: "Ambitions",
  personalRelations: "Personal relations",
  sexRelations: "Sex relations",
  pocketbook: "Pocketbook"
};

export const PATTERN_OPTIONS: InventoryPattern[] = [
  "self-seeking",
  "dishonest",
  "frightened",
  "inconsiderate"
];
