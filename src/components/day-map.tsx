import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { type Update, askBuddy, openChangesIn, setBuddy } from "@/client/ask-buddy";
import { ChangeCard } from "@/components/change-card";
import { ChangeForm } from "@/components/change-form";
import { Essence } from "@/components/essence";
import { ExampleCard } from "@/components/example-card";
import { SLOT_LABEL } from "@/components/moment-labels";
import { PressScale } from "@/components/press-scale";
import { GREEN, LINE, MIN_TOUCH, WHITE } from "@/components/theme";
import type { CheckinRequest } from "@/shared/checkin";
import { SLOTS } from "@/shared/moment";
import { datesOfWeek, toDateText } from "@/shared/week";
import { type Change, type ChangeDetails, type SavedState, randomId } from "@/storage/saved-state";

// The day map: the person's changes, each at the part of the day where it
// hangs. A change starts with the person's own words, gets one idea from
// Buddy, and an accepted plan can be ticked off day by day.
//
// This component does not own the data: it receives the saved state and
// asks for changes through `update`. The owner (the home screen) stores
// every change on the phone.

type Props = {
  state: SavedState;
  update: Update;
  adding: boolean; // whether the "A change of your own" form is open
  setAdding: (next: boolean) => void;
  onChangeUser: () => void; // opens the list of people on this phone
};

export function DayMap({ state, update, adding, setAdding, onChangeUser }: Props) {
  const { changes, userId, name } = state;

  const now = new Date();
  const today = toDateText(now);
  const week = datesOfWeek(now);

  // Changes one change, found by its id, in the newest saved state.
  function updateChange(id: string, apply: (change: Change) => Change) {
    update((current) => ({
      ...current,
      changes: current.changes.map((each) => (each.id === id ? apply(each) : each)),
    }));
  }

  function add(details: ChangeDetails) {
    const change: Change = {
      ...details,
      id: randomId(),
      buddy: { status: "thinking", declined: [] },
      doneDates: [],
    };
    update((current) => ({ ...current, changes: [...current.changes, change] }));
    setAdding(false);
    // The payoff comes right away: Buddy looks at the new change.
    askBuddy(update, userId, change, []);
  }

  function remove(id: string) {
    update((current) => ({ ...current, changes: current.changes.filter((each) => each.id !== id) }));
  }

  function accept(change: Change) {
    if (change.buddy.status !== "offered") return;
    setBuddy(update, change.id, { status: "accepted", habit: change.buddy.habit, note: change.buddy.note });
  }

  function decline(change: Change) {
    if (change.buddy.status !== "offered") return;
    // Remember what was turned down, so the next idea is a different one.
    const declined = [...change.buddy.declined, change.buddy.habit.standard];
    setBuddy(update, change.id, { status: "declined", declined });
  }

  // "Another idea" or "Try again".
  function askAgain(change: Change) {
    if (change.buddy.status !== "declined" && change.buddy.status !== "failed") return;
    askBuddy(update, userId, change, change.buddy.declined);
  }

  // Ticks or un-ticks one day of a plan. The phone is the record the person
  // sees; the server log is for us, to learn which plans hold.
  function toggleDay(change: Change, date: string) {
    if (change.buddy.status !== "accepted") return;
    const done = !change.doneDates.includes(date);

    updateChange(change.id, (latest) => ({
      ...latest,
      doneDates: done ? [...latest.doneDates, date] : latest.doneDates.filter((each) => each !== date),
    }));
    // If the log cannot be reached, the tick still counts on the phone.
    // That line is then missing in the log; we don't send it again later.
    postCheckin({ userId, changeId: change.id, habit: change.buddy.habit, date, done }).catch(console.error);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Who is using the app right now, and the way to become someone
          else. It is here for testing with different people in mind. */}
      <PressScale
        style={styles.user}
        onPress={onChangeUser}
        accessibilityRole="button"
        accessibilityLabel={`${name}. Change user`}
      >
        <Text style={styles.userName} numberOfLines={1}>
          👤 {name}
        </Text>
        <Text style={styles.link}>Change user</Text>
      </PressScale>

      {changes.length === 0 ? (
        <>
          {/* Buddy is present on the empty map: this is who answers. */}
          <Essence mood="idle" />
          <Text style={styles.title}>Your day, your change</Text>
          <Text style={styles.body}>
            Say one thing you would like to change and pick a moment of your day. Buddy answers
            with a small way to start.
          </Text>
          <ExampleCard />
        </>
      ) : (
        // All four parts of the day are always shown, also the empty ones:
        // that is what makes this a map of the day and not just a list.
        SLOTS.map((slot) => (
          // layout: when a card appears, grows or leaves, the rest glides to its new place.
          <Animated.View key={slot} style={styles.slot} layout={LinearTransition}>
            <Text style={styles.slotLabel}>{SLOT_LABEL[slot]}</Text>
            <View style={styles.line}>
              {changes
                .filter((change) => change.moment.slot === slot)
                .map((change) => (
                  <ChangeCard
                    key={change.id}
                    change={change}
                    week={week}
                    today={today}
                    onToggleDay={(date) => toggleDay(change, date)}
                    onAccept={() => accept(change)}
                    onDecline={() => decline(change)}
                    onAsk={() => askAgain(change)}
                    onRemove={() => remove(change.id)}
                  />
                ))}
            </View>
          </Animated.View>
        ))
      )}

      <Animated.View layout={LinearTransition}>
        <PressScale style={styles.button} onPress={() => setAdding(true)} accessibilityRole="button">
          <Text style={styles.buttonLabel}>{changes.length === 0 ? "Say what I want to change" : "Add a change"}</Text>
        </PressScale>
      </Animated.View>

      {/* A Modal covers the screen and closes with Android's back gesture
          (onRequestClose). While it is hidden, the form inside does not exist,
          so every time it opens the form starts empty. */}
      <Modal visible={adding} animationType="slide" onRequestClose={() => setAdding(false)}>
        <SafeAreaView style={styles.modal}>
          <ChangeForm openChanges={openChangesIn(changes)} onSave={add} onCancel={() => setAdding(false)} />
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

async function postCheckin(body: CheckinRequest) {
  const response = await fetch("/api/checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`/api/checkin failed (${response.status}): ${await response.text()}`);
  }
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: "600" },
  body: { fontSize: 16, lineHeight: 24 },
  slot: { gap: 8 },
  slotLabel: { fontSize: 14, fontWeight: "600", opacity: 0.6 },
  // The vertical line down the left edge is the timeline.
  line: { borderLeftWidth: 2, borderLeftColor: LINE, paddingLeft: 12, gap: 8, minHeight: 24 },
  button: { backgroundColor: GREEN, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 12 },
  buttonLabel: { color: WHITE, fontSize: 16, fontWeight: "600" },
  user: { minHeight: MIN_TOUCH, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  userName: { fontSize: 16, fontWeight: "600", flexShrink: 1 },
  link: { color: GREEN, fontSize: 16, fontWeight: "600" },
  modal: { flex: 1, backgroundColor: WHITE },
});
