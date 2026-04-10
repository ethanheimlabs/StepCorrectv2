import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { saveReviewedInventory } from "@/lib/inventory/workflow";
import { validateResentmentExtraction } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await request.json()) as unknown;
    const review = validateResentmentExtraction(body);
    const entry = await saveReviewedInventory(params.id, review);
    const nextPath = `/app/inventory/${entry.id}/actions`;

    revalidatePath(nextPath);
    revalidatePath("/app");

    return NextResponse.json({
      id: entry.id,
      nextPath
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not save review."
      },
      { status: 400 }
    );
  }
}
