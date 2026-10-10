import AsyncStorage from "@react-native-async-storage/async-storage";

import type { SizedHabit } from "@/shared/habit";
import type { Moment } from "@/shared/moment";

// Everything the app remembers, kept on the phone. There is no account and
// no server database: the data stays on this device, under one key, as one
// piece of JSON.
//
// Several people can use the app on one phone (for testing with different
// people in mind). Each has their own SavedState; the Store holds all of
// them and says who is using the app right now. Switching person changes
// only `activeId`, so nobody's data is ever removed by it.

// The key carries a version. A changed data shape needs a new version; the
// app then starts fresh instead of misreading old data.
const KEY = "happy-habits-buddy-general:v1";

// Where Buddy stands with one change. Each state carries exactly the data
// that exists in it: there is a habit only once Buddy has offered one.
export type BuddyState =
  | { status: "thinking"; declined: string[] }
  // note: a support line for harmful habits, usually "".
  | { status: "offered"; habit: SizedHabit; note: string; declined: string[] }
  | { status: "accepted"; habit: SizedHabit; note: string }
  | { status: "declined"; declined: string[] }
  // Buddy read something in the person's own words that it must not coach.
  | { status: "outOfScope"; message: string }
  | { status: "failed"; declined: string[] };

// One thing the person wants to change. It is the unit of the whole app:
// the person's words, the moment they picked, where Buddy stands with it,
// and the days the plan was done.
export type Change = {
  id: string;
  wish: string; // what they want to change, in their own words
  reason: string; // why it matters to them; "" if they left it empty
  moment: Moment;
  buddy: BuddyState;
  doneDates: string[]; // the dates ("2026-10-05") on which the plan was done
};

// What the person decides when they add a change.
export type ChangeDetails = Pick<Change, "wish" | "reason" | "moment">;

export type SavedState = {
  // A random id for this person. It lets the log tell people apart without
  // knowing who anyone is. The name below never leaves the phone.
  userId: string;
  name: string; // what this person is called on this phone; they can change it
  introDone: boolean;
  changes: Change[];
};

export type Store = {
  activeId: string; // the userId of the person using the app right now
  users: SavedState[];
};

// A new person on this phone: nothing known yet, and a new random id.
export function newUser(name: string): SavedState {
  return { userId: randomId(), name, introDone: false, changes: [] };
}

export function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// The person using the app right now. The Store always has one.
export function activeUser(store: Store): SavedState {
  const user = store.users.find((each) => each.userId === store.activeId);
  if (user === undefined) throw new Error(`No stored user with the id ${store.activeId}`);
  return user;
}

export async function loadStore(): Promise<Store> {
  const text = await AsyncStorage.getItem(KEY);
  // Nothing stored: this is the very first start.
  if (text === null) {
    const first = newUser("User 1");
    return { activeId: first.userId, users: [first] };
  }
  const store = JSON.parse(text) as Store;
  return { ...store, users: store.users.map(settle) };
}

export async function saveStore(store: Store): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(store));
}

// A request that was running when the app closed never got its answer.
// It comes back as "could not be reached", with "Try again".
function settle(user: SavedState): SavedState {
  return {
    ...user,
    changes: user.changes.map((change) =>
      change.buddy.status === "thinking"
        ? { ...change, buddy: { status: "failed", declined: change.buddy.declined } }
        : change,
    ),
  };
}
