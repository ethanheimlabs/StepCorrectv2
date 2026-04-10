import type { SafetyAssessment } from "@/lib/mobile-types";

const SAFETY_PATTERNS: Array<{
  tag: string;
  pattern: RegExp;
}> = [
  {
    tag: "self_harm",
    pattern:
      /\b(kill myself|end it all|suicide|suicidal|hurt myself|self harm|self-harm|don't want to live)\b/i
  },
  {
    tag: "overdose",
    pattern: /\b(overdose|od on|take too many pills|drink myself to death)\b/i
  },
  {
    tag: "violence",
    pattern: /\b(kill him|kill her|hurt them|beat him|beat her|shoot|stab|violent)\b/i
  }
];

const DEFAULT_SUPPORT_MESSAGE =
  "This sounds heavier than a normal inventory. Pause here and get human support now: call your sponsor, get near safe people, or use emergency services if anyone is in immediate danger.";

export function assessInventorySafety(rawText: string): SafetyAssessment {
  const tags = SAFETY_PATTERNS.filter(({ pattern }) => pattern.test(rawText)).map(({ tag }) => tag);

  if (!tags.length) {
    return {
      isSafetyCase: false,
      supportMessage: null,
      tags: []
    };
  }

  return {
    isSafetyCase: true,
    supportMessage: DEFAULT_SUPPORT_MESSAGE,
    tags
  };
}
