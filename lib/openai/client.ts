import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z, type ZodTypeAny } from "zod";

import { createLocalTextEmbedding } from "@/lib/ai/local-embedding";

const DEFAULT_MODEL = "gpt-5.4";
const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";
const STRUCTURED_OUTPUT_RETRY_LIMIT = 2;

let cachedClient: OpenAI | null = null;

type StructuredMessage = {
  role: "system" | "user" | "assistant";
  content: Array<{
    type: "input_text";
    text: string;
  }>;
};

export function hasOpenAIApiKey() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getOpenAIModel() {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
}

export function getOpenAIEmbeddingModel() {
  return process.env.OPENAI_EMBEDDING_MODEL?.trim() || DEFAULT_EMBEDDING_MODEL;
}

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey });
  }

  return cachedClient;
}

export function getRefusalText(response: {
  output?: unknown[];
}) {
  for (const item of response.output ?? []) {
    if (!item || typeof item !== "object" || !("content" in item)) {
      continue;
    }

    const contentList = (item as { content?: unknown }).content;

    if (!Array.isArray(contentList)) {
      continue;
    }

    for (const content of contentList) {
      if (!content || typeof content !== "object") {
        continue;
      }

      if (
        "type" in content &&
        "refusal" in content &&
        (content as { type?: unknown }).type === "refusal" &&
        typeof (content as { refusal?: unknown }).refusal === "string"
      ) {
        return (content as { refusal: string }).refusal;
      }
    }
  }

  return null;
}

export async function parseStructuredResponse<TSchema extends ZodTypeAny>({
  schema,
  schemaName,
  input,
  model = getOpenAIModel(),
  maxOutputTokens,
  reasoningEffort = "low"
}: {
  schema: TSchema;
  schemaName: string;
  input: StructuredMessage[];
  model?: string;
  maxOutputTokens?: number;
  reasoningEffort?: "minimal" | "low" | "medium" | "high";
}): Promise<z.infer<TSchema> | null> {
  const client = getOpenAIClient();

  if (!client) {
    return null;
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < STRUCTURED_OUTPUT_RETRY_LIMIT; attempt += 1) {
    try {
      const response = await client.responses.parse({
        model,
        input,
        max_output_tokens: maxOutputTokens,
        reasoning: {
          effort: reasoningEffort
        },
        text: {
          format: zodTextFormat(schema, schemaName)
        }
      });

      const refusal = getRefusalText(response);

      if (refusal) {
        throw new Error(refusal);
      }

      if (!response.output_parsed) {
        throw new Error(`OpenAI did not return a usable ${schemaName} payload.`);
      }

      return response.output_parsed;
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error(`OpenAI ${schemaName} call failed.`);

      if (attempt === STRUCTURED_OUTPUT_RETRY_LIMIT - 1) {
        throw lastError;
      }
    }
  }

  throw lastError ?? new Error(`OpenAI ${schemaName} call failed.`);
}

export async function createEmbeddingVector(input: string) {
  const client = getOpenAIClient();
  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  if (!client) {
    return createLocalTextEmbedding(trimmed);
  }

  try {
    const response = await client.embeddings.create({
      model: getOpenAIEmbeddingModel(),
      input: trimmed
    });

    const embedding = response.data[0]?.embedding;

    if (!embedding?.length) {
      throw new Error("OpenAI did not return a usable embedding.");
    }

    return {
      embedding,
      model: response.model,
      dimensions: embedding.length
    };
  } catch (error) {
    console.error("OpenAI embedding failed. Falling back to local embedding.", error);
    return createLocalTextEmbedding(trimmed);
  }
}
