// Workout Service — Phase 2 (Plans, Exercises, Logging, AI generation)
import { eq, and, desc, isNull, sql } from 'drizzle-orm';
import { db } from '../config/database';
import {
  workoutPlans,
  workoutExercises,
  workoutLogs,
  members,
  memberMetrics,
  users,
} from '../db/schema';
import { randomUUID, createHash } from 'crypto';
import { NotFoundError, ValidationError } from '../utils/error-types';

export class WorkoutService {
  // ── Plan Management ──────────────────────────────────

  /** Create a workout plan (trainer-created or curated) */
  static async createPlan(data: {
    memberId?: string | null;
    trainerId?: string | null;
    planName: string;
    planDescription?: string;
    source: 'ai_generated' | 'trainer_created' | 'curated_library';
    durationWeeks: number;
    daysPerWeek: number;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    category?: string;
    planData?: any;
    exercises?: Array<{
      dayNumber: number;
      exerciseOrder: number;
      exerciseName: string;
      sets?: number;
      reps?: string;
      restSeconds?: number;
      notes?: string;
      equipment?: string;
      muscleGroups?: string[];
    }>;
  }) {
    const planId = randomUUID();

    await db.insert(workoutPlans).values({
      id: planId,
      memberId: data.memberId ?? null,
      trainerId: data.trainerId ?? null,
      planName: data.planName,
      planDescription: data.planDescription ?? null,
      source: data.source,
      durationWeeks: data.durationWeeks,
      daysPerWeek: data.daysPerWeek,
      difficulty: data.difficulty ?? null,
      category: data.category ?? null,
      planData: data.planData ?? null,
      isActive: true,
      startedAt: data.memberId ? new Date() : null,
    });

    // Insert exercises if provided
    if (data.exercises?.length) {
      const exerciseRows = data.exercises.map((ex) => ({
        id: randomUUID(),
        planId,
        dayNumber: ex.dayNumber,
        exerciseOrder: ex.exerciseOrder,
        exerciseName: ex.exerciseName,
        sets: ex.sets ?? null,
        reps: ex.reps ?? null,
        restSeconds: ex.restSeconds ?? null,
        notes: ex.notes ?? null,
        equipment: ex.equipment ?? null,
        muscleGroups: ex.muscleGroups ?? null,
      }));
      await db.insert(workoutExercises).values(exerciseRows);
    }

    return { id: planId };
  }

  /** Get all active plans for a member */
  static async getMemberPlans(memberId: string) {
    return db
      .select()
      .from(workoutPlans)
      .where(and(eq(workoutPlans.memberId, memberId), eq(workoutPlans.isActive, true)))
      .orderBy(desc(workoutPlans.createdAt));
  }

  /** Get curated library plans (memberId = null, source = curated_library) */
  static async getCuratedLibrary() {
    return db
      .select()
      .from(workoutPlans)
      .where(
        and(
          isNull(workoutPlans.memberId),
          eq(workoutPlans.source, 'curated_library'),
          eq(workoutPlans.isActive, true),
        ),
      )
      .orderBy(workoutPlans.planName);
  }

  /** Get plan by ID with exercises */
  static async getPlanById(planId: string) {
    const [plan] = await db
      .select()
      .from(workoutPlans)
      .where(eq(workoutPlans.id, planId))
      .limit(1);
    if (!plan) throw new NotFoundError('Workout plan');

    const exercises = await db
      .select()
      .from(workoutExercises)
      .where(eq(workoutExercises.planId, planId))
      .orderBy(workoutExercises.dayNumber, workoutExercises.exerciseOrder);

    return { ...plan, exercises };
  }

  /** Deactivate a plan */
  static async deactivatePlan(planId: string) {
    await db
      .update(workoutPlans)
      .set({ isActive: false, completedAt: new Date() })
      .where(eq(workoutPlans.id, planId));
  }

