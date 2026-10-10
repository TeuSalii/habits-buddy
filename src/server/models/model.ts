import type { SizedHabit } from "@/shared/habit";

// What every model has to provide. The rest of the server only knows this
// shape, so swapping Claude for Gemma (or your own fine-tuned model later)
// never touches anything else.

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ModelClient = {
  name: string; // logged with every answer, e.g. "gemma4:12b"
  // Returns the raw JSON text the model produced.
  generate: (rules: string, messages: ChatMessage[]) => Promise<string>;
};

// The two things Buddy can do with a wish (rules/5-offers.md, "Reply").
export type Move = "propose" | "decline";

// The JSON every model must return. Flat on purpose: one object shape is the
// easiest for any model to follow; offer.ts turns it into our typed union.
export type ModelOutput = { move: Move; message: string; habits: SizedHabit[] };

export const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    move: { type: "string", enum: ["propose", "decline"] },
    message: { type: "string" },
    habits: {
      type: "array",
      items: {
        type: "object",
        properties: {
          anchor: { type: "string" },
          minimum: { type: "string" },
          standard: { type: "string" },
          advanced: { type: "string" },
          why: { type: "string" },
        },
        required: ["anchor", "minimum", "standard", "advanced", "why"],
        additionalProperties: false,
      },
    },
  },
  required: ["move", "message", "habits"],
  additionalProperties: false,
} as const;
