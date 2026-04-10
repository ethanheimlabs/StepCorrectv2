import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  createProgressStreamResponse,
  wantsProgressStream
} from "@/lib/inventory/progress-stream";
import {
  submitClarification,
  submitClarificationWithProgress
} from "@/lib/inventory/workflow";
import { validateClarification } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await request.json()) as { answer?: unknown };
    const answer = validateClarification(body.answer);

    if (wantsProgressStream(request)) {
      return createProgressStreamResponse(async (send) => {
        const { entry } = await submitClarificationWithProgress(
          params.id,
          answer,
          (event) => {
            send({
              type: "status",
              ...event
            });
          },
          (delta) => {
            send({
              type: "preview_delta",
              delta
            });
          }
        );
        const nextPath = entry ? `/app/inventory/${entry.id}/review` : "/safety?from=inventory";

        if (entry) {
          revalidatePath(nextPath);
        }
        revalidatePath("/app");

        send({
          type: "complete",
          id: entry?.id ?? "safety",
          nextPath
        });
      });
    }

    const { entry } = await submitClarification(params.id, answer);
    const nextPath = entry ? `/app/inventory/${entry.id}/review` : "/safety?from=inventory";

    if (entry) {
      revalidatePath(nextPath);
    }
    revalidatePath("/app");

    return NextResponse.json({
      id: entry?.id ?? "safety",
      nextPath
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not save clarification."
      },
      { status: 400 }
    );
  }
}
