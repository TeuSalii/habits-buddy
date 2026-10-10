import { useEffect, useState } from "react";
import { Modal, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DayMap } from "@/components/day-map";
import { Intro } from "@/components/intro";
import { WHITE } from "@/components/theme";
import { Users } from "@/components/users";
import { type SavedState, type Store, activeUser, loadStore, newUser, saveStore } from "@/storage/saved-state";

// Home screen. It owns everything the app remembers: it loads it from the
// phone when the app opens, hands the person using the app to the screen
// that is showing, and stores everything again after every change.
export default function MyDay() {
  // null: still reading from the phone.
  const [store, setStore] = useState<Store | null>(null);
  // The "A change of your own" form. It lives here, because two places open
  // it: the button on the map and the last step of the introduction.
  const [adding, setAdding] = useState(false);
  // The people on this phone, opened from the top of the day map.
  const [usersOpen, setUsersOpen] = useState(false);

  // Runs once, when the screen appears. Reading from the phone takes a
  // moment, so the result arrives later and is put into the state then.
  useEffect(() => {
    loadStore().then(setStore);
  }, []);

  // Runs after every change: write everything to the phone.
  useEffect(() => {
    if (store !== null) saveStore(store);
  }, [store]);

  if (store === null) return null;
  // `state` is the person using the app right now.
  const state = activeUser(store);
  const { userId } = state;

  // Changes this person's data. It is tied to their id, not to "whoever is
  // active": an answer from Buddy can arrive after a switch to someone
  // else, and it still has to land with the person who asked.
  function update(apply: (current: SavedState) => SavedState) {
    setStore((current) =>
      current === null
        ? current
        : { ...current, users: current.users.map((each) => (each.userId === userId ? apply(each) : each)) },
    );
  }

  function finishIntro() {
    update((current) => ({ ...current, introDone: true }));
  }

  // Becoming someone else on this phone. Only who is active changes; the
  // person who was active keeps everything and can be picked again.
  function switchTo(id: string) {
    setUsersOpen(false);
    setAdding(false);
    setStore((current) => (current === null ? current : { ...current, activeId: id }));
  }

  // A new person: added next to the others and made active. They have not
  // seen the introduction, so that is what shows next.
  function addUser() {
    setUsersOpen(false);
    setAdding(false);
    setStore((current) => {
      if (current === null) return current;
      const added = newUser(`User ${current.users.length + 1}`);
      return { activeId: added.userId, users: [...current.users, added] };
    });
  }

  if (!state.introDone) {
    return (
      // key: for a new person the introduction starts from its beginning.
      <Intro
        key={userId}
        // The introduction ends where the app begins: saying what you want to change.
        onStart={() => {
          setAdding(true);
          finishIntro();
        }}
        onSkip={finishIntro}
      />
    );
  }

  return (
    <>
      <DayMap
        key={userId}
        state={state}
        update={update}
        adding={adding}
        setAdding={setAdding}
        onChangeUser={() => setUsersOpen(true)}
      />

      <Modal visible={usersOpen} animationType="slide" onRequestClose={() => setUsersOpen(false)}>
        <SafeAreaView style={styles.modal}>
          <Users
            users={store.users}
            activeId={store.activeId}
            onRename={(name) => update((current) => ({ ...current, name }))}
            onSwitch={switchTo}
            onAdd={addUser}
            onClose={() => setUsersOpen(false)}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1, backgroundColor: WHITE },
});
