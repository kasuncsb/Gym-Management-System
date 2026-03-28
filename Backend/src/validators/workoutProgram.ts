import { z } from 'zod';

const exerciseSchema = z.object({
  name: z.string().min(1).max(200),
  sets: z.number().int().min(0).max(100).optional().nullable(),
  reps: z.number().int().min(0).max(1000).optional().nullable(),
  durationSec: z.number().int().min(0).max(86400).optional().nullable(),
  restSec: z.number().int().min(0).max(3600).optional().nullable(),
  instructions: z.string().max(4000).optional().nullable(),
  muscleGroup: z.string().max(80).optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable(),
  videoUrl: z.string().max(500).optional().nullable(),
  equipment: z.string().max(120).optional().nullable(),
});

const daySchema = z.object({
  dayNumber: z.number().int().min(1).max(14),
  title: z.string().max(200).optional().nullable(),
  exercises: z.array(exerciseSchema).max(40),
});

/** Exported for seed scripts and tests */
export const workoutProgramJsonSchema = z.object({
  schemaVersion: z.literal(1),
  meta: z.object({
    durationWeeks: z.number().int().min(1).max(52).optional(),
    daysPerWeek: z.number().int().min(1).max(7).optional(),
    focus: z.string().max(200).optional().nullable(),
    locale: z.string().max(10).optional().nullable(),
  }),
  days: z.array(daySchema).max(14),
});

export type WorkoutProgramJson = z.infer<typeof workoutProgramJsonSchema>;

const MAX_DAYS = 14;
const MAX_EX_PER_DAY = 40;

export function parseAndValidateProgramJson(raw: string | null | undefined): WorkoutProgramJson {
  if (raw == null || raw === '') {
    throw new Error('program_json is empty');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('program_json is not valid JSON');
  }
  const r = workoutProgramJsonSchema.safeParse(parsed);
  if (!r.success) {
    const msg = r.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    throw new Error(`Invalid program_json: ${msg}`);
  }
  if (r.data.days.length > MAX_DAYS) {
    throw new Error(`program_json: at most ${MAX_DAYS} days`);
  }
  for (const d of r.data.days) {
    if (d.exercises.length > MAX_EX_PER_DAY) {
      throw new Error(`program_json: at most ${MAX_EX_PER_DAY} exercises per day`);
    }
  }
  return r.data;
}

export function safeParseProgramJson(raw: string | null | undefined): WorkoutProgramJson | null {
  try {
    return parseAndValidateProgramJson(raw);
  } catch {
    return null;
  }
}

export function stringifyProgram(program: WorkoutProgramJson): string {
  return JSON.stringify(program);
}

type AiEx = {
  day?: number;
  name?: string;
  muscleGroup?: string;
  sets?: number;
  reps?: number;
  durationSec?: number;
  restSec?: number;
  instructions?: string;
  sortOrder?: number;
  imageUrl?: string;
  videoUrl?: string;
  equipment?: string;
};

/** Group flat AI exercise list into schemaVersion 1 days[].exercises */
export function buildProgramFromAiExercises(
  input: {
    durationWeeks: number;
    daysPerWeek: number;
    locale?: string;
    focus?: string;
    exercises: AiEx[];
  },
): WorkoutProgramJson {
  const byDay = new Map<number, AiEx[]>();
  for (const ex of input.exercises) {
    const day = typeof ex.day === 'number' && ex.day >= 1 ? Math.min(ex.day, MAX_DAYS) : 1;
    const list = byDay.get(day) ?? [];
    list.push(ex);
    byDay.set(day, list);
  }
  const days: WorkoutProgramJson['days'] = [];
  const sortedDays = [...byDay.keys()].sort((a, b) => a - b);
  for (const dayNumber of sortedDays) {
    const list = byDay.get(dayNumber) ?? [];
    list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    days.push({
      dayNumber,
      title: `Day ${dayNumber}`,
      exercises: list.map((ex) => ({
        name: String(ex.name ?? 'Exercise').slice(0, 200),
        sets: ex.sets ?? null,
        reps: ex.reps ?? null,
        durationSec: ex.durationSec ?? null,
        restSec: ex.restSec ?? null,
        instructions: ex.instructions ?? null,
        muscleGroup: ex.muscleGroup ?? null,
        imageUrl: ex.imageUrl ?? null,
        videoUrl: ex.videoUrl ?? null,
        equipment: ex.equipment ?? null,
      })),
    });
  }
  const program: WorkoutProgramJson = {
    schemaVersion: 1,
    meta: {
      durationWeeks: input.durationWeeks,
      daysPerWeek: input.daysPerWeek,
      focus: input.focus ?? null,
      locale: input.locale ?? 'LK',
    },
    days,
  };
  return workoutProgramJsonSchema.parse(program);
}

export function emptyTrainerProgram(meta: { durationWeeks: number; daysPerWeek: number }): WorkoutProgramJson {
  return workoutProgramJsonSchema.parse({
    schemaVersion: 1,
    meta: { ...meta, focus: null, locale: 'LK' },
    days: [],
  });
}
