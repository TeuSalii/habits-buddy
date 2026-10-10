import type { ModelId } from "@/shared/habit";
import type { OfferRequest, OfferResponse } from "@/shared/offer";
import type { BuddyState, Change, SavedState } from "@/storage/saved-state";

// Asking Buddy for an offer. It lives outside the screens, because it is
// not about how anything looks: it sends the request and records where
// Buddy stands with the change.

// The model that makes Buddy's offers.
export const OFFER_MODEL: ModelId = "claude";

// Starting many habits at once is how none of them sticks. From this many
// open changes on, the form says so. It does not forbid a further one: how
// much someone takes on is their call.
export const MAX_OPEN_CHANGES = 2;

// A change is open while Buddy is working on it or the person is living
// with its idea or plan.
export function openChangesIn(changes: Change[]): number {
  return changes.filter(({ buddy }) => ["thinking", "offered", "accepted"].includes(buddy.status)).length;
}

// `apply` gets the newest saved state and returns the changed one. Using the
// newest state matters here, because Buddy's answer arrives later, when
// other things may already have changed.
export type Update = (apply: (current: SavedState) => SavedState) => void;

// Sets where Buddy stands with one change. If the change was removed in the
// meantime (an answer can arrive after the person tapped "Remove"), nothing
// happens: there is no change left to update.
export function setBuddy(update: Update, changeId: string, next: BuddyState) {
  update((current) => ({
    ...current,
    changes: current.changes.map((each) => (each.id === changeId ? { ...each, buddy: next } : each)),
  }));
}

export async function askBuddy(update: Update, userId: string, change: Change, declined: string[]) {
  setBuddy(update, change.id, { status: "thinking", declined });
  try {
    const { wish, reason, moment } = change;
    const response = await postOffer({ userId, model: OFFER_MODEL, wish, reason, moment, declined });
    setBuddy(
      update,
      change.id,
      response.kind === "offer"
        ? { status: "offered", habit: response.habit, note: response.note, declined }
        : { status: "outOfScope", message: response.message },
    );
  } catch (error) {
    // The server being unreachable is a normal thing to happen on a phone,
    // so the card says so and offers "Try again". The detail goes to the log.
    console.error(error);
    setBuddy(update, change.id, { status: "failed", declined });
  }
}

async function postOffer(body: OfferRequest): Promise<OfferResponse> {
  const response = await fetch("/api/offer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`/api/offer failed (${response.status}): ${await response.text()}`);
  }
  return response.json();
}
