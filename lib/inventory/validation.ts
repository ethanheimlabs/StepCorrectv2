import {
  DEFAULT_AFFECTS,
  PATTERN_OPTIONS,
  type ActionPlan,
  type InventoryPattern,
  type StructuredReview
} from "@/lib/inventory/types";

export function validateRawText(rawText: unknown) {
  if (typeof rawText !== "string" || rawText.trim().length < 5) {
    throw new Error("Give it a little more truth before continuing.");
  }

  return rawText.trim();
}

export function validateClarifyingAnswer(answer: unknown) {
  if (typeof answer !== "string" || answer.trim().length < 8) {
    throw new Error("Say what happened in plain language.");
  }

  return answer.trim();
}

export function validateReviewInput(payload: unknown): StructuredReview {
  if (!payload || typeof payload !== "object") {
    throw new Error("Review details are missing.");
  }

  const review = payload as Partial<StructuredReview>;

  if (!review.resentfulAt?.trim()) {
    throw new Error("Name who or what you are resentful at.");
  }

  if (!review.cause?.trim()) {
    throw new Error("Name the cause plainly.");
  }

  if (!review.story?.trim()) {
    throw new Error("Add a clean sentence about what happened.");
  }

  return {
    resentfulAt: review.resentfulAt.trim(),
    cause: review.cause.trim(),
    story: review.story.trim(),
    affects: {
      ...DEFAULT_AFFECTS,
      ...(review.affects ?? {})
    }
  };
}

export function validateActionPlanInput(payload: unknown): ActionPlan {
  if (!payload || typeof payload !== "object") {
    throw new Error("Action details are missing.");
  }

  const plan = payload as Partial<ActionPlan>;

  if (!plan.myPart?.trim()) {
    throw new Error("Write your part plainly.");
  }

  if (!plan.prayer?.trim()) {
    throw new Error("Keep the prayer or letting-go line simple and direct.");
  }

  if (!plan.nextAction?.trim()) {
    throw new Error("Choose one next right action.");
  }

  if (!plan.amends?.trim()) {
    throw new Error("Say whether there is cleanup or amends on your side.");
  }

  const patterns = Array.isArray(plan.patterns)
    ? plan.patterns.filter((pattern): pattern is InventoryPattern =>
        PATTERN_OPTIONS.includes(pattern as InventoryPattern)
      )
    : [];

  return {
    myPart: plan.myPart.trim(),
    patterns,
    prayer: plan.prayer.trim(),
    nextAction: plan.nextAction.trim(),
    amends: plan.amends.trim()
  };
}
