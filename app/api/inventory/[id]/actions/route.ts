import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { setInventoryActionCompleted } from "@/lib/inventory/workflow";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Log in to update this action."
        },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      actionId?: string;
      completed?: boolean;
    };

    if (!body.actionId) {
      throw new Error("Action id is required.");
    }

    await setInventoryActionCompleted(body.actionId, Boolean(body.completed));
    revalidatePath(`/app/inventory/${params.id}/actions`);
    revalidatePath(`/app/inventory/${params.id}`);
    revalidatePath("/app");

    return NextResponse.json({
      ok: true
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not update action."
      },
      { status: 400 }
    );
  }
}
