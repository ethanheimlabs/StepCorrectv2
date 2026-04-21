import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  createProgressStreamResponse,
  wantsProgressStream
} from "@/lib/inventory/progress-stream";
import { startInventory } from "@/lib/inventory/workflow";
import { getCurrentUser } from "@/lib/session";
import { validateRawText } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { rawText?: unknown };
    const rawText = validateRawText(body.rawText);
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Log in to start an inventory."
        },
        { status: 401 }
      );
    }

    if (wantsProgressStream(request)) {
      return createProgressStreamResponse(async (send) => {
        const { entry, classification } = await startInventory(
          user.id,
          rawText,
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
        if (!entry) {
          send({
            type: "complete",
            id: "safety",
            nextPath: "/safety?from=inventory"
          });
          return;
        }
        const nextPath = classification.needs_clarification
          ? `/app/inventory/${entry.id}/clarify`
          : `/app/inventory/${entry.id}/review`;

        revalidatePath(nextPath);
        revalidatePath("/app");

        send({
          type: "complete",
          id: entry.id,
          nextPath
        });
      });
    }

    const { entry, classification } = await startInventory(user.id, rawText);
    if (!entry) {
      return NextResponse.json({
        id: "safety",
        nextPath: "/safety?from=inventory"
      });
    }
    const nextPath = classification.needs_clarification
      ? `/app/inventory/${entry.id}/clarify`
      : `/app/inventory/${entry.id}/review`;

    revalidatePath(nextPath);
    revalidatePath("/app");

    return NextResponse.json({
      id: entry.id,
      nextPath
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not start inventory."
      },
      { status: 400 }
    );
  }
}
