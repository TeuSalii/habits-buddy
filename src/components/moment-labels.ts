import type { Size } from "@/shared/habit";
import { DAYS, type Day, type MomentWhat, type Routine, type Slot } from "@/shared/moment";

// The words and icons the person sees for each value. Kept out of the
// contract (src/shared), because wording is a concern of the screen, not
// the data. Icons are emoji for now: no image files, no licences, and they
// are easy to replace with your own illustrations later.

export const ROUTINE_LABEL: Record<Routine, string> = {
  waking_up: "Waking up",
  breakfast: "Breakfast",
  on_the_way: "On the way",
  lunch: "Lunch",
  break: "A break",
  coming_home: "Coming home",
  dinner: "Dinner",
  going_to_bed: "Going to bed",
};

export const ROUTINE_ICON: Record<Routine, string> = {
  waking_up: "🌅",
  breakfast: "🥣",
  on_the_way: "🚶", // not a train or a car: how someone travels is not ours to guess
  lunch: "🥪",
  break: "☕",
  coming_home: "🏠",
  dinner: "🍝",
  going_to_bed: "🌙",
};

// A moment in the person's own words has no icon of its own.
export const OWN_MOMENT_ICON = "✏️";

export function whatLabel(what: MomentWhat): string {
  return what.kind === "routine" ? ROUTINE_LABEL[what.routine] : what.words;
}

export function whatIcon(what: MomentWhat): string {
  return what.kind === "routine" ? ROUTINE_ICON[what.routine] : OWN_MOMENT_ICON;
}

export const SLOT_LABEL: Record<Slot, string> = {
  morning: "Morning",
  midday: "Midday",
  afternoon: "Afternoon",
  evening: "Evening",
};

export const SLOT_ICON: Record<Slot, string> = {
  morning: "🌅",
  midday: "☀️",
  afternoon: "🌤️",
  evening: "🌙",
};

// The same value as it reads inside a sentence.
export const SLOT_PHRASE: Record<Slot, string> = {
  morning: "in the morning",
  midday: "at midday",
  afternoon: "in the afternoon",
  evening: "in the evening",
};

// The three sizes of a habit, named by when they are for, not by how big
// they are: "minimum" sounds like a grade, "on a hard day" like permission.
export const SIZE_LABEL: Record<Size, string> = {
  minimum: "On a hard day",
  standard: "Most days",
  advanced: "Later, if you want more",
};

export const DAY_LABEL: Record<Day, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

// Sets of days people think in. They are shortcuts in the form and
// shorter wording on the map ("Weekdays" instead of five day names).
export type DayGroup = { label: string; phrase: string; days: readonly Day[] };

export const DAY_GROUPS: readonly DayGroup[] = [
  { label: "Every day", phrase: "every day", days: DAYS },
  { label: "Weekdays", phrase: "on weekdays", days: ["mon", "tue", "wed", "thu", "fri"] },
  { label: "Weekend", phrase: "at the weekend", days: ["sat", "sun"] },
];

// The group that is exactly these days, if there is one.
export function groupOf(days: readonly Day[]): DayGroup | undefined {
  return DAY_GROUPS.find(
    (group) => group.days.length === days.length && group.days.every((day) => days.includes(day)),
  );
}

// The days listed in week order: "Wed, Sat".
function listDays(days: readonly Day[]): string {
  return DAYS.filter((day) => days.includes(day))
    .map((day) => DAY_LABEL[day])
    .join(", ");
}

// For the map: "Every day", "Weekdays", "Weekend" or "Wed, Sat".
export function describeDays(days: readonly Day[]): string {
  return groupOf(days)?.label ?? listDays(days);
}

// For a sentence: "every day", "on weekdays" or "on Wed, Sat".
export function daysPhrase(days: readonly Day[]): string {
  return groupOf(days)?.phrase ?? `on ${listDays(days)}`;
}
