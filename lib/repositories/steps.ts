import { STEP_COPY } from "@/lib/constants";
import { readStore, updateStore } from "@/lib/data/store";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { StepProgress } from "@/lib/types";

type StepProgressRow = {
  id: string;
  user_id: string;
  step_number: number;
  status: StepProgress["status"];
  updated_at: string;
};

function fromRow(row: StepProgressRow): StepProgress {
  return {
    id: row.id,
    userId: row.user_id,
    stepNumber: row.step_number,
    status: row.status,
    updatedAt: row.updated_at
  };
}

function toRow(progress: StepProgress): StepProgressRow {
  return {
    id: progress.id,
    user_id: progress.userId,
    step_number: progress.stepNumber,
    status: progress.status,
    updated_at: progress.updatedAt
  };
}

function buildDefaultSteps(userId: string) {
  const timestamp = new Date().toISOString();

  return STEP_COPY.map((step) => ({
    id: crypto.randomUUID(),
    userId,
    stepNumber: step.stepNumber,
    status: step.stepNumber === 4 ? "in_progress" : step.stepNumber < 4 ? "completed" : "not_started",
    updatedAt: timestamp
  })) satisfies StepProgress[];
}

export async function listStepProgress(userId: string) {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const response = await supabase
      .from("step_progress")
      .select("*")
      .eq("user_id", userId)
      .order("step_number", { ascending: true });

    if (!response.error && response.data && response.data.length) {
      return (response.data as StepProgressRow[]).map(fromRow);
    }

    const defaults = buildDefaultSteps(userId);
    await supabase.from("step_progress").insert(defaults.map(toRow));
    return defaults;
  }

  const store = await readStore();
  const existing = Object.values(store.stepProgress)
    .filter((step) => step.userId === userId)
    .sort((left, right) => left.stepNumber - right.stepNumber);

  if (existing.length) {
    return existing;
  }

  const defaults = buildDefaultSteps(userId);

  await updateStore((current) => ({
    ...current,
    stepProgress: {
      ...current.stepProgress,
      ...Object.fromEntries(defaults.map((step) => [step.id, step]))
    }
  }));

  return defaults;
}
