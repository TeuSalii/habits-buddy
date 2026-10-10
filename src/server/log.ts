import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

import type { SizedHabit } from "@/shared/habit";
import type { Moment } from "@/shared/moment";
import type { OfferResponse } from "@/shared/offer";

// Every offer and every check-off becomes one line of JSON in data/log.jsonl.
// This file is the training data. It holds what people type, so it's
// git-ignored and stays on this machine. Works in development only
// (hosted servers have no writable disk).
const LOG_DIR = path.join(process.cwd(), "data");
const LOG_FILE = path.join(LOG_DIR, "log.jsonl");

export type LogEvent =
  | {
      type: "offer";
      at: string;
      userId: string;
      model: string;
      rulesVersion: string; // matches data/rules/<rulesVersion>.md
      wish: string;
      reason: string;
      moment: Moment;
      declined: string[];
      result: OfferResponse;
    }
  // A check-off under a plan: this person did (done) or un-ticked (not done)
  // this habit on this day.
  | {
      type: "checkin";
      at: string;
      userId: string;
      changeId: string;
      habit: SizedHabit;
      date: string;
      done: boolean;
    };

export async function appendLog(event: LogEvent) {
  await mkdir(LOG_DIR, { recursive: true });
  await appendFile(LOG_FILE, JSON.stringify(event) + "\n");
}
