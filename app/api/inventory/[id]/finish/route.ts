import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { finishInventory } from "@/lib/inventory/workflow";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const entry = await finishInventory(params.id);
    const nextPath = `/app/inventory/${entry.id}`;

    revalidatePath(nextPath);
    revalidatePath("/app");

    return NextResponse.json({
      id: entry.id,
      nextPath
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not finish inventory."
      },
      { status: 400 }
    );
  }
}
