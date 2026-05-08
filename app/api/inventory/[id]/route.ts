import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { deleteInventoryEntry } from "@/lib/repositories/inventory";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Log in to delete an inventory."
        },
        { status: 401 }
      );
    }

    const deleted = await deleteInventoryEntry(params.id, user.id);

    if (!deleted) {
      return NextResponse.json(
        {
          error: "Inventory not found."
        },
        { status: 404 }
      );
    }

    revalidatePath("/app");
    revalidatePath("/app/inventory");
    revalidatePath(`/app/inventory/${params.id}`);
    revalidatePath(`/app/inventory/${params.id}/clarify`);
    revalidatePath(`/app/inventory/${params.id}/review`);
    revalidatePath(`/app/inventory/${params.id}/actions`);

    return NextResponse.json({
      message: "Inventory deleted.",
      nextPath: "/app/inventory"
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not delete inventory."
      },
      { status: 400 }
    );
  }
}
