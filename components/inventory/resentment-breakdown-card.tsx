import { SectionCard } from "@/components/app/section-card";
import { AFFECT_LABELS } from "@/lib/constants";
import type { ResentmentExtraction } from "@/lib/types";
import type { ReactNode } from "react";

function sentenceList(values: string[], conjunction = "and") {
  if (!values.length) {
    return "";
  }

  if (values.length === 1) {
    return values[0].toLowerCase();
  }

  if (values.length === 2) {
    return `${values[0].toLowerCase()} ${conjunction} ${values[1].toLowerCase()}`;
  }

  return `${values.slice(0, -1).map((value) => value.toLowerCase()).join(", ")}, ${conjunction} ${values[
    values.length - 1
  ].toLowerCase()}`;
}

function sentenceStart(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function completeSentence(value: string) {
  const sentence = sentenceStart(value);

  if (!sentence || /[.!?]$/.test(sentence)) {
    return sentence;
  }

  return `${sentence}.`;
}

function lowerFirst(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

function softenFear(value: string) {
  return value.replace(/^that\s+/i, "").trim();
}

function cleanPhrase(value: string) {
  return value
    .replace(/([a-z])I\b/g, "$1 I")
    .replace(/\s+/g, " ")
    .replace(/^[,.;:\s]+|[,.;:\s]+$/g, "")
    .trim();
}

function splitPhrases(values: string[]) {
  return values
    .flatMap((value) => value.split(/\n|,/g))
    .map(cleanPhrase)
    .filter(Boolean);
}

function secondPersonFear(value: string) {
  return softenFear(value)
    .replace(/\bI am\b/g, "you are")
    .replace(/\bi am\b/g, "you are")
    .replace(/\bI'm\b/g, "you are")
    .replace(/\bi'm\b/g, "you are")
    .replace(/\bI will\b/g, "you will")
    .replace(/\bi will\b/g, "you will")
    .replace(/\bmy\b/g, "your")
    .replace(/\bme\b/g, "you")
    .replace(/\bI\b/g, "you")
    .trim();
}

function secondPersonStatement(value: string) {
  return cleanPhrase(value)
    .replace(/\bI was\b/g, "you were")
    .replace(/\bi was\b/g, "you were")
    .replace(/\bI am\b/g, "you are")
    .replace(/\bi am\b/g, "you are")
    .replace(/\bI'm\b/g, "you are")
    .replace(/\bi'm\b/g, "you are")
    .replace(/\bMy\b/g, "Your")
    .replace(/\bmy\b/g, "your")
    .replace(/\bMe\b/g, "You")
    .replace(/\bme\b/g, "you")
    .replace(/\bI\b/g, "you")
    .trim();
}

function normalizeFeelingInsights(values: string[]) {
  const feelings: string[] = [];
  const meaningBeliefs: string[] = [];

  for (const phrase of splitPhrases(values)) {
    const beliefMatch = phrase.match(/(?:made me feel like|made me feel|felt like)\s+(.+)$/i);

    if (beliefMatch?.[1]) {
      meaningBeliefs.push(secondPersonStatement(beliefMatch[1]));
      continue;
    }

    feelings.push(phrase.toLowerCase());
  }

  return {
    feelings,
    meaningBeliefs
  };
}

function normalizeFearClause(value: string) {
  const phrase = secondPersonFear(value).toLowerCase();

  if (!phrase) {
    return "";
  }

  if (/\bloneliness\b|\balone\b/.test(phrase)) {
    return "you might end up alone";
  }

  if (/^losing\b/.test(phrase)) {
    return `you might ${phrase.replace(/^losing\b/, "lose")}`;
  }

  if (/^lose\b/.test(phrase)) {
    return `you might ${phrase}`;
  }

  if (/^(this|it|they|their|the)\b/.test(phrase)) {
    return phrase;
  }

  if (/^you\s+(are|were|will|would|can|could|might|may|do|don't|cannot|can't|need|want|have|trust|feel|believe)\b/.test(phrase)) {
    return phrase;
  }

  if (/^your\s+.+\b(is|are|was|were|can|could|will|would|might|may|do|does|matter|matters)\b/.test(phrase)) {
    return phrase;
  }

  return `you might ${phrase}`;
}

function fearSentence(clauses: string[]) {
  if (!clauses.length) {
    return "";
  }

  const thatClauses = clauses.map((clause) => `that ${clause}`);

  return `Underneath, the fear may be ${sentenceList(thatClauses, "or")}.`;
}

function secondPersonPhrase(value: string) {
  return value
    .replace(/\bMy\b/g, "Your")
    .replace(/\bmy\b/g, "your")
    .replace(/\bMe\b/g, "You")
    .replace(/\bme\b/g, "you")
    .trim();
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map(cleanPhrase)
    .filter(Boolean);
}

function activeAffectLabels(extraction: ResentmentExtraction) {
  return Object.entries(extraction.affects)
    .filter(([, enabled]) => enabled)
    .map(([key]) => AFFECT_LABELS[key as keyof typeof AFFECT_LABELS]);
}

function includesAny(source: string, words: string[]) {
  const normalized = source.toLowerCase();

  return words.some((word) => normalized.includes(word));
}

function unique(values: string[]) {
  return values.filter((value, index) => value && values.indexOf(value) === index);
}

function cleanFact(value: string) {
  return secondPersonStatement(cleanPhrase(value)
    .replace(/^i'?m resentful (?:at|toward|towards|with)\s+[^.]+?\s+for\s+/i, "")
    .replace(/^i am resentful (?:at|toward|towards|with)\s+[^.]+?\s+for\s+/i, ""))
    .replace(/^breaking up with you\b/i, "broke up with you")
    .replace(/^leaving you\b/i, "left you")
    .replace(/^not respecting your boundaries\b/i, "did not respect your boundaries");
}

function buildWhatHappened(target: string, fact: string) {
  const displayTarget = secondPersonPhrase(target);
  const clean = cleanPhrase(fact);

  if (!clean) {
    return displayTarget;
  }

  const withoutDuplicatePronoun = clean.replace(/^(he|she|they)\s+/i, "");

  if (withoutDuplicatePronoun !== clean) {
    return `${displayTarget} ${lowerFirst(withoutDuplicatePronoun)}`;
  }

  if (clean.toLowerCase().startsWith(displayTarget.toLowerCase())) {
    return clean;
  }

  return `${displayTarget} ${lowerFirst(clean)}`;
}

function deriveHumanNeeds(extraction: ResentmentExtraction, affectedParts: string[]) {
  const source = [
    extraction.what_happened_facts,
    ...affectedParts,
    ...extraction.fear_inventory,
    ...extraction.felt_reactions
  ].join(" ");
  const needs: string[] = [];

  if (includesAny(source, ["boundary", "respect", "disrespect"])) {
    needs.push("respect", "autonomy");
  }

  if (includesAny(source, ["security", "safe", "control", "losing", "alone", "loneliness"])) {
    needs.push("security");
  }

  if (includesAny(source, ["self-esteem", "unworthy", "worth", "not enough"])) {
    needs.push("worth");
  }

  if (includesAny(source, ["relationship", "break", "leaving", "belong", "chosen"])) {
    needs.push("belonging");
  }

  if (includesAny(source, ["ambition", "dream", "goal", "music", "creative", "purpose"])) {
    needs.push("encouragement", "self-expression");
  }

  return unique(needs.length ? needs : ["respect", "emotional safety"]);
}

function beliefText(meaningBeliefs: string[], fearClauses: string[]) {
  const beliefs = [...meaningBeliefs, ...fearClauses].map((belief) =>
    belief
      .replace(/^you might\s+/i, "you could ")
      .replace(/^you are\s+/i, "you are ")
      .trim()
  );

  if (!beliefs.length) {
    return "The belief underneath may be that your peace depends on getting a different response from the other person.";
  }

  const clauses = beliefs.map((belief) => `that ${belief}`);

  return `The belief underneath may be ${sentenceList(clauses, "or")}.`;
}

function BreakdownItem({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <div className="space-y-2 text-sm leading-7 text-muted-foreground">{children}</div>
    </div>
  );
}

function LineList({ lines }: { lines: string[] }) {
  return (
    <div className="space-y-2">
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}

function InsightCallout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <div className="rounded-[1.25rem] border border-border/70 bg-secondary/60 px-4 py-4 text-sm leading-7 text-foreground">
      {children}
    </div>
  );
}

export function ResentmentBreakdownCard({
  extraction,
  title = "Breaking down the resentment"
}: {
  extraction: ResentmentExtraction;
  title?: string;
}) {
  const affectedParts = extraction.affected_parts_detail.length
    ? extraction.affected_parts_detail
    : activeAffectLabels(extraction);
  const displayAffectedParts = affectedParts.map(secondPersonPhrase);
  const affectedLine = sentenceList(displayAffectedParts);
  const { feelings, meaningBeliefs } = normalizeFeelingInsights(extraction.felt_reactions);
  const feelingLine = sentenceList(feelings, "or");
  const fearClauses = splitPhrases(extraction.fear_inventory)
    .map(normalizeFearClause)
    .filter(Boolean);
  const roleLines = splitLines(extraction.my_part_controlled)
    .map(secondPersonStatement)
    .map(completeSentence);
  const spiritualTruthLines = extraction.spiritual_truths
    .map(secondPersonStatement)
    .map(completeSentence);
  const actionLines = extraction.next_right_actions.map(cleanPhrase).map(completeSentence);
  const firstAction = actionLines[0];
  const firstSpiritualTruth = spiritualTruthLines[0];
  const fact = cleanFact(extraction.what_happened_facts);
  const needs = deriveHumanNeeds(extraction, affectedParts);
  const needLine = sentenceList(needs);
  const needReference = needs.length > 1 ? "those needs are" : "that need is";
  const whatHappened = buildWhatHappened(extraction.who_or_what, fact);
  const whyItHurt = `This hurt because it touched your need for ${needLine}. When ${needReference} not met, the pain is not only about the event; it can feel like your value, safety, or place in the relationship is being questioned.`;
  const effectOnLife = [
    feelingLine
      ? `This can leave you feeling ${feelingLine} after the moment is over.`
      : "",
    meaningBeliefs.length
      ? `It can also stir the painful belief that ${sentenceList(meaningBeliefs, "or")}.`
      : "",
    fearSentence(fearClauses),
    "From there, resentment can keep pulling your attention back to the event instead of helping you decide what to do next."
  ]
    .filter(Boolean)
    .join(" ");
  const partOfSelf = affectedLine
    ? `The part of you most affected seems to be ${affectedLine}. That makes sense: resentment often gets louder when it touches how you see yourself or how safe you feel with another person.`
    : "The part of you most affected seems to be your sense of dignity and emotional safety.";
  const underlyingBelief = beliefText(meaningBeliefs, fearClauses);
  const userRole = roleLines.length
    ? `Your role is not that you caused the hurt. It is that the hurt may now be shaping your focus: ${lowerFirst(
        roleLines[0]
      )}${roleLines[1] ? ` ${roleLines[1]}` : ""}`
    : "Your role is not that you caused the hurt. It is noticing whether you are replaying it, waiting for validation, or giving the other person's behavior too much power over your peace.";
  const faithAspect = firstSpiritualTruth
    ? `The trust work here is remembering that ${lowerFirst(firstSpiritualTruth)} This does not deny what happened; it helps you stop making your peace dependent on the other person's response.`
    : "The trust work here is staying connected to your own path instead of letting one person's response define your peace.";

  return (
    <SectionCard
      title={title}
      description="A clear read on what happened, why it hurt, and what can help now."
    >
      <div className="space-y-6">
        <InsightCallout>
          <p>
            This is not about judging the feeling. It is about making the resentment clear
            enough that you can see what it is protecting and choose your next step with more
            honesty.
          </p>
        </InsightCallout>

        <div className="grid gap-6 md:grid-cols-2">
          <BreakdownItem label="1. What happened">
            <p>{completeSentence(whatHappened)}</p>
          </BreakdownItem>

          <BreakdownItem label="2. Why it hurt">
            <p>{whyItHurt}</p>
          </BreakdownItem>

          <BreakdownItem label="3. Effect on life">
            <p>{effectOnLife}</p>
          </BreakdownItem>

          <BreakdownItem label="4. Part of self affected">
            <p>{partOfSelf}</p>
          </BreakdownItem>

          <BreakdownItem label="5. Underlying belief">
            <p>{underlyingBelief}</p>
          </BreakdownItem>

          <BreakdownItem label="6. User's role">
            <p>{userRole}</p>
          </BreakdownItem>

          <BreakdownItem label="7. Faith or trust aspect">
            <p>{faithAspect}</p>
          </BreakdownItem>
        </div>

        {actionLines.length ? (
          <BreakdownItem label="8. Actions to overcome">
            <p>
              These actions are meant to help you stop feeding the resentment and return to
              something grounded and doable.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {actionLines.map((action) => (
                <div
                  key={action}
                  className="rounded-[1.25rem] border border-border/70 bg-secondary/60 px-4 py-3 text-foreground"
                >
                  {action}
                </div>
              ))}
            </div>
          </BreakdownItem>
        ) : null}
      </div>
    </SectionCard>
  );
}
