// The habit Buddy offers. Part of the app↔server contract: both sides
// import this file, so it must never contain anything secret.

// One action at one anchor, in three sizes. The person does whichever size
// the day allows, and every size counts as done.
export type SizedHabit = {
  anchor: string; // the event that triggers it: "After I take off my shoes at home"
  minimum: string; // for a hard day, under two minutes: "I will read one page"
  standard: string; // for a normal day: "I will read for ten minutes"
  advanced: string; // for later, if the person wants more: "I will read one chapter"
  why: string; // one plain sentence on why this fits this person
};

// The three sizes in the order they grow. The screens walk through this
// list, so the order is decided in one place.
export const SIZES = ["minimum", "standard", "advanced"] as const;
export type Size = (typeof SIZES)[number];

export const MAX_HABIT_LENGTH = 500;

// The models that can make an offer.
export const MODEL_IDS = ["claude", "gemma"] as const;
export type ModelId = (typeof MODEL_IDS)[number];
