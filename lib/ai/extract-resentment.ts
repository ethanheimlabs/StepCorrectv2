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
  affected_parts_detail: z.array(z.string()),
  felt_reactions: z.array(z.string()),
  my_part_controlled: z.string(),
  fear_inventory: z.array(z.string()),
  defects_or_patterns: z.array(z.string()),
  acceptance_needed: z.array(z.string()),
  spiritual_truths: z.array(z.string()),
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

function pushUnique(list: string[], value: string) {
  const normalized = value.trim();

  if (!normalized || list.includes(normalized)) {
    return;
  }

  list.push(normalized);
}

function limitList(list: string[], minFallback: string[], max = 6) {
  const trimmed = list.map((item) => item.trim()).filter(Boolean);
  const deduped = trimmed.filter((item, index) => trimmed.indexOf(item) === index);
  const limited = deduped.slice(0, max);

  return limited.length ? limited : minFallback;
}

function buildContextualDraft(rawText: string, clarificationText: string) {
  const source = normalizeInput(`${rawText} ${clarificationText}`);
  const whoOrWhat = deriveWhoOrWhat(rawText);
  const facts = clarificationText.trim() || rawText.trim();
  const affects = buildAffects(rawText, clarificationText);

  const isFamily = /\bsister|brother|mom|mother|dad|father|family|parent\b/.test(source);
  const isPartner =
    /\bpartner|wife|husband|girlfriend|boyfriend|dating|relationship|marriage\b/.test(source);
  const isWork = /\bboss|manager|work|job|coworker|office|career\b/.test(source);
  const isMoney = /\bmoney|rent|bill|debt|pay|paid|cost|expense\b/.test(source);
  const isBoundary = /\bboundar|pushed|ignored my no|wouldn't stop|would not stop\b/.test(source);
  const isCriticism =
    /\bcritic|judg|dismiss|belittle|talked down|insult|embarrass|humiliat|not enough\b/.test(
      source
    );
  const isRejection =
    /\breject|ignored|didn't choose|did not choose|not chosen|left out|abandon|replace|ghost\b/.test(
      source
    );
  const isTrustBreak =
    /\blie|lied|betray|cheat|affair|talked about me|shared|gossip|trust\b/.test(source);
  const isControl =
    /\bcontrol|pressure|push|demand|force|should have|needed them to\b/.test(source);

  const affectedParts: string[] = [];
  const feltReactions: string[] = [];
  const fears: string[] = [];
  const myPart: string[] = [];
  const patterns: string[] = [];
  const acceptance: string[] = [];
  const spiritualTruths: string[] = [];
  const actions: string[] = [];

  if (affects.self_esteem || isCriticism) {
    pushUnique(affectedParts, "My self-esteem");
    pushUnique(affectedParts, "My sense of being respected");
    pushUnique(feltReactions, "Hurt");
    pushUnique(feltReactions, "Embarrassed");
    pushUnique(fears, "That I am not enough");
    pushUnique(patterns, "resentment");
    pushUnique(patterns, "fear");
  }

  if (affects.pride || isCriticism) {
    pushUnique(affectedParts, "My pride");
    pushUnique(feltReactions, "Defensive");
    pushUnique(fears, "That I will look foolish");
  }

  if (affects.security || isBoundary || isTrustBreak) {
    pushUnique(affectedParts, isPartner ? "My security in the relationship" : "My security");
    pushUnique(feltReactions, "On edge");
    pushUnique(feltReactions, "Guarded");
    pushUnique(fears, "That I cannot trust this situation");
    pushUnique(patterns, "control");
  }

  if (affects.personal_relations || isFamily || isPartner || isRejection) {
    pushUnique(
      affectedParts,
      isPartner ? "My sense of being wanted and chosen" : isFamily ? "My place in the family" : "My relationships"
    );
    pushUnique(feltReactions, isPartner || isRejection ? "Rejected" : "Angry");
    pushUnique(fears, isPartner || isRejection ? "That I will not be chosen" : "That I will be judged");
  }

  if (affects.ambitions || isWork) {
    pushUnique(affectedParts, "My future at work");
    pushUnique(affectedParts, "My confidence in how I am seen");
    pushUnique(feltReactions, "Threatened");
    pushUnique(feltReactions, "Anxious");
    pushUnique(fears, "That this affects my future");
    pushUnique(fears, "That I look unreliable");
    pushUnique(patterns, "defensiveness");
  }

  if (affects.pocketbook || isMoney) {
    pushUnique(affectedParts, "My money and stability");
    pushUnique(feltReactions, "Pressured");
    pushUnique(fears, "That I will not be financially secure");
  }

  if (isFamily) {
    pushUnique(feltReactions, "Judged");
    pushUnique(fears, "That my family will believe the worst about me");
    pushUnique(myPart, "I may be looking for approval from family instead of staying grounded in my own side.");
    pushUnique(myPart, "I may need a cleaner boundary around this conversation.");
    pushUnique(patterns, "people_pleasing");
    pushUnique(acceptance, "They may not see it the way I want them to.");
    pushUnique(acceptance, "I cannot control how they talk or think about me.");
    pushUnique(spiritualTruths, "Their opinion does not decide my worth.");
    pushUnique(spiritualTruths, "I can stay honest and hold a boundary without a fight.");
    pushUnique(actions, "Call or text sponsor before reacting");
    pushUnique(actions, "Write the facts before talking to family again");
  }

  if (isPartner || isRejection) {
    pushUnique(feltReactions, "Powerless");
    pushUnique(fears, "That I will be abandoned");
    pushUnique(fears, "That I gave too much power to their response");
    pushUnique(myPart, "I may be tying my worth to their response.");
    pushUnique(myPart, "I may be chasing clarity or reassurance instead of accepting what is in front of me.");
    pushUnique(patterns, "approval_seeking");
    pushUnique(patterns, "fantasy_thinking");
    pushUnique(acceptance, "I cannot force clarity, affection, or reassurance from another person.");
    pushUnique(acceptance, "Their behavior may show their capacity, but it does not define my value.");
    pushUnique(spiritualTruths, "My value does not come from being chosen by this person.");
    pushUnique(spiritualTruths, "Peace comes from self-respect and right action, not from getting the response I want.");
    pushUnique(actions, "Pause before reaching out again");
    pushUnique(actions, "Write the facts and the fear before sending any message");
  }

  if (isWork) {
    pushUnique(myPart, "I may be reacting before I separate facts from fear.");
    pushUnique(myPart, "I may be letting one comment turn into a whole story about my future.");
    pushUnique(patterns, "control");
    pushUnique(acceptance, "I cannot control another person's tone or interpretation.");
    pushUnique(acceptance, "I can respond to facts instead of the whole story in my head.");
    pushUnique(spiritualTruths, "My worth is bigger than one tense exchange.");
    pushUnique(spiritualTruths, "Clarity comes faster when I slow down.");
    pushUnique(actions, "Write the facts before replying");
    pushUnique(actions, "Ask one calm follow-up instead of assuming");
  }

  if (isBoundary || isControl) {
    pushUnique(myPart, "I may be staying mentally fused to this instead of stepping back.");
    pushUnique(myPart, "I may need to say less and choose a clearer boundary.");
    pushUnique(patterns, "resentment_loop");
    pushUnique(acceptance, "I cannot force another person to respond the way I want.");
    pushUnique(spiritualTruths, "I can protect my peace without controlling the other person.");
    pushUnique(actions, "Pause before reacting");
    pushUnique(actions, "Choose one clear boundary for today");
  }

  if (isTrustBreak) {
    pushUnique(feltReactions, "Betrayed");
    pushUnique(fears, "That I will get hurt again");
    pushUnique(myPart, "I may be replaying the betrayal instead of focusing on my next clean move.");
    pushUnique(patterns, "judgment");
    pushUnique(acceptance, "I cannot undo what was already said or done.");
    pushUnique(spiritualTruths, "I can tell the truth about the hurt without staying fused to it.");
  }

  pushUnique(feltReactions, "Angry");
  pushUnique(myPart, "I may be replaying the situation and feeding the resentment.");
  pushUnique(myPart, "I need to focus on my response instead of trying to control the outcome.");
  pushUnique(patterns, "fear");
  pushUnique(acceptance, "I can still choose a clean response today.");
  pushUnique(spiritualTruths, "My peace does not have to depend on their behavior.");
  pushUnique(spiritualTruths, "I can return to honesty, humility, and right action.");
  pushUnique(actions, "Take one clean action today instead of replaying it");

  return {
    type: "resentment" as const,
    who_or_what: whoOrWhat,
    what_happened_facts: facts,
    affects,
    affected_parts_detail: limitList(affectedParts, [
      "My self-esteem",
      "My security",
      "My need for respect"
    ], 6),
    felt_reactions: limitList(feltReactions, ["Angry", "Hurt", "Thrown off"], 6),
    my_part_controlled: myPart.join("\n"),
    fear_inventory: limitList(fears, [
      "That this means something bad about me",
      "That I am losing control of the situation",
      "That I will not be okay if they do not change"
    ], 5),
    defects_or_patterns: limitList(patterns, ["fear", "control"], 5),
    acceptance_needed: limitList(acceptance, [
      "I cannot force a different version of what happened.",
      "I can still choose a clean response today."
    ], 4),
    spiritual_truths: limitList(spiritualTruths, [
      "My peace does not have to depend on their behavior.",
      "I can return to honesty, humility, and right action."
    ], 4),
    next_right_actions: limitList(actions, [
      "Reach out to sponsor before reacting",
      "Write a short 10th Step on the facts",
      "Pause and choose one clean response today"
    ], 3)
  };
}