  /** Assign a curated plan to a member (clone it) */
  static async assignCuratedPlan(curatedPlanId: string, memberId: string, trainerId?: string) {
    const source = await this.getPlanById(curatedPlanId);

    const newPlan = await this.createPlan({
      memberId,
      trainerId: trainerId ?? undefined,
      planName: source.planName,
      planDescription: source.planDescription ?? undefined,
      source: 'curated_library',
      durationWeeks: source.durationWeeks,
      daysPerWeek: source.daysPerWeek,
      difficulty: source.difficulty ?? undefined,
      category: source.category ?? undefined,
      planData: source.planData,
      exercises: source.exercises.map((e) => ({
        dayNumber: e.dayNumber,
        exerciseOrder: e.exerciseOrder,
        exerciseName: e.exerciseName,
        sets: e.sets ?? undefined,
        reps: e.reps ?? undefined,
        restSeconds: e.restSeconds ?? undefined,
        notes: e.notes ?? undefined,
        equipment: e.equipment ?? undefined,
        muscleGroups: e.muscleGroups ?? undefined,
      })),
    });

    // Deactivate any existing active plans for this member
    await db
      .update(workoutPlans)
      .set({ isActive: false })
      .where(
        and(
          eq(workoutPlans.memberId, memberId),
          eq(workoutPlans.isActive, true),
          sql`${workoutPlans.id} != ${newPlan.id}`,
        ),
      );

    return newPlan;
  }

  // ── AI Workout Generation ───────────────────────────

  /** Build AI prompt for a member and generate a plan (stub — plug in LLM in production) */
  static async generateAIPlan(memberId: string, trainerId?: string) {
    // Fetch member data
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1);
    if (!member) throw new NotFoundError('Member');

    const [user] = await db
      .select({ fullName: users.fullName, dateOfBirth: users.dateOfBirth, gender: users.gender })
      .from(users)
      .where(eq(users.id, member.userId))
      .limit(1);

    // Fetch latest vitals
    const [vitals] = await db
      .select()
      .from(memberMetrics)
      .where(eq(memberMetrics.memberId, memberId))
      .orderBy(desc(memberMetrics.recordedAt))
      .limit(1);

    // Calculate age
    const age = user?.dateOfBirth
      ? Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / 31557600000)
      : null;

    // Build prompt context
    const prompt = JSON.stringify({
      age,
      gender: user?.gender,
      weight: vitals?.weight,
      height: vitals?.height,
      bmi: vitals?.bmi,
      bodyFat: vitals?.bodyFatPercentage,
      restingHr: vitals?.restingHeartRate,
      experienceLevel: member.experienceLevel,
      goals: member.fitnessGoals,
      medicalConditions: member.medicalConditions,
    });

    const promptHash = createHash('sha256').update(prompt).digest('hex');

    // ──── AI STUB: Replace with real LLM call ────────
    // In production, POST to Gemini / OpenAI with the structured prompt.
    // For now, generate a reasonable default plan based on experience level.
    const level = member.experienceLevel ?? 'beginner';
    const daysPerWeek = level === 'beginner' ? 3 : level === 'intermediate' ? 4 : 5;
    const durationWeeks = level === 'beginner' ? 4 : 6;

    const stubExercises = generateStubExercises(level, daysPerWeek);

    const planId = randomUUID();
    await db.insert(workoutPlans).values({
      id: planId,
      memberId,
      trainerId: trainerId ?? null,
      planName: `AI ${level.charAt(0).toUpperCase() + level.slice(1)} Plan`,
      planDescription: `Auto-generated ${durationWeeks}-week ${level} programme`,
      source: 'ai_generated',
      durationWeeks,
      daysPerWeek,
      difficulty: level === 'returning' ? 'beginner' : level as any,
      planData: { promptContext: prompt },
      isActive: true,
      startedAt: new Date(),
      aiModelUsed: 'stub-v1',
      aiPromptHash: promptHash,
    });

    // Insert exercises
    if (stubExercises.length) {
      await db.insert(workoutExercises).values(
        stubExercises.map((e) => ({ ...e, id: randomUUID(), planId })),
      );
    }

    // Deactivate other active plans for this member
    await db
      .update(workoutPlans)
      .set({ isActive: false })
      .where(
        and(
          eq(workoutPlans.memberId, memberId),
          eq(workoutPlans.isActive, true),
          sql`${workoutPlans.id} != ${planId}`,
        ),
      );

    return { id: planId, daysPerWeek, durationWeeks };
  }

  // ── Workout Logging ─────────────────────────────────

  /** Log a completed workout */
  static async logWorkout(data: {
    memberId: string;
    planId?: string;
    workoutDate: string;
    exercises?: any;
    durationMinutes?: number;
    mood?: 'great' | 'good' | 'okay' | 'tired' | 'poor';
    caloriesBurned?: number;
    notes?: string;
  }) {
    const id = randomUUID();
    await db.insert(workoutLogs).values({
      id,
      memberId: data.memberId,
      planId: data.planId ?? null,
      workoutDate: new Date(data.workoutDate),
      exercises: data.exercises ?? null,
      durationMinutes: data.durationMinutes ?? null,
      mood: data.mood ?? null,
      caloriesBurned: data.caloriesBurned ?? null,
      notes: data.notes ?? null,
    });
    return { id };
  }

  /** Get workout history for a member */
  static async getWorkoutHistory(memberId: string, limit = 30) {
    return db
      .select()
      .from(workoutLogs)
      .where(eq(workoutLogs.memberId, memberId))
      .orderBy(desc(workoutLogs.workoutDate))
      .limit(limit);
  }
}

