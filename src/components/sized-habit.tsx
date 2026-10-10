import { StyleSheet, Text, View } from "react-native";

import { SIZE_LABEL } from "@/components/moment-labels";
import { GREEN } from "@/components/theme";
import { SIZES, type Size, type SizedHabit } from "@/shared/habit";

// A habit as the person reads it: when it happens, then the same action in
// three sizes. Used wherever a habit is shown: Buddy's idea, the plan, and
// the examples that explain the app.

// The dot in front of each size grows with it, so the three lines read as
// small, medium, large before a single word is read.
const DOT: Record<Size, number> = { minimum: 8, standard: 12, advanced: 16 };
const DOT_COLUMN = 16; // as wide as the largest dot, so the texts line up

type Props = { habit: Pick<SizedHabit, "anchor" | Size> };

export function SizedHabitView({ habit }: Props) {
  return (
    <View style={styles.habit}>
      <Text style={styles.anchor}>{habit.anchor}</Text>
      {SIZES.map((size) => (
        <View key={size} style={styles.row}>
          <View style={styles.dotColumn}>
            <View style={[styles.dot, { width: DOT[size], height: DOT[size], borderRadius: DOT[size] / 2 }]} />
          </View>
          <View style={styles.text}>
            <Text style={styles.label}>{SIZE_LABEL[size]}</Text>
            {/* "Most days" is the one the eye should land on first. */}
            <Text style={[styles.behavior, size === "standard" && styles.behaviorMain]}>{habit[size]}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  habit: { gap: 8 },
  anchor: { fontSize: 16, lineHeight: 22 },
  row: { flexDirection: "row", gap: 10 },
  // The dot sits in the middle of the label's line.
  dotColumn: { width: DOT_COLUMN, height: 18, alignItems: "center", justifyContent: "center" },
  dot: { backgroundColor: GREEN },
  text: { flex: 1 },
  label: { fontSize: 13, lineHeight: 18, opacity: 0.6 },
  behavior: { fontSize: 16, lineHeight: 22 },
  behaviorMain: { fontWeight: "600" },
});