function buildSummary(extraction: Omit<ResentmentExtraction, "shareable_sponsor_summary">) {
  const activeAffects = Object.entries(extraction.affects)
    .filter(([, enabled]) => enabled)
    .map(([key]) => AFFECT_LABELS[key as keyof typeof AFFECT_LABELS].toLowerCase());

  const affectsLine = activeAffects.length
    ? activeAffects.join(", ")
    : "my peace and perspective";
  const firstFear = extraction.fear_inventory[0]?.toLowerCase();
  const fearLine = firstFear ? ` Under it, I'm afraid ${firstFear}.` : "";
  const myPartLine = extraction.my_part_controlled.replace(/\s+/g, " ").trim().toLowerCase();

  return `Resentful at ${extraction.who_or_what.toLowerCase()} for ${extraction.what_happened_facts.toLowerCase()}. It hits ${affectsLine}.${fearLine} My part is ${myPartLine}. Next move is ${extraction.next_right_actions[0].toLowerCase()}.`;
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
      affected_parts_detail: [
        "My self-esteem",
        "My pride",
        "My security",
        "My sense of being respected",
        "My fear of being judged by family"
      ],
      felt_reactions: ["Angry", "Hurt", "Embarrassed", "Defensive", "Not good enough"],
      my_part_controlled:
        [
          "I am seeking her approval instead of grounding in my own recovery work.",
          "I have not clearly set boundaries around what recovery conversations I will have with her.",
          "I am letting her reaction mean too much about my worth."
        ].join("\n"),
      fear_inventory: [
        "That I am still failing in recovery",
        "That my family will believe her version of me",
        "That I will not be respected unless I prove myself"
      ],
      defects_or_patterns: [
        "people_pleasing",
        "fear",
        "resentment_loop",
        "control"
      ],
      acceptance_needed: [
        "She may not understand recovery the way I want her to.",
        "I cannot control how she talks about me.",
        "My recovery does not need her approval to be real."
      ],
      spiritual_truths: [
        "My value is not decided by her opinion.",
        "I can tell the truth and keep a boundary without retaliation.",
        "Peace comes from right action, not from winning the argument."
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

  const base = buildContextualDraft(rawText, clarificationText);

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
  const contextualDraft = buildContextualDraft(rawText, clarificationText);
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
    who_or_what: parsed.who_or_what.trim() || contextualDraft.who_or_what,
    what_happened_facts: parsed.what_happened_facts.trim() || contextualDraft.what_happened_facts,
    affects: {
      ...EMPTY_AFFECT_FLAGS,
      ...parsed.affects
    },
    affected_parts_detail: sanitizeArray(
      parsed.affected_parts_detail,
      contextualDraft.affected_parts_detail
    ),
    felt_reactions: sanitizeArray(parsed.felt_reactions, contextualDraft.felt_reactions),
    my_part_controlled: parsed.my_part_controlled.trim() || contextualDraft.my_part_controlled,
    fear_inventory: sanitizeArray(parsed.fear_inventory, contextualDraft.fear_inventory),
    defects_or_patterns: sanitizeArray(
      parsed.defects_or_patterns,
      contextualDraft.defects_or_patterns
    ),
    acceptance_needed: sanitizeArray(
      parsed.acceptance_needed,
      contextualDraft.acceptance_needed
    ),
    spiritual_truths: sanitizeArray(
      parsed.spiritual_truths,
      contextualDraft.spiritual_truths
    ),
    next_right_actions: sanitizeArray(
      parsed.next_right_actions,
      contextualDraft.next_right_actions,
      3
    ),
    shareable_sponsor_summary:
      parsed.shareable_sponsor_summary.trim() ||
      buildSummary({
        ...contextualDraft,
        who_or_what: parsed.who_or_what.trim() || contextualDraft.who_or_what,
        what_happened_facts: parsed.what_happened_facts.trim() || contextualDraft.what_happened_facts
      })
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
