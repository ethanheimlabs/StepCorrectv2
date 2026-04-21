import { DEFAULT_TONE_MODE } from "@/lib/constants";
import { readStore, updateStore } from "@/lib/data/store";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

type ProfileRow = {
  id: string;
  created_at: string;
  full_name: string | null;
  sobriety_date: string | null;
  tone_mode: string | null;
};

function fromRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    createdAt: row.created_at,
    fullName: row.full_name,
    sobrietyDate: row.sobriety_date,
    toneMode: (row.tone_mode as Profile["toneMode"]) ?? DEFAULT_TONE_MODE
  };
}

function toRow(profile: Profile): ProfileRow {
  return {
    id: profile.id,
    created_at: profile.createdAt,
    full_name: profile.fullName,
    sobriety_date: profile.sobrietyDate,
    tone_mode: profile.toneMode
  };
}

export async function getProfile(userId: string) {
  const supabase = createSupabaseServerClient();

  if (supabase) {
    const response = await supabase.from("profiles").select("*").eq("id", userId).single();

    if (response.error) {
      if (response.error.code === "PGRST116") {
        return null;
      }

      throw response.error;
    }

    return response.data ? fromRow(response.data as ProfileRow) : null;
  }

  const store = await readStore();
  return store.profiles[userId] ?? null;
}

export async function upsertProfile(profile: Profile) {
  const supabase = createSupabaseServerClient();

  if (supabase) {
    const response = await supabase
      .from("profiles")
      .upsert(toRow(profile))
      .select("*")
      .single();

    if (response.error) {
      throw response.error;
    }

    return response.data ? fromRow(response.data as ProfileRow) : profile;
  }

  await updateStore((store) => ({
    ...store,
    profiles: {
      ...store.profiles,
      [profile.id]: profile
    }
  }));

  return profile;
}
