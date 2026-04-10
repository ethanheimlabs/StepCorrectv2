import type { AffectFlags, ToneMode } from "./types";

export const EMPTY_AFFECT_FLAGS: AffectFlags = {
  self_esteem: false,
  security: false,
  ambitions: false,
  personal_relations: false,
  sex_relations: false,
  pride: false,
  pocketbook: false
};

export const AFFECT_LABELS: Record<keyof AffectFlags, string> = {
  self_esteem: "Self-esteem",
  security: "Security",
  ambitions: "Ambitions",
  personal_relations: "Personal relations",
  sex_relations: "Sex relations",
  pride: "Pride",
  pocketbook: "Pocketbook"
};

export const CLARIFY_QUICK_CHIPS = [
  "Criticized my recovery",
  "Talked about me to family",
  "Didn’t respect my boundaries",
  "Dismissed my feelings"
] as const;

export const TONE_MODE_OPTIONS: ToneMode[] = [
  "Gentle",
  "Direct",
  "Old-school",
  "Coach-style"
];

export const STEP_COPY = [
  {
    stepNumber: 1,
    title: "Honest admission",
    description: "Get truthful about where self-will has stopped working."
  },
  {
    stepNumber: 2,
    title: "Open to help",
    description: "Make room for guidance bigger than your own thinking."
  },
  {
    stepNumber: 3,
    title: "Turn it over",
    description: "Practice surrender instead of running the whole show."
  },
  {
    stepNumber: 4,
    title: "Inventory",
    description: "Write the truth down so you can stop carrying it around."
  },
  {
    stepNumber: 5,
    title: "Tell the truth",
    description: "Share the real inventory with God, yourself, and another person."
  },
  {
    stepNumber: 6,
    title: "Willingness",
    description: "Get ready to let go of the patterns that keep burning you."
  },
  {
    stepNumber: 7,
    title: "Ask for change",
    description: "Ask humbly for help where your own effort keeps failing."
  },
  {
    stepNumber: 8,
    title: "Amends list",
    description: "Name the harm and get willing to clean up your side."
  },
  {
    stepNumber: 9,
    title: "Direct amends",
    description: "Take action where it helps instead of harms."
  },
  {
    stepNumber: 10,
    title: "Daily inventory",
    description: "Catch resentment, fear, and dishonesty before they run the day."
  },
  {
    stepNumber: 11,
    title: "Prayer and meditation",
    description: "Slow down and ask for direction before reacting."
  },
  {
    stepNumber: 12,
    title: "Carry the message",
    description: "Stay useful by giving away what helped you."
  }
] as const;
