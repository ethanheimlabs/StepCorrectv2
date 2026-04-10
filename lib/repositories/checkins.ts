import { readStore, updateStore } from "@/lib/data/store";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { DailyCheckIn } from "@/lib/types";

type DailyCheckInRow = {
  id: string;
  user_id: string;
  created_at: string;
  mood: number;
  craving: number;
  halt: DailyCheckIn["halt"];
  note: string | null;
};

function fromRow(row: DailyCheckInRow): DailyCheckIn {
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    mood: row.mood,
    craving: row.craving,
    halt: row.halt,
    note: row.note
  };
}

function toRow(checkIn: DailyCheckIn): DailyCheckInRow {
  return {
    id: checkIn.id,
    user_id: checkIn.userId,
    created_at: checkIn.createdAt,
    mood: checkIn.mood,
    craving: checkIn.craving,
    halt: checkIn.halt,
    note: checkIn.note
  };
}

export async function createDailyCheckIn(checkIn: DailyCheckIn) {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const response = await supabase
      .from("daily_checkins")
      .insert(toRow(checkIn))
      .select("*")
      .single();

    if (!response.error && response.data) {
      return fromRow(response.data as DailyCheckInRow);
    }
  }

  await updateStore((store) => ({
    ...store,
    dailyCheckins: {
      ...store.dailyCheckins,
      [checkIn.id]: checkIn
    }
  }));

  return checkIn;
}

export async function getLatestDailyCheckIn(userId: string) {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const response = await supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!response.error && response.data) {
      return fromRow(response.data as DailyCheckInRow);
    }
  }

  const store = await readStore();

  return (
    Object.values(store.dailyCheckins)
      .filter((checkIn) => checkIn.userId === userId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0] ?? null
  );
}

export async function listDailyCheckIns(userId: string, limit = 30) {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const response = await supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!response.error && response.data) {
      return (response.data as DailyCheckInRow[]).map(fromRow);
    }
  }

  const store = await readStore();

  return Object.values(store.dailyCheckins)
    .filter((checkIn) => checkIn.userId === userId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, limit);
}
