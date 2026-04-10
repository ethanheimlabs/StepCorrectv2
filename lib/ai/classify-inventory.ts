import { z } from "zod";

import { parseStructuredResponse } from "@/lib/openai/client";
import { inventoryClassificationPrompt } from "@/lib/openai/prompts";
import type { ClassificationResult } from "@/lib/types";

const classificationSchema = z.object({
  entry_type: z.enum(["resentment", "fear", "both", "unknown"]),
  confidence: z.object({
    resentment: z.number(),
    fear: z.number()
  }),
  needs_clarification: z.boolean(),
  clarifying_question: z.string()
});

function normalizeInput(value: string) {
  return value
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function clampConfidence(value: number) {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, Number(value.toFixed(2))));
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

function buildFallbackClarifyingQuestion(rawText: string, entryType: ClassificationResult["entry_type"]) {
  if (entryType === "fear") {
    return "What specifically are you afraid might happen here?";
  }

  if (entryType === "unknown") {
    return "What happened, and what part of it are you reacting to most right now?";
  }

  return `What specifically did ${extractTarget(rawText)} do or say that triggered this resentment?`;
}

function classifyInventoryFallback(rawText: string): ClassificationResult {
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

  const isFear = /\bfear|afraid|anxious|panic|worried\b/i.test(rawText);
  const isResentment = /\bresent|angry|mad|bitter|upset|hurt\b/i.test(rawText);
  const needsClarification =
    normalized.split(" ").length < 8 || !/\b(?:because|when|after|for|about)\b/i.test(rawText);

  const entryType: ClassificationResult["entry_type"] =
    isFear && isResentment ? "both" : isFear ? "fear" : isResentment ? "resentment" : "unknown";

  return {
    entry_type: entryType,
    confidence: {
      resentment: isResentment ? 0.87 : entryType === "unknown" ? 0.32 : 0.18,
      fear: isFear ? 0.81 : entryType === "unknown" ? 0.28 : 0.14
    },
    needs_clarification: needsClarification,
    clarifying_question: needsClarification
      ? buildFallbackClarifyingQuestion(rawText, entryType)
      : ""
  };
}

async function classifyInventoryWithAI(rawText: string): Promise<ClassificationResult | null> {
  const parsed = await parseStructuredResponse({
    schema: classificationSchema,
    schemaName: "inventory_classification",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: inventoryClassificationPrompt
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Raw inventory text:\n${rawText}`
          }
        ]
      }
    ],
    reasoningEffort: "low",
    maxOutputTokens: 220
  });

  if (!parsed) {
    return null;
  }

  return {
    entry_type: parsed.entry_type,
    confidence: {
      resentment: clampConfidence(parsed.confidence.resentment),
      fear: clampConfidence(parsed.confidence.fear)
    },
    needs_clarification: parsed.needs_clarification,
    clarifying_question: parsed.needs_clarification
      ? parsed.clarifying_question.trim() ||
        buildFallbackClarifyingQuestion(rawText, parsed.entry_type)
      : ""
  };
}

export async function classifyInventory(rawText: string): Promise<ClassificationResult> {
  try {
    return (await classifyInventoryWithAI(rawText)) ?? classifyInventoryFallback(rawText);
  } catch (error) {
    console.error("OpenAI classification failed. Falling back to deterministic classifier.", error);
    return classifyInventoryFallback(rawText);
  }
}
