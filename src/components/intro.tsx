import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";

import { Essence } from "@/components/essence";
import { ExampleCard } from "@/components/example-card";
import { PressScale } from "@/components/press-scale";
import { GREEN, LINE, MIN_TOUCH, WHITE } from "@/components/theme";

// The introduction, shown once to a new person. Two steps:
//
// "why": why a change needs more than wanting it.
// "how": who decides what (the person), what Buddy adds (small, and placed
//   in the day), and one example of both.
//
// It ends in the form where the person says what they want to change, so
// the first thing they do in the app is the thing the app is for.

type Props = {
  onStart: () => void; // to the form: say what you want to change
  onSkip: () => void; // straight to the empty day map
};

const STEPS = ["why", "how"] as const;
type Step = (typeof STEPS)[number];

export function Intro({ onStart, onSkip }: Props) {
  const [step, setStep] = useState<Step>("why");

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.top}>
        <View style={styles.dots} accessible accessibilityLabel={`Step ${STEPS.indexOf(step) + 1} of ${STEPS.length}`}>
          {STEPS.map((each) => (
            <View key={each} style={[styles.dot, each === step && styles.dotActive]} />
          ))}
        </View>
        <PressScale style={styles.textButton} onPress={onSkip} accessibilityRole="button">
          <Text style={styles.link}>Skip intro</Text>
        </PressScale>
      </View>

      {/* key: a new step is a new element, so it slides in. */}
      <Animated.View key={step} entering={FadeInRight.duration(250)} style={styles.step}>
        {step === "why" && (
          <>
            <Essence mood="idle" />
            <Text style={styles.big}>About 40% of what we do each day is habit, not a decision.</Text>
            <Text style={styles.body}>
              That is why wanting a change is rarely enough. It gets easier when the change is
              small, and when it hangs on something you already do.
            </Text>
            <Text style={styles.source}>Source: Wood et al. 2002, cited in Linder et al. 2021</Text>
            <PressScale style={styles.primary} onPress={() => setStep("how")} accessibilityRole="button">
              <Text style={styles.primaryLabel}>Next</Text>
            </PressScale>
          </>
        )}

        {step === "how" && (
          <>
            <Text style={styles.big}>You decide what changes.</Text>
            <Text style={styles.body}>
              Buddy never tells you what to work on. You say what you want and pick a moment of your
              day. Buddy answers with a small way to start, in three sizes.
            </Text>
            <ExampleCard />
            <PressScale style={styles.primary} onPress={onStart} accessibilityRole="button">
              <Text style={styles.primaryLabel}>Say what I want to change</Text>
            </PressScale>
            <PressScale style={styles.textButton} onPress={() => setStep("why")} accessibilityRole="button">
              <Text style={styles.link}>Back</Text>
            </PressScale>
          </>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, gap: 24 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dots: { flexDirection: "row", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: LINE },
  dotActive: { width: 24, backgroundColor: GREEN },
  textButton: { minHeight: MIN_TOUCH, justifyContent: "center", alignSelf: "flex-start" },
  link: { color: GREEN, fontSize: 16, fontWeight: "600" },

  step: { flexGrow: 1, justifyContent: "center", gap: 16 },
  big: { fontSize: 28, lineHeight: 34, fontWeight: "600" },
  body: { fontSize: 16, lineHeight: 24 },
  source: { fontSize: 13, lineHeight: 18, opacity: 0.6 },
  primary: { backgroundColor: GREEN, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  primaryLabel: { color: WHITE, fontSize: 16, fontWeight: "600" },
});
