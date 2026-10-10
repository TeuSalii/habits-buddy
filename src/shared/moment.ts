// A moment of the person's day: the place in their routine where a change
// can hang. Part of the app↔server contract, because Buddy builds its
// idea on this moment (it becomes the anchor of the habit).

// Routines most days contain. They are deliberately plain: nothing here
// assumes a job, a car or a family. Whoever does not find their moment in
// this list describes it in their own words.
export const ROUTINES = [
  "waking_up",
  "breakfast",
  "on_the_way",
  "lunch",
  "break",
  "coming_home",
  "dinner",
  "going_to_bed",
] as const;
export type Routine = (typeof ROUTINES)[number];

// What the moment is: one of the routines above, or the person's own words.
// Two shapes, because each carries different data: a routine has a name we
// know, own words are free text.
export type MomentWhat = { kind: "routine"; routine: Routine } | { kind: "own"; words: string };

export const MAX_MOMENT_WORDS = 80;

// The position on the day map. A part of the day, not a clock time: a habit
// is anchored to the event, the slot only orders the map.
export const SLOTS = ["morning", "midday", "afternoon", "evening"] as const;
export type Slot = (typeof SLOTS)[number];

// The days the moment happens. An anchor has to occur as often as the
// habit should.
export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Day = (typeof DAYS)[number];

export type Moment = {
  what: MomentWhat;
  slot: Slot;
  days: Day[]; // at least one
};
