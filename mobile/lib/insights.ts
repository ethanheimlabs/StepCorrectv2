import type {
  DailyCheckIn,
  InventoryAction,
  InventoryEntry
} from "@stepcorrect/core";

import type {
  FeedbackCardSet,
  PatternSummary,
  WeeklyReflectionSnapshot
} from "@/lib/mobile-types";

function incrementCount(counter: Map<string, number>, key: string) {
  counter.set(key, (counter.get(key) ?? 0) + 1);
}

function topItems(counter: Map<string, number>, limit = 3) {
  return Array.from(counter.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([value]) => value);
}

function normalizeLabel(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function toPercent(part: number, total: number) {
  if (!total) {
    return 0;
  }

  return Number((part / total).toFixed(2));
}

function subjectBucketsForEntry(entry: InventoryEntry) {
  const source = `${entry.rawText} ${entry.clarificationText ?? ""} ${
    entry.extractedResentment?.who_or_what ?? ""
  }`.toLowerCase();
  const buckets = new Set<string>();

  if (/\bsister|brother|mom|mother|dad|father|family|parent\b/.test(source)) {
    buckets.add("family");
  }

  if (/\bpartner|wife|husband|girlfriend|boyfriend|marriage|relationship\b/.test(source)) {
    buckets.add("partner");
  }

  if (/\bboss|job|work|coworker|manager|office|career\b/.test(source)) {
    buckets.add("work");
  }

  if (/\bmoney|rent|bill|debt|pay\b/.test(source)) {
    buckets.add("money");
  }

  return Array.from(buckets);
}

function actionCategory(actionText: string) {
  const normalized = actionText.toLowerCase();

  if (/\bsponsor|call|text\b/.test(normalized)) {
    return "sponsor outreach";
  }

  if (/\bwrite|10th step|inventory\b/.test(normalized)) {
    return "write it out";
  }

  if (/\bpause|wait|slow\b/.test(normalized)) {
    return "pause before reacting";
  }

  if (/\bboundar/.test(normalized)) {
    return "set a boundary";
  }

  return normalizeLabel(actionText);
}

function findNearestCheckIn(
  checkIns: DailyCheckIn[],
  targetTime: number,
  options: {
    after?: boolean;
    withinHours: number;
  }
) {
  const maxDistance = options.withinHours * 60 * 60 * 1000;

  return checkIns
    .map((checkIn) => ({
      checkIn,
      distance: new Date(checkIn.createdAt).getTime() - targetTime
    }))
    .filter(({ distance }) =>
      options.after ? distance >= 0 && distance <= maxDistance : distance <= 0 && Math.abs(distance) <= maxDistance
    )
    .sort((left, right) => Math.abs(left.distance) - Math.abs(right.distance))[0]?.checkIn ?? null;
}

function calculateSimilarEntryCount(
  entries: InventoryEntry[],
  focusEntry: InventoryEntry | null
) {
  if (!focusEntry?.extractedResentment) {
    return 0;
  }

  const focusPatterns = new Set(focusEntry.extractedResentment.defects_or_patterns);

  return entries.filter((entry) => {
    if (entry.id === focusEntry.id || !entry.extractedResentment) {
      return false;
    }

    if (entry.extractedResentment.who_or_what === focusEntry.extractedResentment?.who_or_what) {
      return true;
    }

    return entry.extractedResentment.defects_or_patterns.some((pattern) =>
      focusPatterns.has(pattern)
    );
  }).length;
}

function summarizeActionOutcomes(
  entries: InventoryEntry[],
  actions: InventoryAction[],
  checkIns: DailyCheckIn[]
) {
  const helpfulCounts = new Map<string, { improved: number; total: number }>();
  const incompleteCounts = new Map<string, number>();
  let totalActions = 0;
  let completedActions = 0;
  let sameDayCompletedActions = 0;
  let sameDayImprovedActions = 0;

  for (const entry of entries) {
    const entryActions = actions.filter((action) => action.entryId === entry.id);

    for (const action of entryActions) {
      totalActions += 1;
      const category = actionCategory(action.actionText);

      if (!action.completed || !action.completedAt) {
        incrementCount(incompleteCounts, category);
        continue;
      }

      completedActions += 1;

      const completedTime = new Date(action.completedAt).getTime();
      const before = findNearestCheckIn(checkIns, completedTime, {
        after: false,
        withinHours: 36
      });
      const after = findNearestCheckIn(checkIns, completedTime, {
        after: true,
        withinHours: 48
      });

      if (!before || !after) {
        continue;
      }

      const improved = after.mood > before.mood || after.craving < before.craving;
      const current = helpfulCounts.get(category) ?? {
        improved: 0,
        total: 0
      };

      helpfulCounts.set(category, {
        improved: current.improved + (improved ? 1 : 0),
        total: current.total + 1
      });

      if (action.completedAt.slice(0, 10) === entry.createdAt.slice(0, 10)) {
        sameDayCompletedActions += 1;

        if (improved) {
          sameDayImprovedActions += 1;
        }
      }
    }
  }

  const actionsThatHelp = Array.from(helpfulCounts.entries())
    .filter(([, value]) => value.improved > 0 && value.improved / value.total >= 0.5)
    .sort((left, right) => {
      const leftScore = left[1].improved / left[1].total;
      const rightScore = right[1].improved / right[1].total;
      return rightScore - leftScore || right[1].improved - left[1].improved;
    })
    .slice(0, 3)
    .map(([action]) => action);

  const helpfulActionSignals = Array.from(helpfulCounts.entries())
    .filter(([, value]) => value.improved > 0)
    .sort((left, right) => right[1].improved - left[1].improved)
    .slice(0, 3)
    .map(([action]) => action);

  const trendNotes = Array.from(helpfulCounts.entries())
    .filter(([, value]) => value.total >= 2 && value.improved > 0)
    .sort((left, right) => right[1].improved - left[1].improved)
    .slice(0, 2)
    .map(([action, value]) => `${action} often shows up with steadier next-day check-ins (${value.improved}/${value.total}).`);

  const repeatedIncomplete = topItems(incompleteCounts, 1)[0];

  if (repeatedIncomplete && (incompleteCounts.get(repeatedIncomplete) ?? 0) >= 2) {
    trendNotes.push(`${repeatedIncomplete} keeps getting left undone when this loop comes back.`);
  }

  if (sameDayCompletedActions >= 2 && sameDayImprovedActions / sameDayCompletedActions >= 0.5) {
    trendNotes.push("You tend to do better when you take one clean action the same day.");
  }

  return {
    actionsThatHelp,
    helpfulActionSignals,
    incompleteActionLoops: topItems(incompleteCounts, 3),
    trendNotes,
    totalActions,
    completedActions,
    actionCompletionRate: toPercent(completedActions, totalActions),
    sameDayActionRate: toPercent(sameDayCompletedActions, Math.max(completedActions, 1))
  };
}

function summarizeRecurrenceWindows(entries: InventoryEntry[]) {
  if (entries.length < 3) {
    return {
      notes: [],
      topDay: null,
      topTime: null
    };
  }

  const weekdayCounts = new Map<string, number>();
  const timeCounts = new Map<string, number>();

  for (const entry of entries) {
    const date = new Date(entry.createdAt);
    const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
    const hour = date.getHours();
    const timeBucket =
      hour < 6 ? "late night" : hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

    incrementCount(weekdayCounts, weekday);
    incrementCount(timeCounts, timeBucket);
  }

  const notes: string[] = [];
  const topDay = topItems(weekdayCounts, 1)[0] ?? null;
  const topTime = topItems(timeCounts, 1)[0] ?? null;

  if (topDay && (weekdayCounts.get(topDay) ?? 0) >= 2) {
    notes.push(`${topDay} is where this seems to come up most.`);
  }

  if (topTime && (timeCounts.get(topTime) ?? 0) >= 2) {
    notes.push(`${topTime.charAt(0).toUpperCase() + topTime.slice(1)} is when it tends to show up.`);
  }

  return {
    notes,
    topDay,
    topTime
  };
}

export function buildPatternSummary(
  entries: InventoryEntry[],
  actions: InventoryAction[],
  checkIns: DailyCheckIn[],
  focusEntryId?: string
): PatternSummary {
  const resentmentEntries = entries.filter((entry) => entry.extractedResentment);

  if (!resentmentEntries.length) {
    return {
      total_entries: 0,
      recurring_people_or_topics: [],
      top_affected_areas: [],
      top_patterns: [],
      similar_entry_count: 0,
      actions_that_help: [],
      trend_notes: [],
      stats: {
        total_actions: 0,
        completed_actions: 0,
        action_completion_rate: 0,
        same_day_action_rate: 0,
        helpful_action_signals: [],
        incomplete_action_loops: [],
        top_trigger_subjects: [],
        top_repeated_people: [],
        top_day_of_week: null,
        top_time_of_day: null
      }
    };
  }

  const focusEntry =
    resentmentEntries.find((entry) => entry.id === focusEntryId) ?? resentmentEntries[0] ?? null;
  const topicCounts = new Map<string, number>();
  const subjectCounts = new Map<string, number>();
  const personCounts = new Map<string, number>();
  const affectCounts = new Map<string, number>();
  const patternCounts = new Map<string, number>();

  for (const entry of resentmentEntries) {
    const whoOrWhat = normalizeLabel(entry.extractedResentment?.who_or_what ?? "");

    if (whoOrWhat) {
      incrementCount(topicCounts, whoOrWhat);
      incrementCount(personCounts, whoOrWhat);
    }

    for (const bucket of subjectBucketsForEntry(entry)) {
      incrementCount(topicCounts, bucket);
      incrementCount(subjectCounts, bucket);
    }

    for (const [key, enabled] of Object.entries(entry.extractedResentment?.affects ?? {})) {
      if (enabled) {
        incrementCount(affectCounts, key.replace(/_/g, " "));
      }
    }

    for (const pattern of entry.extractedResentment?.defects_or_patterns ?? []) {
      incrementCount(patternCounts, pattern.replace(/_/g, " "));
    }
  }

  const actionOutcomeSummary = summarizeActionOutcomes(resentmentEntries, actions, checkIns);
  const recurrence = summarizeRecurrenceWindows(resentmentEntries);

  return {
    total_entries: resentmentEntries.length,
    recurring_people_or_topics: topItems(topicCounts, 4),
    top_affected_areas: topItems(affectCounts, 3),
    top_patterns: topItems(patternCounts, 3),
    similar_entry_count: calculateSimilarEntryCount(resentmentEntries, focusEntry),
    actions_that_help: actionOutcomeSummary.actionsThatHelp,
    trend_notes: [...actionOutcomeSummary.trendNotes, ...recurrence.notes].slice(0, 4),
    stats: {
      total_actions: actionOutcomeSummary.totalActions,
      completed_actions: actionOutcomeSummary.completedActions,
      action_completion_rate: actionOutcomeSummary.actionCompletionRate,
      same_day_action_rate: actionOutcomeSummary.sameDayActionRate,
      helpful_action_signals: actionOutcomeSummary.helpfulActionSignals,
      incomplete_action_loops: actionOutcomeSummary.incompleteActionLoops,
      top_trigger_subjects: topItems(subjectCounts, 3),
      top_repeated_people: topItems(personCounts, 3),
      top_day_of_week: recurrence.topDay,
      top_time_of_day: recurrence.topTime
    }
  };
}

export function generateFeedbackCards(summary: PatternSummary): FeedbackCardSet {
  if (!summary.total_entries) {
    return {
      pattern_card: "No clear pattern yet. Keep writing the facts and the picture will tighten up.",
      impact_card: "Not enough inventory is in yet to say what gets hit most.",
      behavior_card: "The app is still learning your repeat moves from what you log here.",
      next_right_action_card: "Today's move: write one honest inventory and take one clean action."
    };
  }

  const topTopic = summary.recurring_people_or_topics[0] ?? "This situation";
  const topImpact = summary.top_affected_areas[0] ?? "your peace";
  const topPattern = summary.top_patterns[0] ?? "pressure and reaction";
  const nextAction =
    summary.actions_that_help[0] ?? "write the facts, don't react, and reach out today";

  return {
    pattern_card:
      summary.similar_entry_count > 0
        ? `${topTopic} keeps showing up. You've been in this kind of spot before.`
        : `${topTopic} is starting to stand out.`,
    impact_card: `${topImpact} tends to get hit first when this comes up.`,
    behavior_card:
      summary.trend_notes[0] ??
      `${topPattern.replace(/_/g, " ")} keeps showing up in the middle of it.`,
    next_right_action_card: `Today's move: ${nextAction.replace(/\.$/, "")}.`
  };
}

export function generateWeeklyReflection(summary: PatternSummary) {
  if (!summary.total_entries) {
    return "Not enough written this week yet to call a pattern. Keep the facts short, honest, and current.";
  }

  const topTopic = summary.recurring_people_or_topics[0] ?? "this pattern";
  const topImpact = summary.top_affected_areas[0] ?? "your peace";
  const action = summary.actions_that_help[0] ?? "same-day honest action";
  const trend = summary.trend_notes[0] ?? `${summary.top_patterns[0] ?? "old reaction"} keeps showing up`;

  return `${topTopic} kept coming back this week, and it usually landed on ${topImpact.toLowerCase()}. ${trend.charAt(0).toUpperCase() + trend.slice(1)}. ${action.charAt(0).toUpperCase() + action.slice(1)} seems to help when you do it sooner.`;
}

export function buildPatternInsights(
  entries: InventoryEntry[],
  actions: InventoryAction[],
  checkIns: DailyCheckIn[],
  focusEntryId?: string
) {
  const summary = buildPatternSummary(entries, actions, checkIns, focusEntryId);

  return {
    summary,
    cards: generateFeedbackCards(summary)
  };
}

export function buildWeeklyReflection(
  entries: InventoryEntry[],
  actions: InventoryAction[],
  checkIns: DailyCheckIn[]
): WeeklyReflectionSnapshot {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  const weeklyEntries = entries.filter((entry) => new Date(entry.createdAt) >= cutoff);
  const summary = buildPatternSummary(weeklyEntries, actions, checkIns);

  return {
    summary,
    reflection: generateWeeklyReflection(summary)
  };
}
