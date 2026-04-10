import {
  DEFAULT_AFFECTS,
  type ActionPlan,
  type AffectKey,
  type InventoryConfidence,
  type InventoryPattern,
  type StructuredReview
} from "@/lib/inventory/types";

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function titleCaseTarget(value: string) {
  return value
    .trim()
    .replace(/\b(my|the|a|an)\b/gi, (token) => token.toLowerCase())
    .replace(/^\w/, (char) => char.toUpperCase());
}

export function extractTarget(rawText: string, clarifyingAnswer?: string | null) {
  const source = `${rawText} ${clarifyingAnswer ?? ""}`.toLowerCase();
  const match =
    source.match(/resentful\s+(?:at|with|toward|towards)\s+(.+?)(?:[,.!?]|$)/i) ??
    source.match(/\b(?:my|the)\s+([a-z\s]+?)(?:\s+(?:did|said|for|because|when)|[,.!?]|$)/i);

  if (!match) {
    return "this person";
  }

  const candidate = match[1].replace(/\bthat\b.*$/i, "").trim();
  return titleCaseTarget(candidate || "this person");
}

function deriveCause(rawText: string, clarifyingAnswer?: string | null) {
  if (clarifyingAnswer) {
    return normalizeWhitespace(clarifyingAnswer);
  }

  const cleaned = rawText
    .replace(/^i['’]?m\s+resentful\s+(?:at|with|toward|towards)\s+.+?(?:because|for)?/i, "")
    .replace(/^i\s+resent\s+.+?(?:because|for)?/i, "")
    .trim();

  return cleaned ? normalizeWhitespace(cleaned) : "I felt crossed, dismissed, or treated unfairly.";
}

function inferAffects(text: string): Record<AffectKey, boolean> {
  const source = text.toLowerCase();
  return {
    selfEsteem: /disrespect|ignored|embarrass|critic|belittle|undermine/.test(source),
    security: /threat|unsafe|trust|depend|control|support/.test(source),
    ambitions: /plan|future|opportunit|goal|career|progress/.test(source),
    personalRelations: /family|friend|relationship|distance|betray|left out/.test(source),
    sexRelations: /partner|intim|sex|romantic|marriage/.test(source),
    pocketbook: /money|rent|paid|owe|debt|job|bill/.test(source)
  };
}

function ensureAtLeastOneAffect(affects: Record<AffectKey, boolean>) {
  if (Object.values(affects).some(Boolean)) {
    return affects;
  }

  return {
    ...DEFAULT_AFFECTS,
    selfEsteem: true,
    personalRelations: true
  };
}

export function mockClassifyInventory(rawText: string): {
  entryType: "resentment";
  confidence: InventoryConfidence;
  needsClarification: boolean;
  clarifyingQuestion: string;
} {
  const normalized = rawText.toLowerCase();
  const target = extractTarget(rawText).toLowerCase();
  const resentment = normalized.includes("resent") ? 0.91 : 0.84;
  const fear = normalized.includes("fear") || normalized.includes("afraid") ? 0.42 : 0.18;
  const needsClarification =
    rawText.trim().split(/\s+/).length < 9 || !/\b(because|when|after|for)\b/i.test(rawText);

  return {
    entryType: "resentment",
    confidence: {
      resentment,
      fear
    },
    needsClarification,
    clarifyingQuestion: `What specifically did ${target} do or say that triggered this resentment?`
  };
}

export function buildStructuredReview(
  rawText: string,
  clarifyingAnswer?: string | null
): StructuredReview {
  const resentfulAt = extractTarget(rawText, clarifyingAnswer);
  const cause = deriveCause(rawText, clarifyingAnswer);
  const story = normalizeWhitespace(
    clarifyingAnswer
      ? `I felt resentment toward ${resentfulAt.toLowerCase()} because ${cause.replace(/\.$/, "")}.`
      : rawText
  );
  const affects = ensureAtLeastOneAffect(
    inferAffects(`${rawText} ${clarifyingAnswer ?? ""}`)
  );

  return {
    resentfulAt,
    cause,
    story,
    affects
  };
}

function patternFromReview(review: StructuredReview): InventoryPattern[] {
  const patterns = new Set<InventoryPattern>();

  if (review.affects.selfEsteem || review.affects.ambitions) {
    patterns.add("self-seeking");
  }

  if (review.affects.security || /assume|expect|control|should/i.test(review.story)) {
    patterns.add("frightened");
  }

  if (review.affects.personalRelations || review.affects.sexRelations) {
    patterns.add("inconsiderate");
  }

  if (/half-truth|hid|withheld|avoided/i.test(review.story)) {
    patterns.add("dishonest");
  }

  if (patterns.size === 0) {
    patterns.add("frightened");
    patterns.add("self-seeking");
  }

  return Array.from(patterns);
}

function buildPartStatement(review: StructuredReview) {
  const statements: string[] = [];

  if (review.affects.selfEsteem) {
    statements.push("I wanted to look right and be seen a certain way.");
  }

  if (review.affects.security) {
    statements.push("I wanted control or reassurance I could not force.");
  }

  if (review.affects.personalRelations) {
    statements.push("I was attached to how this relationship should go.");
  }

  if (review.affects.pocketbook) {
    statements.push("Money or material pressure raised the heat.");
  }

  return statements.length
    ? statements.join(" ")
    : "I was demanding a different outcome and tightening up around it.";
}

export function buildActionPlan(review: StructuredReview): ActionPlan {
  const patterns = patternFromReview(review);
  const resentfulAtLower = review.resentfulAt.toLowerCase();

  return {
    myPart: buildPartStatement(review),
    patterns,
    prayer: `God, help me be free of anger toward ${resentfulAtLower}. Show me where I need to be honest, useful, and willing.`,
    nextAction:
      "Pause before reacting. Talk it through with a sponsor or trusted person, then choose one clean action instead of replaying the story.",
    amends:
      "If I owe honesty, cleanup, or a direct apology for my side, I will make a plan for that and leave the rest with God."
  };
}
