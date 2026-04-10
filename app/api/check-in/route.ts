import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createDailyCheckIn } from "@/lib/repositories/checkins";
import { getCurrentUser } from "@/lib/session";
import { validateCheckIn } from "@/lib/validation";

export const runtime = "nodejs";

function buildGuidance({
  mood,
  craving,
  halt
}: {
  mood: number;
  craving: number;
  halt: { hungry: boolean; angry: boolean; lonely: boolean; tired: boolean };
}) {
  if (craving >= 7) {
    return "High craving day. Reach out to your sponsor, get near other people in recovery, and keep the next hour simple.";
  }

  if (halt.lonely || halt.angry) {
    return "Don’t isolate with this one. Reach out, tell the truth, and avoid making big decisions heated up.";
  }

  if (halt.hungry || halt.tired) {
    return "Handle the body first. Eat, slow down, rest if you can, then look at the next right action.";
  }

  if (mood <= 4) {
    return "Low day. Keep it basic: prayer or meditation, one honest reach-out, and one useful action.";
  }

  return "Steady enough to keep moving. Stay close to the plan, keep your side clean, and don’t drift.";
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const payload = validateCheckIn(await request.json());
    await createDailyCheckIn({
      id: crypto.randomUUID(),
      userId: user.id,
      createdAt: new Date().toISOString(),
      ...payload
    });
    revalidatePath("/app");

    return NextResponse.json({
      guidance: buildGuidance(payload)
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not save the check-in."
      },
      { status: 400 }
    );
  }
}
