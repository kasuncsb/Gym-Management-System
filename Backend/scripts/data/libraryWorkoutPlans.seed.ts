/**
 * Library workout templates (source: library). Standard programme names; locale in meta only.
 * Images: Unsplash CDN. Videos: public YouTube embed-friendly links.
 */
import type { WorkoutProgramJson } from '../../src/validators/workoutProgram.js';

export type LibraryPlanSeed = {
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  durationWeeks: number;
  daysPerWeek: number;
  program: WorkoutProgramJson;
};

const u = (path: string) => `https://images.unsplash.com/${path}?auto=format&fit=crop&w=800&q=80`;
const YT = (id: string) => `https://www.youtube.com/watch?v=${id}`;

function prog(p: Omit<WorkoutProgramJson, 'schemaVersion'>): WorkoutProgramJson {
  return { schemaVersion: 1, ...p };
}

/** Compact 2-day blocks, 3 exercises each — easy to scan in the app */
function twoDay(
  w: number,
  d: number,
  focus: string,
  day1Title: string,
  day1: WorkoutProgramJson['days'][0]['exercises'],
  day2Title: string,
  day2: WorkoutProgramJson['days'][0]['exercises'],
): WorkoutProgramJson {
  return prog({
    meta: { durationWeeks: w, daysPerWeek: d, focus, locale: 'LK' },
    days: [
      { dayNumber: 1, title: day1Title, exercises: day1 },
      { dayNumber: 2, title: day2Title, exercises: day2 },
    ],
  });
}

