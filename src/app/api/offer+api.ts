import { appendLog } from "@/server/log";
import { MODELS } from "@/server/models/registry";
import { offerFor } from "@/server/offer";
import { loadRuleSheet } from "@/server/rule-sheet";
import { isFilledText, isId, isMoment, isText, isTextList } from "@/server/validate";
import { MODEL_IDS } from "@/shared/habit";
import { MAX_DECLINED, MAX_REASON_LENGTH, MAX_WISH_LENGTH, type OfferRequest } from "@/shared/offer";

// POST /api/offer  body: OfferRequest  →  OfferResponse
// Runs on the server only. The app never sees the API key.
export async function POST(request: Request) {
  const { userId, model, wish, reason, moment, declined } = (await request.json()) as OfferRequest;

  if (!isId(userId)) {
    return Response.json({ error: "userId must be a short text" }, { status: 400 });
  }
  if (!MODEL_IDS.includes(model)) {
    return Response.json({ error: `model must be one of: ${MODEL_IDS.join(", ")}` }, { status: 400 });
  }
  if (!isFilledText(wish, MAX_WISH_LENGTH)) {
    return Response.json({ error: `wish must be a text of 1 to ${MAX_WISH_LENGTH} characters` }, { status: 400 });
  }
  if (!isText(reason, MAX_REASON_LENGTH)) {
    return Response.json({ error: `reason must be a text of at most ${MAX_REASON_LENGTH} characters` }, { status: 400 });
  }
  if (!isMoment(moment)) {
    return Response.json({ error: "moment must have what (a routine or own words), slot and days" }, { status: 400 });
  }
  if (!isTextList(declined, MAX_DECLINED)) {
    return Response.json({ error: `declined must be a list of at most ${MAX_DECLINED} short texts` }, { status: 400 });
  }

  const rules = await loadRuleSheet();
  const result = await offerFor(model, { wish, reason, moment, declined }, rules.text);
  await appendLog({
    type: "offer",
    at: new Date().toISOString(),
    userId,
    model: MODELS[model].name,
    rulesVersion: rules.version,
    wish,
    reason,
    moment,
    declined,
    result,
  });

  return Response.json(result);
}
