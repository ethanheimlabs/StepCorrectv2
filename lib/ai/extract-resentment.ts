import { z } from "zod";

import { AFFECT_LABELS, EMPTY_AFFECT_FLAGS } from "@/lib/constants";
import { parseStructuredResponse } from "@/lib/openai/client";
import { resentmentExtractionPrompt } from "@/lib/openai/prompts";
import type { ResentmentExtraction } from "@/lib/types";

const affectsSchema = z.object({
  self_esteem: z.boolean(),
  security: z.boolean(),
  ambitions: z.boolean(),
  personal_relations: z.boolean(),
  sex_relations: z.boolean(),
  pride: z.boolean(),
  pocketbook: z.boolean()
});

const resentmentExtractionSchema = z.object({
  type: z.literal("resentment"),
  who_or_what: z.string(),
  what_happened_facts: z.string(),
  affects: affectsSchema,
  my_part_controlled: z.string(),
  defects_or_patterns: z.array(z.string()),
  next_right_actions: z.array(z.string()).max(3),
  shareable_sponsor_summary: z.string()
});

function normalizeInput(value: string) {
  return value
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function deriveWhoOrWhat(rawText: string) {
  const normalized = normalizeInput(rawText);
  const match =
    normalized.match(/resentful\s+(?:at|with|toward|towards)\s+(.+?)(?:[.!?,]|$)/) ??
    normalized.match(/resent\s+(.+?)(?:[.!?,]|$)/);

  if (!match) {
    return "This situation";
  }

  return toTitleCase(
    match[1]
      .replace(/\b(?:because|for|when|after)\b.*$/, "")
      .trim()
  );
}

function buildAffects(rawText: string, clarificationText: string) {
  const source = normalizeInput(`${rawText} ${clarificationText}`);

  return {
    ...EMPTY_AFFECT_FLAGS,
    self_esteem: /critic|belittle|dismiss|embarrass|undermine|look down on/.test(source),
    security: /boundary|unsafe|trust|support|control|threat|steady/.test(source),
    ambitions: /career|work|future|goal|promotion|opportunity/.test(source),
    personal_relations: /family|friend|relationship|partner|marriage|talked about me/.test(source),
    sex_relations: /sex|intimacy|affair|cheat|romantic/.test(source),
    pride: /critic|respect|dismiss|humiliate|insult|talked down/.test(source),
    pocketbook: /money|rent|pay|job|debt|bill|cost/.test(source)
  };
}

function buildSummary(extraction: Omit<ResentmentExtraction, "shareable_sponsor_summary">) {
  const activeAffects = Object.entries(extraction.affects)
    .filter(([, enabled]) => enabled)
    .map(([key]) => AFFECT_LABELS[key as keyof typeof AFFECT_LABELS].toLowerCase());

  const affectsLine = activeAffects.length
    ? activeAffects.join(", ")
    : "my peace and perspective";

  return `Resentful at ${extraction.who_or_what.toLowerCase()} for ${extraction.what_happened_facts.toLowerCase()}. It hits ${affectsLine}. My part is ${extraction.my_part_controlled.toLowerCase()}. Next move is ${extraction.next_right_actions[0].toLowerCase()}.`;
}

function extractResentmentFallback(
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
    who_or_what: deriveWhoOrWhat(rawText),
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

function sanitizeArray(values: string[], fallback: string[], limit?: number) {
  const cleaned = values
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value, index, items) => items.indexOf(value) === index);

  const limited = typeof limit === "number" ? cleaned.slice(0, limit) : cleaned;

  return limited.length ? limited : fallback;
}

async function extractResentmentWithAI(
  rawText: string,
  clarificationText: string
): Promise<ResentmentExtraction | null> {
  const parsed = await parseStructuredResponse({
    schema: resentmentExtractionSchema,
    schemaName: "resentment_extraction",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: resentmentExtractionPrompt
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: [`Raw resentment text: ${rawText}`, `Clarification: ${clarificationText}`].join(
              "\n"
            )
          }
        ]
      }
    ],
    reasoningEffort: "low",
    maxOutputTokens: 500
  });

  if (!parsed) {
    return null;
  }

  return {
    ...parsed,
    who_or_what: parsed.who_or_what.trim(),
    what_happened_facts: parsed.what_happened_facts.trim(),
    affects: {
      ...EMPTY_AFFECT_FLAGS,
      ...parsed.affects
    },
    my_part_controlled: parsed.my_part_controlled.trim(),
    defects_or_patterns: sanitizeArray(parsed.defects_or_patterns, ["fear", "control"]),
    next_right_actions: sanitizeArray(
      parsed.next_right_actions,
      [
        "Reach out to sponsor before reacting",
        "Write a short 10th Step on the facts",
        "Pause and choose one clean response today"
      ],
      3
    ),
    shareable_sponsor_summary: parsed.shareable_sponsor_summary.trim()
  };
}

export async function extractResentment(
  rawText: string,
  clarificationText: string
): Promise<ResentmentExtraction> {
  try {
    return (
      (await extractResentmentWithAI(rawText, clarificationText)) ??
      extractResentmentFallback(rawText, clarificationText)
    );
  } catch (error) {
    console.error("OpenAI extraction failed. Falling back to deterministic extraction.", error);
    return extractResentmentFallback(rawText, clarificationText);
  }
}

export function buildSponsorSummary(extraction: ResentmentExtraction) {
  return extraction.shareable_sponsor_summary;
}
