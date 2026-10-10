import type { ModelId } from "@/shared/habit";
import type { Moment } from "@/shared/moment";
import type { OfferResponse } from "@/shared/offer";
import type { ModelOutput } from "./models/model";
import { MODELS } from "./models/registry";

// What Buddy is asked: the person's wish, their reason, the moment they
// picked, and what they already turned down.
export type OfferQuestion = { wish: string; reason: string; moment: Moment; declined: string[] };

// Buddy's offer: one habit in three sizes for one wish at one moment
// (rules/5-offers.md).
export async function offerFor(id: ModelId, question: OfferQuestion, rules: string): Promise<OfferResponse> {
  const text = await MODELS[id].generate(rules, [{ role: "user", content: offerInput(question) }]);
  const output = JSON.parse(text) as ModelOutput;

  // The person's own words can touch something Buddy must not coach
  // (rules S1–S4). Then the answer is a message, not a habit.
  if (output.move === "decline") {
    if (output.message.trim() === "") {
      throw new Error('Move "decline" came without a message');
    }
    return { kind: "decline", message: output.message };
  }

  // Otherwise an offer is exactly one habit. Anything else is a broken
  // answer, and it fails loudly here instead of reaching the app.
  if (output.habits.length !== 1) {
    throw new Error(`Expected one proposed habit, got ${output.habits.length}`);
  }
  return { kind: "offer", habit: output.habits[0], note: output.message };
}

// The text the model receives, exactly as rules/5-offers.md describes it.
// We pick the fields ourselves instead of passing the objects through: the
// model sees what the rules describe, and nothing else.
function offerInput({ wish, reason, moment, declined }: OfferQuestion): string {
  const { what, slot, days } = moment;
  return JSON.stringify({
    wish,
    reason,
    moment: {
      routine: what.kind === "routine" ? what.routine : "own",
      words: what.kind === "own" ? what.words : "",
      slot,
      days,
    },
    declined,
  });
}
