import { getOpenAIClient, getOpenAIModel } from "@/lib/openai/client";
import { resentmentPreviewPrompt } from "@/lib/openai/prompts";

export async function streamResentmentPreview(
  rawText: string,
  clarificationText: string,
  onDelta: (delta: string) => void | Promise<void>
) {
  const client = getOpenAIClient();

  if (!client) {
    return null;
  }

  let fullText = "";

  const stream = client.responses
    .stream({
      model: getOpenAIModel(),
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: resentmentPreviewPrompt
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                `Raw resentment text: ${rawText}`,
                `Clarification: ${clarificationText}`
              ].join("\n")
            }
          ]
        }
      ],
      reasoning: {
        effort: "low"
      },
      max_output_tokens: 220
    })
    .on("response.output_text.delta", async (event) => {
      fullText += event.delta;
      await onDelta(event.delta);
    });

  await stream.finalResponse();

  return fullText.trim() || null;
}
