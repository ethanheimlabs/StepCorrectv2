import type {
  DailyCheckIn,
  InventoryAction,
  InventoryEntry,
  PatternSummary,
  PatternSummaryStats
} from "@/lib/types";

type BuildPatternSummaryInput = {
  entries: InventoryEntry[];
  actionsByEntryId: Record<string, InventoryAction[]>;
  checkIns: DailyCheckIn[];
  similarEntryCount: number;
};

function incrementCount(counter: Map<string, number>, key: string) {
  counter.set(key, (counter.get(key) ?? 0) + 1);
}

function topItems(counter: Map<string, number>, limit = 3) {
  return Array.from(counter.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([value]) => value);
}

function toPercent(part: number, total: number) {
  if (!total) {
    return 0;
  }

  return Number((part / total).toFixed(2));
}

function normalizeLabel(value: string) {
  return value.trim().replace(/\s+/g, " ");
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

  if (/\bfriend|roommate|neighbor\b/.test(source)) {
    buckets.add("friend");
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

  if (/\bmeeting|recovery\b/.test(normalized)) {
    return "get near recovery";
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
  const candidates = checkIns
    .map((checkIn) => ({
      checkIn,
      distance: new Date(checkIn.createdAt).getTime() - targetTime
    }))
    .filter(({ distance }) =>
      options.after ? distance >= 0 && distance <= maxDistance : distance <= 0 && Math.abs(distance) <= maxDistance
    )
    .sort((left, right) => Math.abs(left.distance) - Math.abs(right.distance));

  return candidates[0]?.checkIn ?? null;
}

function summarizeActionOutcomes(
  entries: InventoryEntry[],
  actionsByEntryId: Record<string, InventoryAction[]>,
  checkIns: DailyCheckIn[]
) {
  const helpfulCounts = new Map<string, { improved: number; total: number }>();
  const incompleteCounts = new Map<string, number>();
  let totalActions = 0;
  let completedActions = 0;
  let sameDayCompletedActions = 0;
  let sameDayImprovedActions = 0;

  for (const entry of entries) {
    const actions = actionsByEntryId[entry.id] ?? [];

    for (const action of actions) {
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
      const completedSameDay =
        action.completedAt.slice(0, 10) === entry.createdAt.slice(0, 10);

      if (completedSameDay) {
        sameDayCompletedActions += 1;

        if (improved) {
          sameDayImprovedActions += 1;
        }
      }

      helpfulCounts.set(category, {
        improved: current.improved + (improved ? 1 : 0),
        total: current.total + 1
      });
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
    .filter(([, value]) => value.total >= 1 && value.improved > 0)
    .sort((left, right) => {
      const leftScore = left[1].improved / left[1].total;
      const rightScore = right[1].improved / right[1].total;
      return rightScore - leftScore || right[1].improved - left[1].improved;
    })
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
  const topWeekday = topItems(weekdayCounts, 1)[0];
  const topTime = topItems(timeCounts, 1)[0];

  if (topWeekday && (weekdayCounts.get(topWeekday) ?? 0) >= 2) {
    notes.push(`${topWeekday} is where this seems to come up most.`);
  }

  if (topTime && (timeCounts.get(topTime) ?? 0) >= 2) {
    notes.push(`${topTime.charAt(0).toUpperCase() + topTime.slice(1)} is when it tends to show up.`);
  }

  return {
    notes,
    topDay: topWeekday ?? null,
    topTime: topTime ?? null
  };
}

function summarizeInventoryFollowThrough(entries: InventoryEntry[], checkIns: DailyCheckIn[]) {
  let observed = 0;
  let improved = 0;

  for (const entry of entries) {
    const entryTime = new Date(entry.createdAt).getTime();
    const before = findNearestCheckIn(checkIns, entryTime, {
      after: false,
      withinHours: 36
    });
    const after = findNearestCheckIn(checkIns, entryTime, {
      after: true,
      withinHours: 48
    });

    if (!before || !after) {
      continue;
    }

    observed += 1;

    if (after.craving < before.craving || after.mood > before.mood) {
      improved += 1;
    }
  }

  if (observed >= 2 && improved / observed >= 0.5) {
    return "Writing it out often shows up with steadier next-day check-ins.";
  }

  return null;
}

function emptyPatternStats(): PatternSummaryStats {
  return {
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
  };
}

export function buildPatternSummary({
  entries,
  actionsByEntryId,
  checkIns,
  similarEntryCount
}: BuildPatternSummaryInput): PatternSummary {
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
      stats: emptyPatternStats()
    };
  }

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

  const actionOutcomeSummary = summarizeActionOutcomes(
    resentmentEntries,
    actionsByEntryId,
    checkIns
  );
  const recurrence = summarizeRecurrenceWindows(resentmentEntries);
  const inventoryFollowThroughNote = summarizeInventoryFollowThrough(
    resentmentEntries,
    checkIns
  );

  return {
    total_entries: resentmentEntries.length,
    recurring_people_or_topics: topItems(topicCounts, 4),
    top_affected_areas: topItems(affectCounts, 3),
    top_patterns: topItems(patternCounts, 3),
    similar_entry_count: similarEntryCount,
    actions_that_help: actionOutcomeSummary.actionsThatHelp,
    trend_notes: [
      ...actionOutcomeSummary.trendNotes,
      ...(inventoryFollowThroughNote ? [inventoryFollowThroughNote] : []),
      ...recurrence.notes
    ].slice(0, 4),
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
