import type { ModelId } from "@/shared/habit";
import { claude } from "./claude";
import { gemma } from "./gemma";
import type { ModelClient } from "./model";

// The one place that knows which models exist. Whatever talks to a model
// picks it from here by id.
export const MODELS: Record<ModelId, ModelClient> = { claude, gemma };
