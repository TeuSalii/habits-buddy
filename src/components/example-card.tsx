import { StyleSheet, Text, View } from "react-native";

import { SizedHabitView } from "@/components/sized-habit";
import { GREEN, PALE_GREEN } from "@/components/theme";
import { EXAMPLE } from "@/content/example";

// The example as a card: what you give, then what you get.
export function ExampleCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>You say</Text>
      <Text style={styles.given}>{EXAMPLE.wish}</Text>
      <Text style={styles.given}>{EXAMPLE.moment}</Text>
      <Text style={[styles.label, styles.gap]}>Buddy's idea</Text>
      <SizedHabitView habit={EXAMPLE.habit} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: PALE_GREEN, borderRadius: 12, padding: 16, gap: 4 },
  label: { fontSize: 12, fontWeight: "600", color: GREEN, textTransform: "uppercase", letterSpacing: 0.5 },
  gap: { marginTop: 12 },
  given: { fontSize: 16, lineHeight: 22, fontWeight: "600" },
});
