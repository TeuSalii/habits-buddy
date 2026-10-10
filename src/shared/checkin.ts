import type { SizedHabit } from "@/shared/habit";

// The contract for a check-off: the person marks that they did (or, when
// they untick it, did not do) their plan on one day.

export type CheckinRequest = {
  userId: string;
  changeId: string;
  habit: SizedHabit; // the plan as it read when it was checked
  date: string; // the day it is about, as "2026-10-05"
  done: boolean; // false when a tick is taken back
};

export const MAX_ID_LENGTH = 64;
