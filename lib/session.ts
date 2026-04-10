import { DEFAULT_TONE_MODE, DEMO_USER_ID, DEMO_USER_NAME } from "@/lib/constants";

export async function getCurrentUser() {
  return {
    id: DEMO_USER_ID,
    fullName: DEMO_USER_NAME,
    toneMode: DEFAULT_TONE_MODE
  };
}
