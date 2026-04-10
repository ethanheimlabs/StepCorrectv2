export type InventoryProgressStatus = {
  title: string;
  description: string;
};

export type InventoryProgressEvent =
  | ({ type: "status" } & InventoryProgressStatus)
  | { type: "preview_delta"; delta: string }
  | { type: "complete"; id?: string; nextPath: string }
  | { type: "error"; error: string };

export function wantsProgressStream(request: Request) {
  return request.headers.get("x-stepcorrect-stream") === "1";
}

export function createProgressStreamResponse(
  executor: (send: (event: InventoryProgressEvent) => void) => Promise<void>
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: InventoryProgressEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      try {
        await executor(send);
      } catch (error) {
        send({
          type: "error",
          error: error instanceof Error ? error.message : "Something went wrong."
        });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}

export async function consumeProgressStream(
  response: Response,
  handlers: {
    onStatus?: (event: InventoryProgressStatus) => void;
    onPreviewDelta?: (delta: string) => void;
    onComplete?: (event: { id?: string; nextPath: string }) => void;
    onError?: (message: string) => void;
  }
) {
  if (!response.body) {
    throw new Error("No response body returned.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }

      const event = JSON.parse(line) as InventoryProgressEvent;

      if (event.type === "status") {
        handlers.onStatus?.({
          title: event.title,
          description: event.description
        });
      }

      if (event.type === "preview_delta") {
        handlers.onPreviewDelta?.(event.delta);
      }

      if (event.type === "complete") {
        handlers.onComplete?.({
          id: event.id,
          nextPath: event.nextPath
        });
      }

      if (event.type === "error") {
        handlers.onError?.(event.error);
      }
    }
  }

  if (buffer.trim()) {
    const event = JSON.parse(buffer) as InventoryProgressEvent;

    if (event.type === "status") {
      handlers.onStatus?.({
        title: event.title,
        description: event.description
      });
    }

    if (event.type === "preview_delta") {
      handlers.onPreviewDelta?.(event.delta);
    }

    if (event.type === "complete") {
      handlers.onComplete?.({
        id: event.id,
        nextPath: event.nextPath
      });
    }

    if (event.type === "error") {
      handlers.onError?.(event.error);
    }
  }
}
