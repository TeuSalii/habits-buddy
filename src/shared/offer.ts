import type { ModelId, SizedHabit } from "@/shared/habit";
import type { Moment } from "@/shared/moment";

// The contract for Buddy's offer: the app sends what the person wants to
// change and the moment they picked; the server answers with one habit.

export type OfferRequest = {
  userId: string; // the random id of this person on this phone, for the log
  model: ModelId;
  wish: string; // what the person wants to change, in their own words
  reason: string; // why it matters to them; "" if they left it empty
  moment: Moment;
  // The standard size of every idea the person already turned down for
  // this change, so Buddy offers something different.
  declined: string[];
};

export const MAX_WISH_LENGTH = 200;
export const MAX_REASON_LENGTH = 200;

// Buddy either offers a habit, or says that this is not something it can
// help with (the scope rules in rules/4-guardrails.md).
export type OfferResponse =
  // note: usually ""; it carries a support line for harmful habits (rules A1–A3).
  | { kind: "offer"; habit: SizedHabit; note: string }
  | { kind: "decline"; message: string };

// After this many "not for me", Buddy stops offering for this change.
export const MAX_DECLINED = 5;
