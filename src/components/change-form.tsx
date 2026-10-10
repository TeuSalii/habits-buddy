import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeInRight, FlipInEasyX } from "react-native-reanimated";

import { MAX_OPEN_CHANGES } from "@/client/ask-buddy";
import {
  DAY_GROUPS,
  DAY_LABEL,
  OWN_MOMENT_ICON,
  ROUTINE_ICON,
  ROUTINE_LABEL,
  SLOT_ICON,
  SLOT_LABEL,
  SLOT_PHRASE,
  daysPhrase,
  groupOf,
  whatIcon,
  whatLabel,
} from "@/components/moment-labels";
import { PressScale } from "@/components/press-scale";
import { GREEN, LINE, MIN_TOUCH, PALE_GREEN, PLACEHOLDER, WHITE } from "@/components/theme";
import {
  DAYS,
  type Day,
  MAX_MOMENT_WORDS,
  type MomentWhat,
  ROUTINES,
  type Routine,
  SLOTS,
  type Slot,
} from "@/shared/moment";
import { MAX_REASON_LENGTH, MAX_WISH_LENGTH } from "@/shared/offer";
import type { ChangeDetails } from "@/storage/saved-state";

// The form for one change. It asks one question at a time, in the order a
// change comes into being: what the person wants, why it matters to them,
// and where in their day it could hang.
//
// Every answer fills a part of a sentence at the top, so the person always
// sees what they are building. Tapping a part goes back to its question.

type Props = {
  openChanges: number; // how many changes the person already has going
  onSave: (details: ChangeDetails) => void;
  onCancel: () => void;
};

const STEPS = ["wish", "reason", "what", "slot", "days"] as const;
type Step = (typeof STEPS)[number];

const QUESTION: Record<Step, { title: string; hint: string }> = {
  wish: {
    title: "What would you like to change?",
    hint: "In your own words. It is your choice, and Buddy will not judge it.",
  },
  reason: {
    title: "Why does this matter to you?",
    hint: "Your own reason is what carries a change. You can leave this empty.",
  },
  what: {
    title: "Where in your day could it fit?",
    hint: "Pick something you already do. The change will hang on it.",
  },
  slot: { title: "When in the day is that?", hint: "Roughly is enough." },
  days: { title: "On which days?", hint: "Tap a shortcut, or pick single days." },
};

// Two questions for someone who wants a change but cannot name it yet. They
// ask about the person's own day and suggest nothing: a list of goals to
// pick from would already say what is worth changing.
const IF_UNSURE = ["What would you like more of in your days?", "What would you like less of?"];

// Some routines have an obvious part of the day, so we fill it in and skip
// the question. The person can still change it by tapping it in the sentence.
const USUAL_SLOT: Partial<Record<Routine, Slot>> = {
  waking_up: "morning",
  breakfast: "morning",
  lunch: "midday",
  dinner: "evening",
  going_to_bed: "evening",
};