export const LIBRARY_WORKOUT_PLANS: LibraryPlanSeed[] = [
  {
    name: 'Beginner Full Body',
    description: 'Full-body basics twice a week. Good first programme for new members.',
    difficulty: 'beginner',
    durationWeeks: 4,
    daysPerWeek: 3,
    program: twoDay(4, 3, 'General fitness', 'Day A — legs & core', [
      { name: 'Goblet squat', sets: 3, reps: 12, restSec: 60, muscleGroup: 'legs', imageUrl: u('photo-1434682881908-b43d0467b798'), videoUrl: YT('aclHkVaku9U') },
      { name: 'Glute bridge', sets: 3, reps: 15, restSec: 45, muscleGroup: 'glutes', imageUrl: u('photo-1517836357463-d25dfeac3438') },
      { name: 'Plank', sets: 3, durationSec: 30, restSec: 45, muscleGroup: 'core', imageUrl: u('photo-1566241141449-7f1e8a4a4f2d') },
    ], 'Day B — push & pull', [
      { name: 'Incline push-up', sets: 3, reps: 10, restSec: 60, muscleGroup: 'chest', imageUrl: u('photo-1598971639058-fab3c3109a00') },
      { name: 'Dumbbell row', sets: 3, reps: 12, restSec: 60, muscleGroup: 'back', imageUrl: u('photo-1581009146145-b5ef050c2e1e') },
      { name: 'Dead bug', sets: 3, reps: 10, restSec: 45, muscleGroup: 'core', imageUrl: u('photo-1518611012118-696072aa579a') },
    ]),
  },
  {
    name: 'Fat Loss Circuit',
    description: 'Short cardio blocks plus simple strength. Steady pace.',
    difficulty: 'beginner',
    durationWeeks: 6,
    daysPerWeek: 4,
    program: twoDay(6, 4, 'Fat loss', 'Circuit 1', [
      { name: 'Treadmill walk', sets: 1, durationSec: 900, muscleGroup: 'cardio', imageUrl: u('photo-1576678927484-cc907957088c') },
      { name: 'Bodyweight squat', sets: 3, reps: 15, restSec: 45, muscleGroup: 'legs', imageUrl: u('photo-1574680096145-d05b474e2155') },
      { name: 'Mountain climber', sets: 3, durationSec: 30, restSec: 45, muscleGroup: 'core', imageUrl: u('photo-1518611012118-696072aa579a') },
    ], 'Circuit 2', [
      { name: 'Exercise bike', sets: 1, durationSec: 600, muscleGroup: 'cardio', imageUrl: u('photo-1538805060514-97d9cc17730c') },
      { name: 'Lunge', sets: 3, reps: 10, restSec: 60, muscleGroup: 'legs', imageUrl: u('photo-1517832207060-4e900a6e0c8b') },
    ]),
  },
  {
    name: 'Push Pull Legs',
    description: 'Classic PPL rotation. One main lift each day pattern.',
    difficulty: 'intermediate',
    durationWeeks: 8,
    daysPerWeek: 3,
    program: twoDay(8, 3, 'PPL', 'Push', [
      { name: 'Bench press', sets: 4, reps: 8, restSec: 120, muscleGroup: 'chest', imageUrl: u('photo-1583454110551-21f2fa2afe61') },
      { name: 'Overhead press', sets: 3, reps: 8, restSec: 90, muscleGroup: 'shoulders', imageUrl: u('photo-1583454156274-4c48f42e4d1b') },
      { name: 'Tricep pushdown', sets: 3, reps: 12, restSec: 60, muscleGroup: 'arms', imageUrl: u('photo-1583454156274-4c48f42e4d1b') },
    ], 'Pull', [
      { name: 'Lat pulldown', sets: 4, reps: 10, restSec: 90, muscleGroup: 'back', imageUrl: u('photo-1581009146145-b5ef050c2e1e') },
      { name: 'Seated row', sets: 3, reps: 12, restSec: 75, muscleGroup: 'back', imageUrl: u('photo-1517836357463-d25dfeac3438') },
      { name: 'Face pull', sets: 3, reps: 15, restSec: 45, muscleGroup: 'shoulders', imageUrl: u('photo-1583454110551-21f2fa2afe61') },
    ]),
  },
  {
    name: 'Upper Lower Split',
    description: 'Four days: upper twice, lower twice. Balanced volume.',
    difficulty: 'intermediate',
    durationWeeks: 8,
    daysPerWeek: 4,
    program: twoDay(8, 4, 'Upper/Lower', 'Upper', [
      { name: 'Chest press machine', sets: 3, reps: 12, restSec: 75, muscleGroup: 'chest', imageUrl: u('photo-1583454156274-4c48f42e4d1b') },
      { name: 'Lat pulldown', sets: 3, reps: 12, restSec: 75, muscleGroup: 'back', imageUrl: u('photo-1581009146145-b5ef050c2e1e') },
      { name: 'Lateral raise', sets: 3, reps: 12, restSec: 60, muscleGroup: 'shoulders', imageUrl: u('photo-1583454110551-21f2fa2afe61') },
    ], 'Lower', [
      { name: 'Leg press', sets: 4, reps: 12, restSec: 90, muscleGroup: 'legs', imageUrl: u('photo-1534438327276-14e5300c3a48') },
      { name: 'Leg curl', sets: 3, reps: 12, restSec: 60, muscleGroup: 'hamstrings', imageUrl: u('photo-1571019614242-c5c5dee9f50b') },
      { name: 'Calf raise', sets: 3, reps: 15, restSec: 45, muscleGroup: 'calves', imageUrl: u('photo-1571019614242-c5c5dee9f50b') },
    ]),
  },
  {
    name: 'Cardio & Core',
    description: 'Low-impact cardio plus core work. Suitable for mixed levels.',
    difficulty: 'beginner',
    durationWeeks: 4,
    daysPerWeek: 3,
    program: twoDay(4, 3, 'Cardio', 'Session A', [
      { name: 'Stationary bike', sets: 1, durationSec: 1200, muscleGroup: 'cardio', imageUrl: u('photo-1538805060514-97d9cc17730c') },
      { name: 'Plank', sets: 3, durationSec: 40, restSec: 45, muscleGroup: 'core', imageUrl: u('photo-1566241141449-7f1e8a4a4f2d') },
      { name: 'Bicycle crunch', sets: 3, reps: 20, restSec: 45, muscleGroup: 'core', imageUrl: u('photo-1518611012118-696072aa579a') },
    ], 'Session B', [
      { name: 'Elliptical', sets: 1, durationSec: 900, muscleGroup: 'cardio', imageUrl: u('photo-1540497077202-7c8a3999166f') },
      { name: 'Side plank', sets: 3, durationSec: 30, restSec: 45, muscleGroup: 'core', imageUrl: u('photo-1566241141449-7f1e8a4a4f2d') },
    ]),
  },
  {
    name: 'Strength Basics',
    description: 'Compound lifts first. Add weight when form is solid.',
    difficulty: 'intermediate',
    durationWeeks: 8,
    daysPerWeek: 3,
    program: twoDay(8, 3, 'Strength', 'Heavy A', [
      { name: 'Back squat', sets: 4, reps: 6, restSec: 120, muscleGroup: 'legs', imageUrl: u('photo-1434682881908-b43d0467b798') },
      { name: 'Romanian deadlift', sets: 3, reps: 8, restSec: 90, muscleGroup: 'posterior chain', imageUrl: u('photo-1517836357463-d25dfeac3438') },
    ], 'Heavy B', [
      { name: 'Bench press', sets: 4, reps: 6, restSec: 120, muscleGroup: 'chest', imageUrl: u('photo-1583454110551-21f2fa2afe61') },
      { name: 'Barbell row', sets: 4, reps: 8, restSec: 90, muscleGroup: 'back', imageUrl: u('photo-1581009146145-b5ef050c2e1e') },
    ]),
  },
  {
    name: 'Glutes & Legs',
    description: 'Lower-body focus. Squat and hinge patterns.',
    difficulty: 'intermediate',
    durationWeeks: 6,
    daysPerWeek: 3,
    program: twoDay(6, 3, 'Lower body', 'Quad focus', [
      { name: 'Leg press', sets: 4, reps: 12, restSec: 90, muscleGroup: 'legs', imageUrl: u('photo-1534438327276-14e5300c3a48') },
      { name: 'Walking lunge', sets: 3, reps: 10, restSec: 60, muscleGroup: 'legs', imageUrl: u('photo-1517832207060-4e900a6e0c8b') },
    ], 'Posterior focus', [
      { name: 'Hip thrust', sets: 4, reps: 10, restSec: 75, muscleGroup: 'glutes', imageUrl: u('photo-1517836357463-d25dfeac3438') },
      { name: 'Leg curl', sets: 3, reps: 12, restSec: 60, muscleGroup: 'hamstrings', imageUrl: u('photo-1571019614242-c5c5dee9f50b') },
    ]),
  },
  {
    name: 'Chest & Back',
    description: 'Horizontal push and pull for upper-body balance.',
    difficulty: 'beginner',
    durationWeeks: 6,
    daysPerWeek: 3,
    program: twoDay(6, 3, 'Upper', 'Chest emphasis', [
      { name: 'Chest press machine', sets: 3, reps: 12, restSec: 75, muscleGroup: 'chest', imageUrl: u('photo-1583454156274-4c48f42e4d1b') },
      { name: 'Incline dumbbell press', sets: 3, reps: 10, restSec: 75, muscleGroup: 'chest', imageUrl: u('photo-1583454110551-21f2fa2afe61') },
    ], 'Back emphasis', [
      { name: 'Seated row', sets: 4, reps: 12, restSec: 75, muscleGroup: 'back', imageUrl: u('photo-1517836357463-d25dfeac3438') },
      { name: 'Straight-arm pulldown', sets: 3, reps: 12, restSec: 60, muscleGroup: 'back', imageUrl: u('photo-1581009146145-b5ef050c2e1e') },
    ]),
  },
  {
    name: 'Shoulders & Arms',
    description: 'Isolation work for shoulders, biceps, and triceps.',
    difficulty: 'beginner',
    durationWeeks: 4,
    daysPerWeek: 3,
    program: twoDay(4, 3, 'Arms', 'Shoulders', [
      { name: 'Dumbbell shoulder press', sets: 3, reps: 10, restSec: 75, muscleGroup: 'shoulders', imageUrl: u('photo-1583454110551-21f2fa2afe61') },
      { name: 'Lateral raise', sets: 3, reps: 12, restSec: 60, muscleGroup: 'shoulders', imageUrl: u('photo-1583454110551-21f2fa2afe61') },
    ], 'Arms', [
      { name: 'Cable curl', sets: 3, reps: 12, restSec: 60, muscleGroup: 'biceps', imageUrl: u('photo-1581009146145-b5ef050c2e1e') },
      { name: 'Tricep rope pushdown', sets: 3, reps: 12, restSec: 60, muscleGroup: 'triceps', imageUrl: u('photo-1583454156274-4c48f42e4d1b') },
    ]),
  },
  {
    name: 'HIIT Conditioning',
    description: 'Short high-intensity intervals. Warm up well first.',
    difficulty: 'advanced',
    durationWeeks: 6,
    daysPerWeek: 3,
    program: twoDay(6, 3, 'HIIT', 'Round 1', [
      { name: 'Rowing sprint', sets: 6, durationSec: 30, restSec: 90, muscleGroup: 'cardio', imageUrl: u('photo-1540497077202-7c8a3999166f') },
      { name: 'Kettlebell swing', sets: 3, reps: 15, restSec: 60, muscleGroup: 'full body', imageUrl: u('photo-1517836357463-d25dfeac3438') },
    ], 'Round 2', [
      { name: 'Assault bike', sets: 6, durationSec: 20, restSec: 90, muscleGroup: 'cardio', imageUrl: u('photo-1538805060514-97d9cc17730c') },
      { name: 'Box jump', sets: 3, reps: 8, restSec: 75, muscleGroup: 'legs', imageUrl: u('photo-1571019614242-c5c5dee9f50b') },
    ]),
  },
  {
    name: 'Mobility & Stretch',
    description: 'Light movement and stretching. Good for recovery days.',
    difficulty: 'beginner',
    durationWeeks: 4,
    daysPerWeek: 3,
    program: twoDay(4, 3, 'Mobility', 'Flow A', [
      { name: 'Cat-cow', sets: 2, durationSec: 60, muscleGroup: 'mobility', imageUrl: u('photo-1518611012118-696072aa579a') },
      { name: 'Hip flexor stretch', sets: 2, durationSec: 45, muscleGroup: 'hips', imageUrl: u('photo-1517832207060-4e900a6e0c8b') },
      { name: 'Thoracic extension', sets: 2, durationSec: 60, muscleGroup: 'upper back', imageUrl: u('photo-1518611012118-696072aa579a') },
    ], 'Flow B', [
      { name: 'Foam roll upper back', sets: 1, durationSec: 180, muscleGroup: 'mobility', imageUrl: u('photo-1518611012118-696072aa579a') },
      { name: 'Band pull-apart', sets: 3, reps: 15, restSec: 45, muscleGroup: 'upper back', imageUrl: u('photo-1581009146145-b5ef050c2e1e') },
    ]),
  },
  {
    name: 'Minimal Equipment',
    description: 'Dumbbells and bodyweight only. Train anywhere in the gym.',
    difficulty: 'beginner',
    durationWeeks: 6,
    daysPerWeek: 3,
    program: twoDay(6, 3, 'Minimal', 'Day 1', [
      { name: 'Goblet squat', sets: 3, reps: 12, restSec: 75, muscleGroup: 'legs', imageUrl: u('photo-1434682881908-b43d0467b798') },
      { name: 'Push-up', sets: 3, reps: 12, restSec: 60, muscleGroup: 'chest', imageUrl: u('photo-1598971639058-fab3c3109a00') },
      { name: 'Single-arm row', sets: 3, reps: 10, restSec: 60, muscleGroup: 'back', imageUrl: u('photo-1581009146145-b5ef050c2e1e') },
    ], 'Day 2', [
      { name: 'Romanian deadlift', sets: 3, reps: 10, restSec: 90, muscleGroup: 'hamstrings', imageUrl: u('photo-1517836357463-d25dfeac3438') },
      { name: 'Shoulder press', sets: 3, reps: 10, restSec: 75, muscleGroup: 'shoulders', imageUrl: u('photo-1583454110551-21f2fa2afe61') },
    ]),
  },
  {
    name: 'Muscle Gain',
    description: 'Moderate reps, controlled tempo. Eat and sleep enough to recover.',
    difficulty: 'intermediate',
    durationWeeks: 10,
    daysPerWeek: 4,
    program: twoDay(10, 4, 'Hypertrophy', 'Volume upper', [
      { name: 'Incline bench', sets: 4, reps: 10, restSec: 75, muscleGroup: 'chest', imageUrl: u('photo-1583454110551-21f2fa2afe61') },
      { name: 'Cable row', sets: 4, reps: 12, restSec: 75, muscleGroup: 'back', imageUrl: u('photo-1581009146145-b5ef050c2e1e') },
    ], 'Volume lower', [
      { name: 'Hack squat', sets: 4, reps: 12, restSec: 90, muscleGroup: 'legs', imageUrl: u('photo-1434682881908-b43d0467b798') },
      { name: 'Leg extension', sets: 3, reps: 15, restSec: 60, muscleGroup: 'quads', imageUrl: u('photo-1571019614242-c5c5dee9f50b') },
    ]),
  },
  {
    name: 'Athletic Conditioning',
    description: 'Jumps, sprints, and carries. For sport or general athleticism.',
    difficulty: 'advanced',
    durationWeeks: 8,
    daysPerWeek: 3,
    program: twoDay(8, 3, 'Athletic', 'Power', [
      { name: 'Box jump', sets: 4, reps: 5, restSec: 120, muscleGroup: 'legs', imageUrl: u('photo-1571019614242-c5c5dee9f50b') },
      { name: 'Broad jump', sets: 4, reps: 5, restSec: 120, muscleGroup: 'power', imageUrl: u('photo-1571019614242-c5c5dee9f50b') },
    ], 'Conditioning', [
      { name: 'Farmer walk', sets: 3, durationSec: 40, restSec: 90, muscleGroup: 'grip', imageUrl: u('photo-1583454110551-21f2fa2afe61') },
      { name: 'Sled push', sets: 4, durationSec: 15, restSec: 90, muscleGroup: 'full body', imageUrl: u('photo-1534438327276-14e5300c3a48') },
    ]),
  },
  {
    name: 'Low Impact',
    description: 'Easier on joints. Machines and controlled ranges.',
    difficulty: 'beginner',
    durationWeeks: 6,
    daysPerWeek: 3,
    program: twoDay(6, 3, 'Low impact', 'Session 1', [
      { name: 'Recumbent bike', sets: 1, durationSec: 900, muscleGroup: 'cardio', imageUrl: u('photo-1538805060514-97d9cc17730c') },
      { name: 'Leg press light', sets: 3, reps: 15, restSec: 60, muscleGroup: 'legs', imageUrl: u('photo-1534438327276-14e5300c3a48') },
    ], 'Session 2', [
      { name: 'Chest press machine', sets: 3, reps: 12, restSec: 75, muscleGroup: 'chest', imageUrl: u('photo-1583454156274-4c48f42e4d1b') },
      { name: 'Lat pulldown light', sets: 3, reps: 12, restSec: 75, muscleGroup: 'back', imageUrl: u('photo-1581009146145-b5ef050c2e1e') },
    ]),
  },
  {
    name: 'Abs & Core',
    description: 'Core strength and stability. Add to other workouts or run standalone.',
    difficulty: 'beginner',
    durationWeeks: 4,
    daysPerWeek: 3,
    program: twoDay(4, 3, 'Core', 'Anti-extension', [
      { name: 'Plank', sets: 3, durationSec: 45, restSec: 45, muscleGroup: 'core', imageUrl: u('photo-1566241141449-7f1e8a4a4f2d') },
      { name: 'Dead bug', sets: 3, reps: 12, restSec: 45, muscleGroup: 'core', imageUrl: u('photo-1518611012118-696072aa579a') },
      { name: 'Pallof press', sets: 3, reps: 12, restSec: 60, muscleGroup: 'core', imageUrl: u('photo-1581009146145-b5ef050c2e1e') },
    ], 'Rotation', [
      { name: 'Cable woodchop', sets: 3, reps: 12, restSec: 60, muscleGroup: 'obliques', imageUrl: u('photo-1581009146145-b5ef050c2e1e') },
      { name: 'Russian twist', sets: 3, reps: 20, restSec: 45, muscleGroup: 'core', imageUrl: u('photo-1518611012118-696072aa579a') },
    ]),
  },
  {
    name: 'Active Recovery',
    description: 'Very light work between hard sessions. Keep effort easy.',
    difficulty: 'beginner',
    durationWeeks: 4,
    daysPerWeek: 2,
    program: prog({
      meta: { durationWeeks: 4, daysPerWeek: 2, focus: 'Recovery', locale: 'LK' },
      days: [
        {
          dayNumber: 1,
          title: 'Easy cardio',
          exercises: [
            { name: 'Easy bike', sets: 1, durationSec: 1200, muscleGroup: 'cardio', imageUrl: u('photo-1538805060514-97d9cc17730c') },
            { name: 'Walking treadmill', sets: 1, durationSec: 600, muscleGroup: 'cardio', imageUrl: u('photo-1576678927484-cc907957088c') },
          ],
        },
        {
          dayNumber: 2,
          title: 'Mobility & light movement',
          exercises: [
            { name: 'Foam roll — upper back', sets: 1, durationSec: 300, muscleGroup: 'mobility', imageUrl: u('photo-1518611012118-696072aa579a') },
            { name: 'Cat-cow', sets: 2, durationSec: 60, muscleGroup: 'mobility', imageUrl: u('photo-1518611012118-696072aa579a') },
            { name: 'Band pull-apart', sets: 3, reps: 15, restSec: 45, muscleGroup: 'upper back', imageUrl: u('photo-1581009146145-b5ef050c2e1e') },
          ],
        },
      ],
    }),
  },
  {
    name: 'Cricket & Field Sports',
    description: 'Rotational power and single-leg work. Common for local club players.',
    difficulty: 'intermediate',
    durationWeeks: 6,
    daysPerWeek: 3,
    program: twoDay(6, 3, 'Rotation', 'Rotation day', [
      { name: 'Medicine ball slam', sets: 3, reps: 10, restSec: 75, muscleGroup: 'core', imageUrl: u('photo-1517836357463-d25dfeac3438') },
      { name: 'Single-leg RDL', sets: 3, reps: 10, restSec: 75, muscleGroup: 'hamstrings', imageUrl: u('photo-1517832207060-4e900a6e0c8b') },
    ], 'Speed day', [
      { name: 'Sprint treadmill', sets: 6, durationSec: 20, restSec: 90, muscleGroup: 'cardio', imageUrl: u('photo-1576678927484-cc907957088c') },
      { name: 'Lateral bound', sets: 3, reps: 8, restSec: 75, muscleGroup: 'legs', imageUrl: u('photo-1571019614242-c5c5dee9f50b') },
    ]),
  },
];
