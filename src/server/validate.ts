import { MAX_ID_LENGTH } from "@/shared/checkin";
import { MAX_HABIT_LENGTH, type SizedHabit } from "@/shared/habit";
import { DAYS, MAX_MOMENT_WORDS, type Moment, type MomentWhat, ROUTINES, SLOTS } from "@/shared/moment";

// Checks for what arrives at the server. TypeScript's types are gone at
// runtime, and anyone can send anything to a server, so every route checks
// its input with these before using it.

export function isId(value: string): boolean {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_ID_LENGTH;
}

// A text that is there: not empty, and not longer than allowed.
export function isFilledText(value: string, maxLength: number): boolean {
  return isText(value, maxLength) && value.trim() !== "";
}

// A text that may be empty.
export function isText(value: string, maxLength: number): boolean {
  return typeof value === "string" && value.length <= maxLength;
}

// A list of short texts, such as the ideas a person turned down.
export function isTextList(value: string[], maxItems: number): boolean {
  return Array.isArray(value) && value.length <= maxItems && value.every((text) => isText(text, MAX_HABIT_LENGTH));
}

export function isMoment(value: Moment): value is Moment {
  return (
    typeof value === "object" &&
    value !== null &&
    isWhat(value.what) &&
    SLOTS.includes(value.slot) &&
    Array.isArray(value.days) &&
    value.days.length > 0 &&
    value.days.every((day) => DAYS.includes(day))
  );
}

function isWhat(value: MomentWhat): boolean {
  if (typeof value !== "object" || value === null) return false;
  if (value.kind === "routine") return ROUTINES.includes(value.routine);
  if (value.kind === "own") return isFilledText(value.words, MAX_MOMENT_WORDS);
  return false;
}

export function isHabit(value: SizedHabit): value is SizedHabit {
  return (
    typeof value === "object" &&
    value !== null &&
    [value.anchor, value.minimum, value.standard, value.advanced, value.why].every((text) =>
      isText(text, MAX_HABIT_LENGTH),
    )
  );
}
