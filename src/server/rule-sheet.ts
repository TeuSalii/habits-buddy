import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Buddy = a language model + the rule sheet in /rules. The rule sheet is
// design material: edit the markdown files, and the next request uses them
// (they're read fresh on every request, no restart needed).

const RULES_DIR = path.join(process.cwd(), "rules");
const SNAPSHOT_DIR = path.join(process.cwd(), "data", "rules");

// An explicit list: the order is the order the model reads the files in,
// and a missing file fails loudly instead of being skipped.
const RULES = ["1-purpose.md", "2-behavior-science.md", "3-voice.md", "4-guardrails.md", "5-offers.md"];

export type RuleSheet = { text: string; version: string };

export async function loadRuleSheet(): Promise<RuleSheet> {
  const parts = await Promise.all(RULES.map((file) => readFile(path.join(RULES_DIR, file), "utf8")));
  const text = parts.join("\n\n");

  // The version is a fingerprint of the text itself: any edit gives a new
  // version automatically, so it can never be forgotten.
  const version = createHash("sha256").update(text).digest("hex").slice(0, 8);

  // Keep a copy of every version, so a logged answer can always be traced
  // back to the exact rules that produced it.
  await mkdir(SNAPSHOT_DIR, { recursive: true });
  await writeFile(path.join(SNAPSHOT_DIR, `${version}.md`), text, { flag: "w" });

  return { text, version };
}
