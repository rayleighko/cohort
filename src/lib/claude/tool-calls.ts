/**
 * Claude tool-call definitions — user context + plan reference.
 * Lets Aurora/Vesper read the user's watchlist, plan, macro score, and triggers
 * so narration stays grounded in the user's OWN plan (never a recommendation).
 * TODO(W3-W5): implement tool schemas + serializeUserContext().
 */

export interface UserContext {
  tier: string;
  watchlist?: unknown[];
  macroComposite?: number;
}

/** Serializes user context into the prompt-injected USER CONTEXT block. */
export function serializeUserContext(_ctx: UserContext): string {
  // TODO(W3): real serialization once Shape A/B data models exist.
  return 'TODO: user context serialization (W3).';
}
