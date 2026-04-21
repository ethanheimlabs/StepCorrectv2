import { NextResponse } from "next/server";

import { DEFAULT_TONE_MODE, TONE_MODE_OPTIONS } from "@/lib/constants";
import { upsertProfile } from "@/lib/repositories/profiles";
import { getCurrentUser } from "@/lib/session";
import { validateProfilePayload } from "@/lib/validation";
import type { ToneMode } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Log in to save settings."
        },
        { status: 401 }
      );
    }

    const payload = validateProfilePayload(await request.json());
    const toneMode = TONE_MODE_OPTIONS.includes(payload.toneMode as ToneMode)
      ? (payload.toneMode as ToneMode)
      : DEFAULT_TONE_MODE;

    await upsertProfile({
      id: user.id,
      createdAt: new Date().toISOString(),
      fullName: payload.fullName,
      sobrietyDate: payload.sobrietyDate,
      toneMode
    });

    return NextResponse.json({
      message: "Settings saved."
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not save profile."
      },
      { status: 400 }
    );
  }
}
