/**
 * Optional questionnaire answers for tailored AI workout plan generation.
 */

const FIELD_MAX = 400;

export type AiWorkoutPlanPreferences = {
  primaryFocus?: string;
  daysPerWeek?: string;
  sessionLength?: string;
  equipmentAccess?: string;
  emphasis?: string;
  avoidOrInjuries?: string;
  extraNotes?: string;
};

function clip(s: unknown): string {
  return String(s ?? '')
    .trim()
    .slice(0, FIELD_MAX);
}

/** Extract preferences from JSON body (`req.body.preferences`). */
export function parseWorkoutPlanPreferences(body: unknown): AiWorkoutPlanPreferences | undefined {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return undefined;
  const b = body as Record<string, unknown>;
  const out: AiWorkoutPlanPreferences = {};

  const primaryFocus = clip(b.primaryFocus);
  if (primaryFocus) out.primaryFocus = primaryFocus;
  const daysPerWeek = clip(b.daysPerWeek);
  if (daysPerWeek) out.daysPerWeek = daysPerWeek;
  const sessionLength = clip(b.sessionLength);
  if (sessionLength) out.sessionLength = sessionLength;
  const equipmentAccess = clip(b.equipmentAccess);
  if (equipmentAccess) out.equipmentAccess = equipmentAccess;
  const emphasis = clip(b.emphasis);
  if (emphasis) out.emphasis = emphasis;
  const avoidOrInjuries = clip(b.avoidOrInjuries);
  if (avoidOrInjuries) out.avoidOrInjuries = avoidOrInjuries;
  const extraNotes = clip(b.extraNotes);
  if (extraNotes) out.extraNotes = extraNotes;

  return Object.keys(out).length > 0 ? out : undefined;
}

/** Human-readable block appended to the Gemini prompt. */
export function workoutPreferencesToPromptBlock(p: AiWorkoutPlanPreferences): string {
  const bullets: string[] = [];
  if (p.primaryFocus) bullets.push(`Primary focus right now: ${p.primaryFocus}`);
  if (p.daysPerWeek) bullets.push(`Days per week they can train: ${p.daysPerWeek}`);
  if (p.sessionLength) bullets.push(`Typical session length: ${p.sessionLength}`);
  if (p.equipmentAccess) bullets.push(`Equipment they will use: ${p.equipmentAccess}`);
  if (p.emphasis) bullets.push(`Muscle areas / split preference: ${p.emphasis}`);
  if (p.avoidOrInjuries) bullets.push(`Injuries, pain, or movements to avoid: ${p.avoidOrInjuries}`);
  if (p.extraNotes) bullets.push(`Other notes: ${p.extraNotes}`);
  if (bullets.length === 0) return '';

  return `
The member answered these questions for THIS plan (honour them in exercise choice, order, equipment, and weekly structure):
${bullets.map((b) => `- ${b}`).join('\n')}
If any answer conflicts with the medical conditions line above, prioritise safety and note assumptions in the description.
When they specified days per week, set "daysPerWeek" in your JSON to match when possible (3, 4, or 5).
`;
}

/** Compact string for program meta focus / fallback template heuristics. */
export function workoutPreferencesToFocusSuffix(p: AiWorkoutPlanPreferences): string {
  return [p.primaryFocus, p.emphasis, p.daysPerWeek].filter(Boolean).join('; ');
}