// ── Stub Exercise Data Generator ─────────────────────

function generateStubExercises(
  level: string,
  daysPerWeek: number,
): Array<{
  dayNumber: number;
  exerciseOrder: number;
  exerciseName: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes: string | null;
  equipment: string | null;
  muscleGroups: string[];
}> {
  const plans: Record<string, Array<{ focus: string; exercises: Array<{ name: string; sets: number; reps: string; rest: number; equip: string; muscles: string[] }> }>> = {
    beginner: [
      {
        focus: 'Full Body A',
        exercises: [
          { name: 'Leg Press', sets: 3, reps: '12-15', rest: 60, equip: 'Leg Press Machine', muscles: ['quadriceps', 'glutes'] },
          { name: 'Chest Press Machine', sets: 3, reps: '12-15', rest: 60, equip: 'Chest Press Machine', muscles: ['chest', 'triceps'] },
          { name: 'Lat Pulldown', sets: 3, reps: '12-15', rest: 60, equip: 'Cable Machine', muscles: ['lats', 'biceps'] },
          { name: 'Shoulder Press Machine', sets: 3, reps: '12-15', rest: 60, equip: 'Shoulder Press Machine', muscles: ['shoulders'] },
          { name: 'Plank', sets: 3, reps: '30 seconds', rest: 30, equip: 'Bodyweight', muscles: ['core'] },
        ],
      },
      {
        focus: 'Full Body B',
        exercises: [
          { name: 'Goblet Squat', sets: 3, reps: '12', rest: 60, equip: 'Dumbbell', muscles: ['quadriceps', 'glutes'] },
          { name: 'Seated Row', sets: 3, reps: '12', rest: 60, equip: 'Cable Machine', muscles: ['back', 'biceps'] },
          { name: 'Dumbbell Bench Press', sets: 3, reps: '12', rest: 60, equip: 'Dumbbells', muscles: ['chest', 'triceps'] },
          { name: 'Leg Curl', sets: 3, reps: '12', rest: 60, equip: 'Leg Curl Machine', muscles: ['hamstrings'] },
          { name: 'Bicycle Crunches', sets: 3, reps: '15 each side', rest: 30, equip: 'Bodyweight', muscles: ['core'] },
        ],
      },
      {
        focus: 'Full Body C',
        exercises: [
          { name: 'Smith Machine Squat', sets: 3, reps: '12', rest: 60, equip: 'Smith Machine', muscles: ['quadriceps', 'glutes'] },
          { name: 'Cable Chest Fly', sets: 3, reps: '12', rest: 60, equip: 'Cable Machine', muscles: ['chest'] },
          { name: 'Assisted Pull-ups', sets: 3, reps: '8-10', rest: 90, equip: 'Assisted Pull-up Machine', muscles: ['lats', 'biceps'] },
          { name: 'Lateral Raise', sets: 3, reps: '12', rest: 60, equip: 'Dumbbells', muscles: ['shoulders'] },
          { name: 'Treadmill Walk', sets: 1, reps: '15 minutes', rest: 0, equip: 'Treadmill', muscles: ['cardio'] },
        ],
      },
    ],
    intermediate: [
      { focus: 'Push', exercises: [
        { name: 'Barbell Bench Press', sets: 4, reps: '8-10', rest: 90, equip: 'Barbell', muscles: ['chest', 'triceps'] },
        { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', rest: 60, equip: 'Dumbbells', muscles: ['upper_chest'] },
        { name: 'Overhead Press', sets: 4, reps: '8-10', rest: 90, equip: 'Barbell', muscles: ['shoulders'] },
        { name: 'Cable Lateral Raise', sets: 3, reps: '12-15', rest: 45, equip: 'Cable', muscles: ['shoulders'] },
        { name: 'Tricep Pushdown', sets: 3, reps: '12', rest: 45, equip: 'Cable', muscles: ['triceps'] },
      ]},
      { focus: 'Pull', exercises: [
        { name: 'Barbell Row', sets: 4, reps: '8-10', rest: 90, equip: 'Barbell', muscles: ['back', 'biceps'] },
        { name: 'Pull-ups', sets: 3, reps: '8-10', rest: 90, equip: 'Pull-up Bar', muscles: ['lats', 'biceps'] },
        { name: 'Face Pulls', sets: 3, reps: '15', rest: 45, equip: 'Cable', muscles: ['rear_delts'] },
        { name: 'Dumbbell Curl', sets: 3, reps: '12', rest: 45, equip: 'Dumbbells', muscles: ['biceps'] },
        { name: 'Hammer Curl', sets: 3, reps: '12', rest: 45, equip: 'Dumbbells', muscles: ['biceps', 'forearms'] },
      ]},
      { focus: 'Legs', exercises: [
        { name: 'Barbell Squat', sets: 4, reps: '8-10', rest: 120, equip: 'Barbell', muscles: ['quadriceps', 'glutes'] },
        { name: 'Romanian Deadlift', sets: 3, reps: '10-12', rest: 90, equip: 'Barbell', muscles: ['hamstrings', 'glutes'] },
        { name: 'Leg Press', sets: 3, reps: '12', rest: 90, equip: 'Leg Press', muscles: ['quadriceps'] },
        { name: 'Leg Curl', sets: 3, reps: '12', rest: 60, equip: 'Machine', muscles: ['hamstrings'] },
        { name: 'Calf Raise', sets: 4, reps: '15', rest: 45, equip: 'Smith Machine', muscles: ['calves'] },
      ]},
      { focus: 'Upper Body', exercises: [
        { name: 'Dumbbell Bench Press', sets: 3, reps: '10-12', rest: 60, equip: 'Dumbbells', muscles: ['chest'] },
        { name: 'Cable Row', sets: 3, reps: '10-12', rest: 60, equip: 'Cable', muscles: ['back'] },
        { name: 'Arnold Press', sets: 3, reps: '10', rest: 60, equip: 'Dumbbells', muscles: ['shoulders'] },
        { name: 'Lat Pulldown', sets: 3, reps: '12', rest: 60, equip: 'Cable', muscles: ['lats'] },
        { name: 'Plank', sets: 3, reps: '45 seconds', rest: 30, equip: 'Bodyweight', muscles: ['core'] },
      ]},
    ],
    advanced: [
      { focus: 'Chest & Triceps', exercises: [
        { name: 'Barbell Bench Press', sets: 5, reps: '5', rest: 120, equip: 'Barbell', muscles: ['chest'] },
        { name: 'Incline Bench Press', sets: 4, reps: '8', rest: 90, equip: 'Barbell', muscles: ['upper_chest'] },
        { name: 'Weighted Dips', sets: 3, reps: '8-10', rest: 90, equip: 'Dip Station', muscles: ['chest', 'triceps'] },
        { name: 'Cable Fly', sets: 3, reps: '12', rest: 60, equip: 'Cable', muscles: ['chest'] },
        { name: 'Close Grip Bench Press', sets: 3, reps: '10', rest: 60, equip: 'Barbell', muscles: ['triceps'] },
      ]},
      { focus: 'Back & Biceps', exercises: [
        { name: 'Deadlift', sets: 5, reps: '5', rest: 180, equip: 'Barbell', muscles: ['back', 'hamstrings'] },
        { name: 'Weighted Pull-ups', sets: 4, reps: '6-8', rest: 120, equip: 'Pull-up Bar', muscles: ['lats'] },
        { name: 'Barbell Row', sets: 4, reps: '8', rest: 90, equip: 'Barbell', muscles: ['back'] },
        { name: 'Face Pulls', sets: 3, reps: '15', rest: 45, equip: 'Cable', muscles: ['rear_delts'] },
        { name: 'Barbell Curl', sets: 4, reps: '10', rest: 60, equip: 'Barbell', muscles: ['biceps'] },
      ]},
      { focus: 'Legs & Abs', exercises: [
        { name: 'Barbell Squat', sets: 5, reps: '5', rest: 180, equip: 'Barbell', muscles: ['quadriceps', 'glutes'] },
        { name: 'Front Squat', sets: 3, reps: '8', rest: 120, equip: 'Barbell', muscles: ['quadriceps'] },
        { name: 'Romanian Deadlift', sets: 4, reps: '8', rest: 90, equip: 'Barbell', muscles: ['hamstrings'] },
        { name: 'Bulgarian Split Squat', sets: 3, reps: '10 each', rest: 60, equip: 'Dumbbells', muscles: ['quadriceps', 'glutes'] },
        { name: 'Hanging Leg Raise', sets: 3, reps: '12', rest: 45, equip: 'Pull-up Bar', muscles: ['core'] },
      ]},
      { focus: 'Shoulders & Arms', exercises: [
        { name: 'Overhead Press', sets: 5, reps: '5', rest: 120, equip: 'Barbell', muscles: ['shoulders'] },
        { name: 'Dumbbell Lateral Raise', sets: 4, reps: '12', rest: 45, equip: 'Dumbbells', muscles: ['shoulders'] },
        { name: 'Close Grip Bench Press', sets: 3, reps: '8', rest: 60, equip: 'Barbell', muscles: ['triceps'] },
        { name: 'Barbell Curl', sets: 3, reps: '10', rest: 60, equip: 'Barbell', muscles: ['biceps'] },
        { name: 'Hammer Curl', sets: 3, reps: '12', rest: 45, equip: 'Dumbbells', muscles: ['biceps'] },
      ]},
      { focus: 'Cardio & Conditioning', exercises: [
        { name: 'Treadmill HIIT', sets: 1, reps: '20 minutes', rest: 0, equip: 'Treadmill', muscles: ['cardio'] },
        { name: 'Battle Ropes', sets: 5, reps: '30 seconds', rest: 30, equip: 'Battle Ropes', muscles: ['full_body'] },
        { name: 'Box Jumps', sets: 3, reps: '10', rest: 60, equip: 'Plyo Box', muscles: ['legs', 'cardio'] },
        { name: 'Kettlebell Swings', sets: 4, reps: '15', rest: 45, equip: 'Kettlebell', muscles: ['posterior_chain'] },
        { name: 'Farmer Walk', sets: 3, reps: '40 metres', rest: 60, equip: 'Dumbbells', muscles: ['grip', 'core'] },
      ]},
    ],
  };

  const dayTemplates = plans[level] ?? plans.beginner;
  const result: Array<{ dayNumber: number; exerciseOrder: number; exerciseName: string; sets: number; reps: string; restSeconds: number; notes: string | null; equipment: string | null; muscleGroups: string[] }> = [];

  for (let d = 0; d < Math.min(daysPerWeek, dayTemplates.length); d++) {
    const day = dayTemplates[d];
    day.exercises.forEach((ex, idx) => {
      result.push({
        dayNumber: d + 1,
        exerciseOrder: idx + 1,
        exerciseName: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        restSeconds: ex.rest,
        notes: null,
        equipment: ex.equip,
        muscleGroups: ex.muscles,
      });
    });
  }

  return result;
}
