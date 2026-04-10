import { EMPTY_AFFECT_FLAGS } from "@/lib/constants";
import type { DailyCheckIn, ResentmentExtraction } from "@/lib/types";

export function validateRawText(rawText: unknown) {
  if (typeof rawText !== "string" || rawText.trim().length < 5) {
    throw new Error("Give the resentment a little more truth before continuing.");
  }

  return rawText.trim();
}

export function validateClarification(clarificationText: unknown) {
  if (typeof clarificationText !== "string" || clarificationText.trim().length < 3) {
    throw new Error("Answer the question in plain language.");
  }

  return clarificationText.trim();
}

export function validateResentmentExtraction(payload: unknown): ResentmentExtraction {
  if (!payload || typeof payload !== "object") {
    throw new Error("Inventory details are missing.");
  }

  const extraction = payload as Partial<ResentmentExtraction>;

  if (!extraction.who_or_what?.trim()) {
    throw new Error("Name who or what this resentment is about.");
  }

  if (!extraction.what_happened_facts?.trim()) {
    throw new Error("Stick to the facts of what happened.");
  }

  if (!extraction.my_part_controlled?.trim()) {
    throw new Error("Write your part as what you can own or control.");
  }

  const nextRightActions = Array.isArray(extraction.next_right_actions)
    ? extraction.next_right_actions.map((item) => item.trim()).filter(Boolean)
    : [];

  if (!nextRightActions.length) {
    throw new Error("Add at least one next right action.");
  }

  if (nextRightActions.length > 3) {
    throw new Error("Keep it to three next right actions or fewer.");
  }

  return {
    type: "resentment",
    who_or_what: extraction.who_or_what.trim(),
    what_happened_facts: extraction.what_happened_facts.trim(),
    affects: {
      ...EMPTY_AFFECT_FLAGS,
      ...(extraction.affects ?? {})
    },
    my_part_controlled: extraction.my_part_controlled.trim(),
    defects_or_patterns: Array.isArray(extraction.defects_or_patterns)
      ? extraction.defects_or_patterns.map((item) => item.trim()).filter(Boolean)
      : [],
    next_right_actions: nextRightActions.slice(0, 3),
    shareable_sponsor_summary: extraction.shareable_sponsor_summary?.trim() ?? ""
  };
}

export function validateCheckIn(payload: unknown): Omit<DailyCheckIn, "id" | "userId" | "createdAt"> {
  if (!payload || typeof payload !== "object") {
    throw new Error("Check-in details are missing.");
  }

  const checkIn = payload as Partial<DailyCheckIn>;
  const mood = Number(checkIn.mood);
  const craving = Number(checkIn.craving);

  if (!Number.isInteger(mood) || mood < 1 || mood > 10) {
    throw new Error("Mood has to stay between 1 and 10.");
  }

  if (!Number.isInteger(craving) || craving < 1 || craving > 10) {
    throw new Error("Craving has to stay between 1 and 10.");
  }

  return {
    mood,
    craving,
    halt: {
      hungry: Boolean(checkIn.halt?.hungry),
      angry: Boolean(checkIn.halt?.angry),
      lonely: Boolean(checkIn.halt?.lonely),
      tired: Boolean(checkIn.halt?.tired)
    },
    note: typeof checkIn.note === "string" && checkIn.note.trim() ? checkIn.note.trim() : null
  };
}

export function validateProfilePayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Profile details are missing.");
  }

  const profile = payload as {
    fullName?: unknown;
    sobrietyDate?: unknown;
    toneMode?: unknown;
  };

  return {
    fullName:
      typeof profile.fullName === "string" && profile.fullName.trim()
        ? profile.fullName.trim()
        : null,
    sobrietyDate:
      typeof profile.sobrietyDate === "string" && profile.sobrietyDate.trim()
        ? profile.sobrietyDate.trim()
        : null,
    toneMode:
      typeof profile.toneMode === "string" && profile.toneMode.trim()
        ? profile.toneMode.trim()
        : null
  };
}
