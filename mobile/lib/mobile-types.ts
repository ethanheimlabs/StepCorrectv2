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

export interface WeeklyReflectionSnapshot {
  summary: PatternSummary;
  reflection: string;
}

export interface SafetyAssessment {
  isSafetyCase: boolean;
  supportMessage: string | null;
  tags: string[];
}
