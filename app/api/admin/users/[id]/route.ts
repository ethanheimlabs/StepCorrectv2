import { NextResponse } from "next/server";

import { deleteUserAccount } from "@/lib/repositories/admin";
import { requireAdminUser } from "@/lib/session";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await requireAdminUser();
    const targetUserId = params.id;

    if (!targetUserId) {
      return NextResponse.json(
        {
          error: "Missing user id."
        },
        { status: 400 }
      );
    }

    if (adminUser.id === targetUserId) {
      return NextResponse.json(
        {
          error: "You cannot delete your own admin account from this page."
        },
        { status: 400 }
      );
    }

    await deleteUserAccount(targetUserId);

    return NextResponse.json({
      message: "User deleted."
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not delete user."
      },
      { status: 400 }
    );
  }
}
