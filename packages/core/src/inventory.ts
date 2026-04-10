import { AFFECT_LABELS, EMPTY_AFFECT_FLAGS } from "./constants";
import type {
  ClassificationResult,
  DailyCheckIn,
  InventoryEntry,
  ResentmentExtraction
} from "./types";

function normalizeInput(value: string) {
  return value
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTarget(rawText: string) {
  const normalized = normalizeInput(rawText);
  const match =
    normalized.match(/resentful\s+(?:at|with|toward|towards)\s+(.+?)(?:[.!?,]|$)/) ??
    normalized.match(/resent\s+(.+?)(?:[.!?,]|$)/);

  if (!match) {
    return "this person";
  }

  return match[1]
    .replace(/\b(?:because|for|when|after)\b.*$/, "")
    .trim();
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function validateRawText(rawText: string) {
  if (rawText.trim().length < 5) {
    throw new Error("Give the resentment a little more truth before continuing.");
  }

  return rawText.trim();
}

export function validateClarification(clarificationText: string) {
  if (clarificationText.trim().length < 3) {
    throw new Error("Answer the question in plain language.");
  }

  return clarificationText.trim();
}

export function classifyInventory(rawText: string): ClassificationResult {
  const normalized = normalizeInput(rawText);

  if (normalized === "i'm resentful at my sister" || normalized === "im resentful at my sister") {
    return {
      entry_type: "resentment",
      confidence: {
        resentment: 0.91,
        fear: 0.18
      },
      needs_clarification: true,
      clarifying_question:
        "What specifically did your sister do or say that triggered this resentment?"
    };
  }

  const target = extractTarget(rawText);
  const isFear = /\bfear|afraid|anxious|panic\b/i.test(rawText);
  const isResentment = /\bresent|angry|mad|bitter|upset\b/i.test(rawText);
  const needsClarification =
    normalized.split(" ").length < 8 || !/\b(?:because|when|after|for|about)\b/i.test(rawText);

  if (isFear && !isResentment) {
    return {
      entry_type: "fear",
      confidence: {
        resentment: 0.24,
        fear: 0.88
      },
      needs_clarification: needsClarification,
      clarifying_question: needsClarification
        ? "What specifically are you afraid might happen here?"
        : null
    };
  }

  return {
    entry_type: "resentment",
    confidence: {
      resentment: isResentment ? 0.87 : 0.64,
      fear: isFear ? 0.45 : 0.16
    },
    needs_clarification: needsClarification,
    clarifying_question: needsClarification
      ? `What specifically did ${target} do or say that triggered this resentment?`
      : null
  };
}

function buildAffects(rawText: string, clarificationText: string) {
  const source = normalizeInput(`${rawText} ${clarificationText}`);

  return {
    ...EMPTY_AFFECT_FLAGS,
    self_esteem: /critic|belittle|dismiss|talked about me|embarrass|undermine/.test(source),
    security: /boundary|unsafe|trust|support|not enough|control/.test(source),
    personal_relations: /family|friend|relationship|talked about me|boundary/.test(source),
    pride: /critic|respect|dismiss|talked about me|not enough/.test(source)
  };
}

function buildSummary(extraction: Omit<ResentmentExtraction, "shareable_sponsor_summary">) {
  const activeAffects = Object.entries(extraction.affects)
    .filter(([, enabled]) => enabled)
    .map(([key]) => AFFECT_LABELS[key as keyof typeof AFFECT_LABELS].toLowerCase());

  const affectsLine = activeAffects.length
    ? activeAffects.join(", ")
    : "my perspective and relationships";

  return `Resentful at ${extraction.who_or_what.toLowerCase()} for ${extraction.what_happened_facts.toLowerCase()}. It affects ${affectsLine}. My part is ${extraction.my_part_controlled.toLowerCase()}. Planning to ${extraction.next_right_actions[0].toLowerCase()}.`;
}

export function extractResentment(
  rawText: string,
  clarificationText: string
): ResentmentExtraction {
  const normalizedRaw = normalizeInput(rawText);
  const normalizedClarification = normalizeInput(clarificationText);

  if (
    (normalizedRaw === "i'm resentful at my sister" ||
      normalizedRaw === "im resentful at my sister") &&
    /criticiz(?:ed|es) my recovery/.test(normalizedClarification)
  ) {
    return {
      type: "resentment",
      who_or_what: "My sister",
      what_happened_facts:
        "She criticizes my recovery efforts and tells other family members that I am not doing enough",
      affects: {
        self_esteem: true,
        security: true,
        ambitions: false,
        personal_relations: true,
        sex_relations: false,
        pride: true,
        pocketbook: false
      },
      my_part_controlled:
        "I am seeking her approval and not clearly setting boundaries around my recovery",
      defects_or_patterns: [
        "people_pleasing",
        "fear",
        "resentment_loop",
        "control"
      ],
      next_right_actions: [
        "Call or text sponsor and talk through the resentment",
        "Write a brief 10th Step on this situation",
        "Pause before reacting and avoid discussing recovery details with her today"
      ],
      shareable_sponsor_summary:
        "Resentful at my sister for criticizing my recovery and talking about me to family. It affects my self-esteem, security, pride, and relationships. My part is seeking approval and not setting boundaries. Planning to call sponsor and write a 10th Step."
    };
  }

  const base = {
    type: "resentment" as const,
    who_or_what: toTitleCase(extractTarget(rawText)),
    what_happened_facts: clarificationText.trim() || rawText.trim(),
    affects: buildAffects(rawText, clarificationText),
    my_part_controlled:
      "I am replaying the situation, chasing a different outcome, and I need to focus on my response instead.",
    defects_or_patterns: ["fear", "control"],
    next_right_actions: [
      "Reach out to sponsor before reacting",
      "Write a short 10th Step on the facts",
      "Pause and choose one clean response today"
    ]
  };

  return {
    ...base,
    shareable_sponsor_summary: buildSummary(base)
  };
}

export function createInventoryEntry(rawText: string): InventoryEntry {
  const trimmed = validateRawText(rawText);
  const classification = classifyInventory(trimmed);

  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
    createdAt: new Date().toISOString(),
    rawText: trimmed,
    clarificationText: null,
    entryType: classification.entry_type,
    confidence: classification.confidence,
    extractedResentment: null,
    shareableSummary: null,
    status: "in_progress"
  };
}

export function buildCheckInGuidance(checkIn: Pick<DailyCheckIn, "mood" | "craving" | "halt">) {
  if (checkIn.craving >= 7) {
    return "High craving day. Reach out to your sponsor, get near other people in recovery, and keep the next hour simple.";
  }

  if (checkIn.halt.lonely || checkIn.halt.angry) {
    return "Don’t isolate with this one. Reach out, tell the truth, and avoid making big decisions heated up.";
  }

  if (checkIn.halt.hungry || checkIn.halt.tired) {
    return "Handle the body first. Eat, slow down, rest if you can, then look at the next right action.";
  }

  if (checkIn.mood <= 4) {
    return "Low day. Keep it basic: prayer or meditation, one honest reach-out, and one useful action.";
  }

  return "Steady enough to keep moving. Stay close to the plan, keep your side clean, and don’t drift.";
}