export function ChangeForm({ openChanges, onSave, onCancel }: Props) {
  const [step, setStep] = useState<Step>("wish");
  const [wish, setWish] = useState("");
  const [unsure, setUnsure] = useState(false);
  const [reason, setReason] = useState("");
  const [what, setWhat] = useState<MomentWhat | null>(null);
  // The field for a moment in the person's own words: closed until they ask
  // for it, then holding what they type.
  const [ownWords, setOwnWords] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [days, setDays] = useState<Day[]>([]);

  // A different routine is a different moment, so "when" starts again:
  // either with the usual part of the day, or as an open question.
  function chooseRoutine(routine: Routine) {
    const usual = USUAL_SLOT[routine] ?? null;
    setWhat({ kind: "routine", routine });
    setOwnWords(null);
    setSlot(usual);
    setStep(usual === null ? "slot" : "days");
  }

  // Own words say nothing about the part of the day, so "when" is asked.
  function chooseOwnWords(words: string) {
    setWhat({ kind: "own", words });
    setSlot(null);
    setStep("slot");
  }

  function toggleDay(day: Day) {
    setDays((current) => (current.includes(day) ? current.filter((other) => other !== day) : [...current, day]));
  }

  // The change exists only once everything but the reason is answered.
  // Until then it is null, and the last button stays disabled.
  const details: ChangeDetails | null =
    wish.trim() !== "" && what !== null && slot !== null && days.length > 0
      ? { wish: wish.trim(), reason: reason.trim(), moment: { what, slot, days } }
      : null;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>A change of your own</Text>

      {/* The sentence being built. The wish appears in it once the person
          has moved on: while they type, it would flip with every letter. */}
      <View style={styles.sentence}>
        <SentencePart
          text={step === "wish" || wish.trim() === "" ? null : wish.trim()}
          placeholder="what?"
          active={step === "wish" || step === "reason"}
          onPress={() => setStep("wish")}
        />
        <SentencePart
          text={what === null ? null : `${whatIcon(what)} ${whatLabel(what)}`}
          placeholder="at which moment?"
          active={step === "what"}
          onPress={() => setStep("what")}
        />
        <SentencePart
          text={slot === null ? null : SLOT_PHRASE[slot]}
          placeholder="when?"
          active={step === "slot"}
          onPress={() => setStep("slot")}
        />
        <SentencePart
          text={days.length === 0 ? null : daysPhrase(days)}
          placeholder="which days?"
          active={step === "days"}
          onPress={() => setStep("days")}
        />
      </View>

      <View style={styles.dots} accessible accessibilityLabel={`Question ${STEPS.indexOf(step) + 1} of ${STEPS.length}`}>
        {STEPS.map((each) => (
          <View key={each} style={[styles.dot, each === step && styles.dotActive]} />
        ))}
      </View>

      {/* key={step}: a new question is a new element, so it slides in. */}
      <Animated.View key={step} entering={FadeInRight.duration(220)} style={styles.question}>
        <Text style={styles.questionTitle}>{QUESTION[step].title}</Text>
        <Text style={styles.hint}>{QUESTION[step].hint}</Text>

        {step === "wish" && (
          <>
            {openChanges >= MAX_OPEN_CHANGES && (
              <Text style={styles.note}>
                You already have {openChanges} changes going. Starting few at a time makes each one
                easier to keep. Whether one more fits is your call.
              </Text>
            )}
            <TextInput
              style={[styles.input, styles.inputTall]}
              value={wish}
              onChangeText={setWish}
              placeholder="I want to …"
              placeholderTextColor={PLACEHOLDER}
              maxLength={MAX_WISH_LENGTH}
              multiline
              accessibilityLabel="What you would like to change"
            />
            {unsure ? (
              <View style={styles.unsure}>
                <Text style={styles.unsureIntro}>Maybe one of these opens something:</Text>
                {IF_UNSURE.map((each) => (
                  <Text key={each} style={styles.unsureQuestion}>
                    {each}
                  </Text>
                ))}
                <Text style={styles.unsureIntro}>Whatever comes to mind first is a good place to start.</Text>
              </View>
            ) : (
              <PressScale style={styles.textButton} onPress={() => setUnsure(true)} accessibilityRole="button">
                <Text style={styles.link}>I'm not sure yet</Text>
              </PressScale>
            )}
            <Next disabled={wish.trim() === ""} onPress={() => setStep("reason")} />
          </>
        )}

        {step === "reason" && (
          <>
            <TextInput
              style={[styles.input, styles.inputTall]}
              value={reason}
              onChangeText={setReason}
              placeholder="Because …"
              placeholderTextColor={PLACEHOLDER}
              maxLength={MAX_REASON_LENGTH}
              multiline
              accessibilityLabel="Why this matters to you"
            />
            <Next disabled={false} onPress={() => setStep("what")} />
          </>
        )}

        {step === "what" && (
          <>
            <View style={styles.options}>
              {ROUTINES.map((routine) => (
                <Option
                  key={routine}
                  icon={ROUTINE_ICON[routine]}
                  label={ROUTINE_LABEL[routine]}
                  selected={ownWords === null && what?.kind === "routine" && what.routine === routine}
                  onPress={() => chooseRoutine(routine)}
                />
              ))}
              {/* The list never fits everyone, so the person can always say it their way. */}
              <Option
                icon={OWN_MOMENT_ICON}
                label="Another moment"
                selected={ownWords !== null}
                onPress={() => setOwnWords(what?.kind === "own" ? what.words : "")}
              />
            </View>
            {ownWords !== null && (
              <>
                <TextInput
                  style={styles.input}
                  value={ownWords}
                  onChangeText={setOwnWords}
                  placeholder="Something you already do, like making coffee"
                  placeholderTextColor={PLACEHOLDER}
                  maxLength={MAX_MOMENT_WORDS}
                  autoFocus
                  accessibilityLabel="The moment in your own words"
                />
                <Next disabled={ownWords.trim() === ""} onPress={() => chooseOwnWords(ownWords.trim())} />
              </>
            )}
          </>
        )}

        {step === "slot" && (
          <View style={styles.options}>
            {SLOTS.map((each) => (
              <Option
                key={each}
                icon={SLOT_ICON[each]}
                label={SLOT_LABEL[each]}
                selected={each === slot}
                onPress={() => {
                  setSlot(each);
                  setStep("days");
                }}
              />
            ))}
          </View>
        )}

        {step === "days" && (
          <>
            <View style={styles.chips}>
              {DAY_GROUPS.map((group) => (
                <Chip
                  key={group.label}
                  label={group.label}
                  selected={groupOf(days) === group}
                  onPress={() => setDays([...group.days])}
                />
              ))}
            </View>
            <View style={styles.chips}>
              {DAYS.map((day) => (
                <Chip key={day} label={DAY_LABEL[day]} selected={days.includes(day)} onPress={() => toggleDay(day)} />
              ))}
            </View>
            <PressScale
              style={[styles.button, details === null && styles.buttonDisabled]}
              onPress={() => details !== null && onSave(details)}
              disabled={details === null}
              accessibilityRole="button"
            >
              <Text style={styles.buttonLabel}>Ask Buddy for a small start</Text>
            </PressScale>
          </>
        )}
      </Animated.View>

      <PressScale style={styles.cancel} onPress={onCancel} accessibilityRole="button">
        <Text style={styles.link}>Cancel</Text>
      </PressScale>
    </ScrollView>
  );
}

