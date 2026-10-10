import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from "react-native-reanimated";

import { DAY_LABEL, describeDays, whatIcon, whatLabel } from "@/components/moment-labels";
import { PressScale } from "@/components/press-scale";
import { SizedHabitView } from "@/components/sized-habit";
import { GREEN, LINE, MIN_TOUCH, WHITE } from "@/components/theme";
import { DAYS, type Day } from "@/shared/moment";
import { MAX_DECLINED } from "@/shared/offer";
import type { Change } from "@/storage/saved-state";

// One change on the day map: the moment it hangs on, the person's own
// words, and below them where Buddy stands with it.

type Props = {
  change: Change;
  // For the check-offs under a plan:
  week: Record<Day, string>; // the date of each weekday in the current week
  today: string;
  onToggleDay: (date: string) => void;

  onAccept: () => void;
  onDecline: () => void;
  onAsk: () => void; // another idea, or try again
  onRemove: () => void;
};

export function ChangeCard(props: Props) {
  const { change, onRemove } = props;
  const { moment, wish } = change;
  return (
    <Animated.View
      style={styles.card}
      entering={FadeInDown.duration(300)}
      exiting={FadeOut.duration(150)}
      layout={LinearTransition}
    >
      <View style={styles.moment}>
        <Text style={styles.icon}>{whatIcon(moment.what)}</Text>
        <View style={styles.momentText}>
          <Text style={styles.title}>{whatLabel(moment.what)}</Text>
          <Text style={styles.detail}>{describeDays(moment.days)}</Text>
        </View>
        <PressScale
          style={styles.remove}
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Remove the change: ${wish}`}
        >
          <Text style={styles.link}>Remove</Text>
        </PressScale>
      </View>

      {/* The person's words stay on the card exactly as they wrote them:
          the change is theirs, Buddy's part comes below. */}
      <View style={styles.wish}>
        <Text style={styles.label}>Your change</Text>
        <Text style={styles.wishText}>{wish}</Text>
      </View>

      {/* key: a new state is a new element, so it fades in.
          Live region: a screen reader announces Buddy's idea when it arrives. */}
      <Animated.View
        key={change.buddy.status}
        entering={FadeIn.duration(300)}
        style={styles.buddy}
        accessibilityLiveRegion="polite"
      >
        <Buddy {...props} />
      </Animated.View>
    </Animated.View>
  );
}

function Buddy({ change, week, today, onToggleDay, onAccept, onDecline, onAsk }: Props) {
  const { buddy, moment, reason, doneDates } = change;

  switch (buddy.status) {
    case "thinking":
      return (
        <View style={styles.thinking}>
          <ActivityIndicator color={GREEN} />
          <Text style={styles.note}>Buddy is looking for a small way to start</Text>
        </View>
      );

    case "offered":
      return (
        <>
          <Text style={styles.label}>Buddy's idea</Text>
          <SizedHabitView habit={buddy.habit} />
          <Text style={styles.note}>{buddy.habit.why}</Text>
          <Support note={buddy.note} />
          <View style={styles.actions}>
            <PressScale style={[styles.action, styles.accept]} onPress={onAccept} accessibilityRole="button">
              <Text style={styles.acceptLabel}>I'll try it</Text>
            </PressScale>
            <PressScale style={styles.action} onPress={onDecline} accessibilityRole="button">
              <Text style={styles.link}>Not for me</Text>
            </PressScale>
          </View>
        </>
      );

    case "accepted":
      return (
        <>
          <Text style={styles.label}>Your plan</Text>
          <SizedHabitView habit={buddy.habit} />
          {/* The person's own reason, in their words. It is what carries the
              change, so it stays next to the plan instead of in a reminder. */}
          {reason !== "" && (
            <Text style={styles.note}>
              <Text style={styles.noteStrong}>Your reason: </Text>
              {reason}
            </Text>
          )}
          <Support note={buddy.note} />
          {/* A plain record of the days it happened. No streaks and no praise:
              a missed day is an empty box, nothing more. */}
          <Text style={styles.note}>This week: tap the days you did it. Any size counts.</Text>
          <View style={styles.checks}>
            {DAYS.filter((day) => moment.days.includes(day)).map((day) => {
              const date = week[day];
              const done = doneDates.includes(date);
              const notYet = date > today; // a day that has not come cannot be ticked
              return (
                <PressScale
                  key={day}
                  style={[styles.check, done && styles.checkDone, notYet && styles.checkNotYet]}
                  onPress={() => onToggleDay(date)}
                  disabled={notYet}
                  accessibilityRole="checkbox"
                  aria-checked={done}
                  accessibilityLabel={DAY_LABEL[day]}
                >
                  {/* The tick has its own line, so a box keeps its width when
                      it is ticked and the row never jumps. It is a mark and
                      not only a color, so it reads without seeing green. */}
                  <Text style={[styles.checkLabel, done && styles.checkLabelDone]}>{done ? "✓" : " "}</Text>
                  <Text style={[styles.checkLabel, done && styles.checkLabelDone]}>{DAY_LABEL[day]}</Text>
                </PressScale>
              );
            })}
          </View>
        </>
      );

    case "declined":
      // After MAX_DECLINED ideas the server won't offer more for this change.
      if (buddy.declined.length >= MAX_DECLINED) {
        return <Text style={styles.note}>That is all Buddy has for this change for now.</Text>;
      }
      return (
        <>
          <Text style={styles.note}>No problem. It has to fit your day.</Text>
          <PressScale style={styles.action} onPress={onAsk} accessibilityRole="button">
            <Text style={styles.link}>Another idea</Text>
          </PressScale>
        </>
      );

    case "outOfScope":
      return <Text style={styles.message}>{buddy.message}</Text>;

    case "failed":
      return (
        <>
          <Text style={styles.note}>Buddy could not be reached.</Text>
          <PressScale style={styles.action} onPress={onAsk} accessibilityRole="button">
            <Text style={styles.link}>Try again</Text>
          </PressScale>
        </>
      );
  }
}

// Where to find free support, for habits such as smoking or drinking
// (rules A1–A3). Empty for everything else.
function Support({ note }: { note: string }) {
  if (note === "") return null;
  return <Text style={styles.support}>{note}</Text>;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: LINE, borderRadius: 12, backgroundColor: WHITE },
  moment: { flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: 16 },
  icon: { fontSize: 24 },
  momentText: { flex: 1, paddingVertical: 12, gap: 2 },
  title: { fontSize: 16, fontWeight: "600" },
  detail: { fontSize: 14, opacity: 0.6 },
  remove: { minHeight: MIN_TOUCH, justifyContent: "center", paddingHorizontal: 16 },
  link: { color: GREEN, fontSize: 14, fontWeight: "600" },

  wish: { borderTopWidth: 1, borderTopColor: LINE, padding: 16, gap: 4 },
  wishText: { fontSize: 16, lineHeight: 22, fontWeight: "600" },

  buddy: { borderTopWidth: 1, borderTopColor: LINE, padding: 16, gap: 8 },
  label: { fontSize: 12, fontWeight: "600", color: GREEN, textTransform: "uppercase", letterSpacing: 0.5 },
  note: { fontSize: 14, lineHeight: 20, opacity: 0.7, flexShrink: 1 },
  noteStrong: { fontWeight: "600" },
  support: { fontSize: 14, lineHeight: 20 },
  message: { fontSize: 16, lineHeight: 22 },
  thinking: { flexDirection: "row", alignItems: "center", gap: 12 },
  actions: { flexDirection: "row", gap: 8, marginTop: 4 },
  action: { minHeight: MIN_TOUCH, justifyContent: "center", alignItems: "center", paddingHorizontal: 16, borderRadius: 12, alignSelf: "flex-start" },
  accept: { backgroundColor: GREEN },
  acceptLabel: { color: WHITE, fontSize: 14, fontWeight: "600" },

  checks: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  // One fixed width, narrow enough that the five weekdays fit on one row of a phone.
  check: { height: 56, width: MIN_TOUCH, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1, borderColor: LINE },
  checkDone: { backgroundColor: GREEN, borderColor: GREEN },
  checkNotYet: { opacity: 0.4 },
  checkLabel: { fontSize: 14, lineHeight: 18, fontWeight: "600" },
  checkLabelDone: { color: WHITE },
});
