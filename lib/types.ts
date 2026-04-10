export type ToneMode = "Gentle" | "Direct" | "Old-school" | "Coach-style";

export type InventoryEntryType = "resentment" | "fear" | "both" | "unknown";

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
  clarifying_question: string;
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
  createdAt: string;
  fullName: string | null;
  sobrietyDate: string | null;
  toneMode: ToneMode | null;
}

export interface InventoryEntry {
  id: string;
  userId: string;
  createdAt: string;
  rawText: string;
  clarificationText: string | null;
  entryType: InventoryEntryType;
  confidence: ClassificationResult["confidence"];
  extractedResentment: ResentmentExtraction | null;
  extractedFear: Record<string, unknown> | null;
  shareableSummary: string | null;
  status: InventoryStatus;
  deletedAt: string | null;
}

export interface InventoryAction {
  id: string;
  entryId: string;
  userId: string;
  actionText: string;
  completed: boolean;
  completedAt: string | null;
}

export interface InventoryEntryEmbedding {
  id: string;
  entryId: string;
  userId: string;
  createdAt: string;
  sourceText: string;
  embedding: number[];
  model: string;
  dimensions: number;
}

export interface PatternSummaryStats {
  total_actions: number;
  completed_actions: number;
  action_completion_rate: number;
  same_day_action_rate: number;
  helpful_action_signals: string[];
  incomplete_action_loops: string[];
  top_trigger_subjects: string[];
  top_repeated_people: string[];
  top_day_of_week: string | null;
  top_time_of_day: string | null;
}

export interface PatternSummary {
  total_entries: number;
  recurring_people_or_topics: string[];
  top_affected_areas: string[];
  top_patterns: string[];
  similar_entry_count: number;
  actions_that_help: string[];
  trend_notes: string[];
  stats: PatternSummaryStats;
}

export interface FeedbackCardSet {
  pattern_card: string;
  impact_card: string;
  behavior_card: string;
  next_right_action_card: string;
}

export interface PatternFeedbackRecord {
  id: string;
  userId: string;
  createdAt: string;
  timeframe: string;
  summary: Record<string, unknown>;
  feedbackText: string;
  model: string;
}

export interface SafetyAssessment {
  isSafetyCase: boolean;
  supportMessage: string | null;
  tags: string[];
}

export interface DailyCheckIn {
  id: string;
  userId: string;
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
  userId: string;
  stepNumber: number;
  status: StepStatus;
  updatedAt: string;
}