function Next({ disabled, onPress }: { disabled: boolean; onPress: () => void }) {
  return (
    <PressScale
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
    >
      <Text style={styles.buttonLabel}>Next</Text>
    </PressScale>
  );
}

// One part of the sentence. Empty: a dashed placeholder. Filled: the answer,
// which flips in like a tile on a departure board whenever it changes
// (key={text} makes a changed answer a new element, so it animates again).
type SentencePartProps = {
  text: string | null;
  placeholder: string;
  active: boolean;
  onPress: () => void;
};

function SentencePart({ text, placeholder, active, onPress }: SentencePartProps) {
  return (
    <PressScale
      style={[styles.part, text !== null && styles.partFilled, active && styles.partActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={text === null ? `Answer ${placeholder}` : `Change ${text}`}
    >
      {text === null ? (
        <Text style={styles.partPlaceholder}>{placeholder}</Text>
      ) : (
        // Two lines at most: a long wish must not push the question off the screen.
        <Animated.Text key={text} entering={FlipInEasyX.duration(350)} style={styles.partText} numberOfLines={2}>
          {text}
        </Animated.Text>
      )}
    </PressScale>
  );
}

// One answer to a "pick one" question, as a large card with an icon.
type OptionProps = { icon: string; label: string; selected: boolean; onPress: () => void };

function Option({ icon, label, selected, onPress }: OptionProps) {
  return (
    <PressScale
      style={[styles.option, selected && styles.optionSelected]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      aria-selected={selected}
    >
      <Text style={styles.optionIcon}>{icon}</Text>
      <Text style={[styles.optionLabel, selected && styles.selectedLabel]}>{label}</Text>
    </PressScale>
  );
}

// A small on/off pill, used for the days.
type ChipProps = { label: string; selected: boolean; onPress: () => void };

function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <PressScale
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      accessibilityRole="button"
      aria-selected={selected}
    >
      <Text style={[styles.chipLabel, selected && styles.selectedLabel]}>{label}</Text>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: "600" },

  sentence: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  part: { minHeight: MIN_TOUCH, maxWidth: "100%", justifyContent: "center", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed", borderColor: LINE },
  partFilled: { backgroundColor: PALE_GREEN, borderStyle: "solid", borderColor: PALE_GREEN },
  partActive: { borderStyle: "solid", borderColor: GREEN },
  partPlaceholder: { fontSize: 16, opacity: 0.5 },
  partText: { fontSize: 16, fontWeight: "600", color: GREEN },

  dots: { flexDirection: "row", gap: 6, marginTop: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: LINE },
  dotActive: { width: 24, backgroundColor: GREEN },

  question: { gap: 12 },
  questionTitle: { fontSize: 20, fontWeight: "600" },
  hint: { fontSize: 14, lineHeight: 20, opacity: 0.6, marginTop: -8 },
  note: { fontSize: 14, lineHeight: 20, backgroundColor: PALE_GREEN, borderRadius: 12, padding: 12 },

  input: { minHeight: MIN_TOUCH, borderWidth: 1, borderColor: LINE, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, backgroundColor: WHITE },
  // Room for a sentence or two; the text starts at the top, as on paper.
  inputTall: { minHeight: 96, textAlignVertical: "top" },

  unsure: { gap: 4 },
  unsureIntro: { fontSize: 14, lineHeight: 20, opacity: 0.6 },
  unsureQuestion: { fontSize: 16, lineHeight: 24, fontWeight: "600" },

  options: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
  option: { width: "48%", minHeight: 88, justifyContent: "center", gap: 4, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: LINE, backgroundColor: WHITE },
  optionSelected: { backgroundColor: GREEN, borderColor: GREEN },
  optionIcon: { fontSize: 28 },
  optionLabel: { fontSize: 16, fontWeight: "600" },
  selectedLabel: { color: WHITE },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { minHeight: MIN_TOUCH, minWidth: 56, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, borderRadius: 24, borderWidth: 1, borderColor: LINE },
  chipSelected: { backgroundColor: GREEN, borderColor: GREEN },
  chipLabel: { fontSize: 16, fontWeight: "600" },

  button: { backgroundColor: GREEN, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 12 },
  buttonDisabled: { opacity: 0.4 },
  buttonLabel: { color: WHITE, fontSize: 16, fontWeight: "600" },
  textButton: { minHeight: MIN_TOUCH, justifyContent: "center", alignSelf: "flex-start" },
  cancel: { minHeight: MIN_TOUCH, alignItems: "center", justifyContent: "center", marginTop: 8 },
  link: { color: GREEN, fontSize: 16, fontWeight: "600" },
});
