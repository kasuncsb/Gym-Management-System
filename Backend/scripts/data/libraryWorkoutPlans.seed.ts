/**
 * Library workout templates (source: library). One hero image per programme (meta.coverImageUrl);
 * exercises use text cues only — thumbnails live on the card/header.
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

type Ex = WorkoutProgramJson['days'][0]['exercises'][0];

/**
 * Programme hero (detail view only — library list uses text cards).
 * Pexels CDN with verified photo IDs (HTTP 200); license: https://www.pexels.com/license/
 */
const px = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1400&h=788&fit=crop`;
const YT = (id: string) => `https://www.youtube.com/watch?v=${id}`;

function prog(p: Omit<WorkoutProgramJson, 'schemaVersion'>): WorkoutProgramJson {
  return { schemaVersion: 1, ...p };
}

function ex(
  name: string,
  muscle: string,
  sets: number,
  reps: number | null,
  restSec: number,
  instructions: string,
  opts?: { durationSec?: number; equipment?: string; videoUrl?: string },
): Ex {
  return {
    name,
    sets,
    reps,
    durationSec: opts?.durationSec ?? null,
    restSec,
    muscleGroup: muscle,
    equipment: opts?.equipment ?? null,
    instructions,
    imageUrl: null,
    videoUrl: opts?.videoUrl ?? null,
  };
}

function twoDay(
  w: number,
  d: number,
  focus: string,
  cover: string,
  programIntro: string,
  day1: { title: string; notes?: string; exercises: Ex[] },
  day2: { title: string; notes?: string; exercises: Ex[] },
): WorkoutProgramJson {
  return prog({
    meta: {
      durationWeeks: w,
      daysPerWeek: d,
      focus,
      locale: 'LK',
      coverImageUrl: cover,
      programIntro,
    },
    days: [
      { dayNumber: 1, title: day1.title, notes: day1.notes ?? null, exercises: day1.exercises },
      { dayNumber: 2, title: day2.title, notes: day2.notes ?? null, exercises: day2.exercises },
    ],
  });
}

export const LIBRARY_WORKOUT_PLANS: LibraryPlanSeed[] = [
  {
    name: 'Beginner Full Body',
    description: 'Learn fundamental movement patterns with manageable volume. Perfect for your first month in the gym.',
    difficulty: 'beginner',
    durationWeeks: 4,
    daysPerWeek: 3,
    program: twoDay(
      4,
      3,
      'General fitness',
      px(1552242),
      'Train three non-consecutive days (e.g. Mon/Wed/Fri). Leave at least one rest day between sessions. Prioritise smooth reps over weight: add load only when every rep looks identical to the first.',
      {
        title: 'Day A — legs & core',
        notes: 'Warm up 5–8 min easy bike or brisk walk, then 2 light rounds of bodyweight squats and leg swings.',
        exercises: [
          ex('Goblet squat', 'legs', 3, 12, 60, 'Hold one dumbbell at your chest. Sit hips back, spine tall, knees track over toes. Descend until thighs are near parallel if mobility allows. Drive through mid-foot to stand. Stop if knees cave inward—reduce depth or weight.', { equipment: 'One dumbbell or kettlebell', videoUrl: YT('aclHkVaku9U') }),
          ex('Glute bridge', 'glutes', 3, 15, 45, 'Lie on your back, feet hip-width. Brace your core, squeeze glutes, and lift hips until body forms a straight line from knees to shoulders. Pause 1 sec at top; lower with control.', { equipment: 'Mat' }),
          ex('Plank', 'core', 3, null, 45, 'Forearms down, elbows under shoulders. Pull belly button toward spine; keep hips level—no pike or sag. Breathe behind the brace. If form breaks, shorten the hold.', { durationSec: 30, equipment: 'Mat' }),
        ],
      },
      {
        title: 'Day B — push & pull',
        notes: 'Include shoulder circles and band pull-aparts before pressing or rowing.',
        exercises: [
          ex('Incline push-up', 'chest', 3, 10, 60, 'Hands on a bench or Smith bar—body in straight line. Lower chest toward surface; press away keeping elbows ~45° from ribs. Move bench lower as you get stronger.', { equipment: 'Bench or stable box' }),
          ex('Dumbbell row', 'back', 3, 12, 60, 'One hand and knee on bench, flat back. Row dumbbell to hip pocket without rotating torso. Think “elbow to ceiling.” Control the lowering phase 2–3 sec.', { equipment: 'Bench, dumbbell' }),
          ex('Dead bug', 'core', 3, 10, 45, 'On back, arms up, hips and knees at 90°. Slowly extend opposite arm and leg toward floor while low back stays pressed down. Exhale as you extend.', { equipment: 'Mat' }),
        ],
      },
    ),
  },
  {
    name: 'Fat Loss Circuit',
    description: 'Mix steady cardio with simple strength to burn calories while preserving muscle. Keep rest honest—quality matters.',
    difficulty: 'beginner',
    durationWeeks: 6,
    daysPerWeek: 4,
    program: twoDay(
      6,
      4,
      'Fat loss',
      px(2294363),
      'Aim for a conversational-but-working effort on cardio blocks (RPE ~6/10). If joint pain appears, substitute cycling or incline walk. Pair this plan with consistent protein and sleep for best results.',
      {
        title: 'Circuit 1 — cardio + legs + core',
        notes: 'Complete the list in order; repeat circuit twice through as you adapt.',
        exercises: [
          ex('Treadmill walk or incline', 'cardio', 1, null, 0, '15 min continuous. Slight incline (2–4%) increases demand without impact. Hold the rail only for balance resets.', { durationSec: 900, equipment: 'Treadmill' }),
          ex('Bodyweight squat', 'legs', 3, 15, 45, 'Feet shoulder-width. Sit back as if into a chair; knees stay over mid-foot. Drive up tall. Add a light dumbbell goblet style when 15 reps feels easy.', { equipment: 'Optional dumbbell' }),
          ex('Mountain climber', 'core', 3, null, 45, 'High plank. Alternate drawing knees toward chest at a controlled pace. Hips low—run “under” the body, not piking up.', { durationSec: 30 }),
        ],
      },
      {
        title: 'Circuit 2 — bike & unilateral legs',
        notes: 'Cool down 5 min easy spin after the last strength move.',
        exercises: [
          ex('Exercise bike', 'cardio', 1, null, 0, '10 min steady moderate resistance; smooth cadence 70–90 rpm. Push through whole foot—avoid rocking hips.', { durationSec: 600, equipment: 'Upright or recumbent bike' }),
          ex('Forward lunge', 'legs', 3, 10, 60, 'Step long enough that front shin stays vertical. Lower to gentle knee tap; drive through front heel. Alternate legs each rep. Use dumbbells at sides when ready.', { equipment: 'Optional dumbbells' }),
        ],
      },
    ),
  },
  {
    name: 'Push Pull Legs',
    description: 'Classic split: push, pull, legs on rotating days. Ideal once you are comfortable with compound lifts.',
    difficulty: 'intermediate',
    durationWeeks: 8,
    daysPerWeek: 3,
    program: twoDay(
      8,
      3,
      'PPL',
      px(416475),
      'Run Push → Pull → Legs (or rotate as your schedule allows). Add 2.5–5 lb to main lifts weekly only when all target reps are clean. Stop 1–2 reps short of failure on compounds until week 5+.',
      {
        title: 'Push — chest, shoulders, triceps',
        notes: '5 min general warm-up plus 2 light sets of your first press before working sets.',
        exercises: [
          ex('Barbell or dumbbell bench press', 'chest', 4, 8, 120, 'Retract shoulder blades; slight arch is fine. Bar to mid-chest; press along a slight arc. Feet planted; drive knees out for leg drive without lifting hips.', { equipment: 'Barbell or dumbbells, bench' }),
          ex('Overhead press', 'shoulders', 3, 8, 90, 'Stand tall, glutes squeezed. Bar or dumbbells move straight up, head “through the window” at top. Avoid excessive lean back—tighten core.', { equipment: 'Barbell or dumbbells' }),
          ex('Cable triceps pushdown', 'arms', 3, 12, 60, 'Elbows pinned at ribs. Extend fully without shrugging shoulders. Split rope ends at bottom for extra triceps length.', { equipment: 'Cable stack, rope or bar' }),
        ],
      },
      {
        title: 'Pull — back, rear shoulders, biceps',
        notes: 'Start with scap pull-downs or band face pulls to “switch on” the upper back.',
        exercises: [
          ex('Lat pulldown', 'back', 4, 10, 90, 'Grip just outside shoulders. Pull elbows down and slightly back—chest meets bar path. Slight lean is OK; avoid yanking with momentum.', { equipment: 'Lat pulldown' }),
          ex('Seated cable row', 'back', 3, 12, 75, 'Sit tall; pull handle to lower ribs. Pause, squeeze shoulder blades, release slowly. Don’t round forward between reps.', { equipment: 'Seated row' }),
          ex('Face pull', 'shoulders', 3, 15, 45, 'Rope at upper chest height. Pull toward face, elbows high, external rotate so hands flank ears. Great for posture between desk sessions.', { equipment: 'Cable, rope' }),
        ],
      },
    ),
  },
  {
    name: 'Upper Lower Split',
    description: 'Four weekly sessions balancing upper and lower body. Strong choice for intermediate trainees who like structure.',
    difficulty: 'intermediate',
    durationWeeks: 8,
    daysPerWeek: 4,
    program: twoDay(
      8,
      4,
      'Upper/Lower',
      px(3775166),
      'Alternate Upper A / Lower A / Upper B / Lower B across the week. Match paired muscle fatigues: if lower back feels fried, reduce hinge volume next session. Deload on week 9 if you extend—cut sets by ~30%.',
      {
        title: 'Upper — horizontal push & pull',
        notes: 'Track total pressing volume; cap if shoulders feel cranky.',
        exercises: [
          ex('Chest press machine or Smith', 'chest', 3, 12, 75, 'Adjust seat so handles align mid-chest. Press without locking elbows violently. Full control on the negative.', { equipment: 'Machine or Smith machine' }),
          ex('Lat pulldown', 'back', 3, 12, 75, 'Same cues as PPL day—priority is lat engagement, not leaning far back.', { equipment: 'Lat pulldown' }),
          ex('Dumbbell lateral raise', 'shoulders', 3, 12, 60, 'Slight bend in elbows. Raise to shoulder height; lead with elbows, not hands. Use 2–3 sec lowering tempo.', { equipment: 'Dumbbells' }),
        ],
      },
      {
        title: 'Lower — knee & hip dominant',
        notes: 'Warm up hips and ankles: leg swings, bodyweight squats, light leg press.',
        exercises: [
          ex('Leg press', 'legs', 4, 12, 90, 'Feet mid-plate, shoulder-width. Depth where low back stays glued to pad. Don’t bounce at bottom. Push evenly through feet.', { equipment: 'Leg press' }),
          ex('Lying leg curl', 'hamstrings', 3, 12, 60, 'Align knee with pivot. Curl heels toward glutes without lifting hips. Pause 1 sec shortened position.', { equipment: 'Leg curl' }),
          ex('Standing calf raise', 'calves', 3, 15, 45, 'Ball of foot on step. Rise tall through big toe; stretch calf at bottom without collapsing into ankle.', { equipment: 'Calf block or step' }),
        ],
      },
    ),
  },
  {
    name: 'Cardio & Core',
    description: 'Sustainable conditioning with anti-extension and rotation core work. Friendly on most joints.',
    difficulty: 'beginner',
    durationWeeks: 4,
    daysPerWeek: 3,
    program: twoDay(
      4,
      3,
      'Cardio',
      px(260352),
      'Use “talk test” for steady cardio: you should speak in short sentences. Progress by +5% time or small resistance bumps weekly, not both at once.',
      {
        title: 'Session A — bike & anti-extension',
        notes: 'Hydrate; core work comes after the longer cardio bout when you’re warm.',
        exercises: [
          ex('Stationary bike', 'cardio', 1, null, 0, '20 min steady. Keep cadence steady; don’t grind heavy gears that dead-stop the knees.', { durationSec: 1200, equipment: 'Bike' }),
          ex('Forearm plank', 'core', 3, null, 45, 'Progress from knees if needed. Ribs down, glutes on, gaze slightly ahead of fingers.', { durationSec: 40 }),
          ex('Bicycle crunch', 'core', 3, 20, 45, 'Slow contralateral elbow-to-knee; shoulder blades peel off floor. Quality over speed.', { equipment: 'Mat' }),
        ],
      },
      {
        title: 'Session B — elliptical & side core',
        notes: 'Light dynamic stretch for hips after elliptical.',
        exercises: [
          ex('Elliptical', 'cardio', 1, null, 0, '15 min moderate; maintain upright posture—avoid leaning on handles.', { durationSec: 900, equipment: 'Elliptical' }),
          ex('Side plank', 'core', 3, null, 45, 'Elbow under shoulder; stack feet or stagger for balance. Lift hips in a straight line. Switch sides each set.', { durationSec: 30, equipment: 'Mat' }),
        ],
      },
    ),
  },
  {
    name: 'Strength Basics',
    description: 'Heavy compounds with moderate reps. Built for learning barbell technique under sensible load.',
    difficulty: 'intermediate',
    durationWeeks: 8,
    daysPerWeek: 3,
    program: twoDay(
      8,
      3,
      'Strength',
      px(1547248),
      'Use RPE 7–8 on working sets: you could do 2 more reps with perfect form if forced. Video your squats occasionally to check depth and bar path. If lower back rounds on deadlifts, lower weight until hinge pattern is crisp.',
      {
        title: 'Heavy A — squat & hinge',
        notes: 'Mobility: hip airplanes, bodyweight squat holds, empty bar patterns.',
        exercises: [
          ex('Back squat', 'legs', 4, 6, 120, 'High-bar or low-bar per comfort. Break hips and knees together. Hit depth you own today—parallel or slightly below if mobile. Breathe and brace at top, hold through sticking point.', { equipment: 'Squat rack, barbell' }),
          ex('Romanian deadlift', 'posterior chain', 3, 8, 90, 'Soft knee bend fixed. Push hips back; bar skims legs. Feel hamstrings load; stop before back rounds. Stand by driving hips forward, not hyperextending spine.', { equipment: 'Barbell or dumbbells' }),
        ],
      },
      {
        title: 'Heavy B — horizontal press & row',
        notes: 'Bench arch mild—focus on stable shoulders.',
        exercises: [
          ex('Bench press', 'chest', 4, 6, 120, 'Legal-width grip, wrists stacked. Touch controlled; press in slight arc. Ask for a spot on near-limit sets.', { equipment: 'Bench, barbell' }),
          ex('Barbell row', 'back', 4, 8, 90, 'Hinge until torso ~45° or supported on bench if preferred. Row to lower ribs, elbows track back. No jerk—squeeze mid-back each rep.', { equipment: 'Barbell' }),
        ],
      },
    ),
  },
  {
    name: 'Glutes & Legs',
    description: 'Bias toward quads one day, hamstrings and glutes the next. Great for lower-body shape and performance.',
    difficulty: 'intermediate',
    durationWeeks: 6,
    daysPerWeek: 3,
    program: twoDay(
      6,
      3,
      'Lower body',
      px(1552241),
      'Place a “walking” day between sessions or upper-body work. Foam-roll quads/IT band lightly if you’re new to high leg volume. Eat sufficient carbs around these workouts.',
      {
        title: 'Quad focus',
        notes: 'Heel wedges optional for squat-pattern comfort.',
        exercises: [
          ex('Leg press', 'legs', 4, 12, 90, 'Feet slightly lower on sled biases quads—stop if knees feel pinched. Full ROM without butt rounding off pad.', { equipment: 'Leg press' }),
          ex('Walking lunge', 'legs', 3, 10, 60, 'Torso tall; vertical shin on front leg. Long step reduces forward knee travel. Dumbbells at sides when stable.', { equipment: 'Optional dumbbells' }),
        ],
      },
      {
        title: 'Posterior chain & glutes',
        notes: 'Pre-activate: banded glute bridges, bodyweight hip hinges.',
        exercises: [
          ex('Hip thrust', 'glutes', 4, 10, 75, 'Upper back on bench; bar or dumbbell on hips. Chin tucked slightly; drive hips up squeezing glutes—no over-arching low back at top.', { equipment: 'Barbell or dumbbell, bench' }),
          ex('Lying leg curl', 'hamstrings', 3, 12, 60, 'Match machine settings so pad sits above heel. Control the negative—don’t let weight stack crash.', { equipment: 'Leg curl' }),
        ],
      },
    ),
  },
  {
    name: 'Chest & Back',
    description: 'Balanced horizontal push and pull to keep shoulders happy and posture strong.',
    difficulty: 'beginner',
    durationWeeks: 6,
    daysPerWeek: 3,
    program: twoDay(
      6,
      3,
      'Upper',
      px(1552105),
      'If bench causes sharp shoulder pain, substitute neutral-grip machine press. Pull slightly more volume than push over the week when possible.',
      {
        title: 'Chest emphasis',
        notes: 'Retract and depress shoulder blades before first press set.',
        exercises: [
          ex('Chest press machine', 'chest', 3, 12, 75, 'Seat height mid-chest to handles. Smooth reps—no locking out aggressively.', { equipment: 'Selectorized machine' }),
          ex('Incline dumbbell press', 'chest', 3, 10, 75, '15–30° bench. Dumbbells travel slightly inward at top. Elbows ~45° from torso.', { equipment: 'Dumbbells, incline bench' }),
        ],
      },
      {
        title: 'Back emphasis',
        notes: 'Think “elbows to back pockets” on rows.',
        exercises: [
          ex('Seated cable row', 'back', 4, 12, 75, 'Neutral spine; handle to belly. Don’t use torso swing to cheat reps.', { equipment: 'Cable row' }),
          ex('Straight-arm pulldown', 'back', 3, 12, 60, 'Hinge slightly; arms straight. Pull bar to thighs with lats. Stop if elbows bend—reduce weight.', { equipment: 'Cable, straight bar' }),
        ],
      },
    ),
  },
  {
    name: 'Shoulders & Arms',
    description: 'Controlled isolation for delts and arms—ideal as an accessory day or lighter block.',
    difficulty: 'beginner',
    durationWeeks: 4,
    daysPerWeek: 3,
    program: twoDay(
      4,
      3,
      'Arms',
      px(703016),
      'Keep rests strict to create metabolic stress without heavy joint load. Stop any exercise that causes sharp elbow or wrist pain—swap cable for dumbbell angles.',
      {
        title: 'Shoulders',
        notes: 'Light rear-delt work beforehand reduces impingement risk on presses.',
        exercises: [
          ex('Dumbbell shoulder press', 'shoulders', 3, 10, 75, 'Seated with back support. Press without locking aggressively. Stop shy of pain through painful arc—adjust grip width.', { equipment: 'Dumbbells, bench' }),
          ex('Dumbbell lateral raise', 'shoulders', 3, 12, 60, 'Slight forward lean often feels better on cuffs. Stop at comfortable height—parallel isn’t mandatory.', { equipment: 'Dumbbells' }),
        ],
      },
      {
        title: 'Arms',
        notes: 'Superset optional: curl then pushdown with same rest.',
        exercises: [
          ex('Cable curl', 'biceps', 3, 12, 60, 'Elbows fixed at sides; full extension without resting tension off. Squeeze biceps peak.', { equipment: 'Cable, bar or EZ' }),
          ex('Triceps rope pushdown', 'triceps', 3, 12, 60, 'Same cues as PPL—keep shoulders down; split rope at bottom.', { equipment: 'Cable, rope' }),
        ],
      },
    ),
  },
  {
    name: 'HIIT Conditioning',
    description: 'Short maximal efforts with full recovery. Requires solid warm-up and baseline cardio clearance.',
    difficulty: 'advanced',
    durationWeeks: 6,
    daysPerWeek: 3,
    program: twoDay(
      6,
      3,
      'HIIT',
      px(3757376),
      'If you feel dizzy or heart rate won’t come down between rounds, end the session. Beginners should halve work intervals for two weeks. HIIT is supplement, not replacement for easy movement on other days.',
      {
        title: 'Round 1 — rowing & ballistic hinge',
        notes: '10 min gradual rowing + dynamic drills before first sprint.',
        exercises: [
          ex('Rowing sprint', 'cardio', 6, null, 90, 'Damper ~4–6. Each interval: hard drive with legs, then swing, then arms; reverse smoothly. Aim consistent split, not first-interval heroics.', { durationSec: 30, equipment: 'Rower' }),
          ex('Kettlebell swing', 'full body', 3, 15, 60, 'Hinge, not squat. Power from hips; arms are hooks. Stop if low back feels pulled—lighten or shorten range.', { equipment: 'Kettlebell', videoUrl: YT('YSxHmlUo_v8') }),
        ],
      },
      {
        title: 'Round 2 — bike & jump',
        notes: 'Land softly with hips and knees flexing; step down if questionable.',
        exercises: [
          ex('Assault or fan bike', 'cardio', 6, null, 90, 'Short bursts; drive arms and legs together. Sit tall; don’t collapse between intervals until planned rest.', { durationSec: 20, equipment: 'Fan bike' }),
          ex('Box jump', 'legs', 3, 8, 75, 'Jump onto sturdy box; step down. Hips extend fully before takeoff. Choose conservative height—shin safety first.', { equipment: 'Plyo box' }),
        ],
      },
    ),
  },
  {
    name: 'Mobility & Stretch',
    description: 'Recovery-focused movement: open hips, thoracic spine, and shoulders after hard weeks.',
    difficulty: 'beginner',
    durationWeeks: 4,
    daysPerWeek: 3,
    program: twoDay(
      4,
      3,
      'Mobility',
      px(3757949),
      'Treat this as active recovery: never push into sharp pain—only comfortable stretch + breath. Pair with easy walks on off days.',
      {
        title: 'Flow A — spine and hips',
        notes: 'Slow nasal breathing helps down-shift the nervous system.',
        exercises: [
          ex('Cat-cow', 'mobility', 2, null, 0, 'Hands under shoulders, knees under hips. Alternate flexion and extension through whole spine. Move with breath.', { durationSec: 60 }),
          ex('Half-kneeling hip flexor stretch', 'hips', 2, null, 0, 'Back knee cushioned; tuck pelvis under until front hip flexor lengthens. Squeeze glute on rear leg side. Hold steady pressure—no bouncing.', { durationSec: 45 }),
          ex('Thoracic extension over foam roller', 'upper back', 2, null, 0, 'Roller at mid-back; hands support head. Small extensions segment by segment; keep ribs from flaring.', { durationSec: 60, equipment: 'Foam roller' }),
        ],
      },
      {
        title: 'Flow B — upper back and posture',
        notes: 'Light band tension only—you should feel mid-back, not neck strain.',
        exercises: [
          ex('Foam roll upper back', 'mobility', 1, null, 0, 'Slow rolls; pause on tender spots 20–30 sec with gentle movement.', { durationSec: 180, equipment: 'Foam roller' }),
          ex('Band pull-apart', 'upper back', 3, 15, 45, 'Arms straight, slight shoulder-elevation angle. Pull band to chest with external rotation squeeze between shoulder blades.', { equipment: 'Resistance band' }),
        ],
      },
    ),
  },
  {
    name: 'Minimal Equipment',
    description: 'Dumbbells and bodyweight only—train effectively anywhere in the club.',
    difficulty: 'beginner',
    durationWeeks: 6,
    daysPerWeek: 3,
    program: twoDay(
      6,
      3,
      'Minimal',
      px(3838950),
      'If dumbbells are limited, use tempo (3 sec lowering) and higher reps before chasing heavier pairs. Log workouts—progress beats random variety.',
      {
        title: 'Day 1 — squat, push, pull',
        notes: 'Clear floor space; have water nearby—tri-set style optional.',
        exercises: [
          ex('Goblet squat', 'legs', 3, 12, 75, 'Elbows inside knees at bottom to drive knees out. Heels stay glued; torso as upright as mobility allows.', { equipment: 'One dumbbell' }),
          ex('Push-up', 'chest', 3, 12, 60, 'Hands under shoulders, body plank. Chest to fist height; press maintaining line from head to heel. Incline hands on bench if needed.', { equipment: 'Mat' }),
          ex('Single-arm dumbbell row', 'back', 3, 10, 60, 'Split stance, hand on knee, flat torso. Row to hip without rotating.', { equipment: 'Dumbbell' }),
        ],
      },
      {
        title: 'Day 2 — hinge & shoulders',
        notes: 'Soft bend in knees fixed throughout RDL.',
        exercises: [
          ex('Romanian deadlift', 'hamstrings', 3, 10, 90, 'Hold dumbbells in front of thighs. Hip hinge until hamstrings limit you; shoulders stay packed.', { equipment: 'Dumbbells' }),
          ex('Dumbbell shoulder press', 'shoulders', 3, 10, 75, 'Standing or seated. Press without shrugging; stop short of painful lockout if needed.', { equipment: 'Dumbbells' }),
        ],
      },
    ),
  },
  {
    name: 'Muscle Gain',
    description: 'Hypertrophy bias: moderate reps, controlled negatives, and enough weekly volume to grow.',
    difficulty: 'intermediate',
    durationWeeks: 10,
    daysPerWeek: 4,
    program: twoDay(
      10,
      4,
      'Hypertrophy',
      px(3838961),
      'Eat at a slight surplus with ~1.6–2.2 g protein/kg bodyweight if gaining. Sleep 7+ hours—muscle is built away from the gym. Track loads and beat logbook small amounts weekly.',
      {
        title: 'Volume upper',
        notes: '2–3 min rest on compounds; 60–90s on isolations.',
        exercises: [
          ex('Incline barbell or Smith press', 'chest', 4, 10, 75, 'Incline 15–30°. Lower to upper chest; elbows under bar path. Mind-muscle: feel upper pec load.', { equipment: 'Bar or Smith, incline bench' }),
          ex('Seated cable row', 'back', 4, 12, 75, 'V-grip or parallel handle. Pull low ribs; squeeze full upper back each rep.', { equipment: 'Cable row' }),
        ],
      },
      {
        title: 'Volume lower',
        notes: 'Pre-fatigue option: leg extension before squat pattern—use sparingly.',
        exercises: [
          ex('Hack squat or V-squat', 'legs', 4, 12, 90, 'Foot stance moderate; descend under control; don’t bounce out of bottom. Stop if knees track poorly—widen or reduce depth.', { equipment: 'Hack squat' }),
          ex('Leg extension', 'quads', 3, 15, 60, 'Align knee pivot; extend without snapping lockout. Lower slowly—2–3 sec.', { equipment: 'Leg extension' }),
        ],
      },
    ),
  },
  {
    name: 'Athletic Conditioning',
    description: 'Power, elastic legs, and loaded carries. For members who want a sportier edge.',
    difficulty: 'advanced',
    durationWeeks: 8,
    daysPerWeek: 3,
    program: twoDay(
      8,
      3,
      'Athletic',
      px(3838970),
      'Jump volumes are small but intense—land quietly. Full recovery between explosive sets. If sore Achilles or knees, replace jumps with low box step-ups.',
      {
        title: 'Power',
        notes: 'Dynamic warm-up: skips, pogo hops, build-up sprints.',
        exercises: [
          ex('Box jump', 'legs', 4, 5, 120, 'Stand close; soft catch on box, stand tall. Step down. Reset posture each rep—stop if knees collapse inward.', { equipment: 'Plyo box' }),
          ex('Broad jump', 'power', 4, 5, 120, 'Swing arms, hinge, jump forward for distance. Stick landing in athletic position; walk back for recovery.', { equipment: 'Open floor' }),
        ],
      },
      {
        title: 'Conditioning & grip',
        notes: 'Farmer walks tax grip—chalk or straps only if form stays strict.',
        exercises: [
          ex('Farmer walk', 'grip', 3, null, 90, 'Heavy dumbbells at sides; tall chest, short quick steps. Walk 20–40 m or timed 40 sec.', { durationSec: 40, equipment: 'Heavy dumbbells' }),
          ex('Sled push', 'full body', 4, null, 90, 'Body angle low; drive knees; don’t round deeply. Short hard pushes—quality posture over speed slips.', { durationSec: 15, equipment: 'Sled' }),
        ],
      },
    ),
  },
  {
    name: 'Low Impact',
    description: 'Machines and smooth ranges—easier on joints while you still progress.',
    difficulty: 'beginner',
    durationWeeks: 6,
    daysPerWeek: 3,
    program: twoDay(
      6,
      3,
      'Low impact',
      px(3839010),
      'Effort should feel sustainable (6–7/10). Increase resistance only when you can complete all reps without compensating—heel lifting, neck straining, or grip dying.',
      {
        title: 'Session 1 — bike & legs',
        notes: 'Recumbent or upright per comfort; either is fine.',
        exercises: [
          ex('Recumbent or upright bike', 'cardio', 1, null, 0, '15 min continuous. Smooth circles—no mashing. Note wattage or level; bump weekly if easy.', { durationSec: 900, equipment: 'Bike' }),
          ex('Leg press — light to moderate', 'legs', 3, 15, 60, 'Higher foot placement can reduce knee shear—find stance that feels smooth. No locking knees hard at top.', { equipment: 'Leg press' }),
        ],
      },
      {
        title: 'Session 2 — push & pull machines',
        notes: 'Neutral-grip options if shoulders sensitive.',
        exercises: [
          ex('Chest press machine', 'chest', 3, 12, 75, 'Adjust seat; handles mid-chest at start. Even push; shoulder blades stable on pad.', { equipment: 'Chest machine' }),
          ex('Lat pulldown — light', 'back', 3, 12, 75, 'Controlled—this is pattern practice, not ego weight. Feel lats, not biceps-only jerk.', { equipment: 'Lat pulldown' }),
        ],
      },
    ),
  },
  {
    name: 'Abs & Core',
    description: 'Anti-extension, rotation, and bracing—use as add-on or standalone short sessions.',
    difficulty: 'beginner',
    durationWeeks: 4,
    daysPerWeek: 3,
    program: twoDay(
      4,
      3,
      'Core',
      px(3839020),
      'Breathe: exhale on hardest moment of each rep to maintain pressure. Low back pain with flexion? Limit crunch-style volume and favour planks and Pallof.',
      {
        title: 'Anti-extension',
        notes: 'Keep ribs “down” relative to pelvis during planks.',
        exercises: [
          ex('Forearm plank', 'core', 3, null, 45, 'See earlier cues; add slight posterior pelvic tilt to feel abs more.', { durationSec: 45 }),
          ex('Dead bug', 'core', 3, 12, 45, 'Slow and controlled; don’t let low back arch as limbs extend.', { equipment: 'Mat' }),
          ex('Half-kneeling cable Pallof press', 'core', 3, 12, 60, 'Cable at chest; press straight out resisting rotation. Torso square to front.', { equipment: 'Cable stack' }),
        ],
      },
      {
        title: 'Rotation',
        notes: 'Rotate from mid-back, not neck.',
        exercises: [
          ex('Cable woodchop — high to low', 'obliques', 3, 12, 60, 'Pivot rear foot; hands on rope handle; diagonal chop toward hip. Control return.', { equipment: 'Cable' }),
          ex('Slow Russian twist', 'core', 3, 20, 45, 'Feet down if back arches. Rotate shoulders toward each side; weight optional and light.', { equipment: 'Optional plate' }),
        ],
      },
    ),
  },
  {
    name: 'Active Recovery',
    description: 'Very light movement between hard days—support blood flow, not fatigue.',
    difficulty: 'beginner',
    durationWeeks: 4,
    daysPerWeek: 2,
    program: prog({
      meta: {
        durationWeeks: 4,
        daysPerWeek: 2,
        focus: 'Recovery',
        locale: 'LK',
        coverImageUrl: px(3839040),
        programIntro: 'Effort stays easy—you should finish feeling better than you started. Use this instead of sitting still on rest days when you wake up stiff.',
      },
      days: [
        {
          dayNumber: 1,
          title: 'Easy cardio',
          notes: 'Nasal or relaxed mouth breathing; no burn.',
          exercises: [
            ex('Easy bike', 'cardio', 1, null, 0, '20 min zone 2 if you track HR; otherwise “could hold a full conversation.”', { durationSec: 1200, equipment: 'Bike' }),
            ex('Walking treadmill', 'cardio', 1, null, 0, '10 min incline 0–5%; swing arms naturally.', { durationSec: 600, equipment: 'Treadmill' }),
          ],
        },
        {
          dayNumber: 2,
          title: 'Mobility & light movement',
          notes: 'Stop any drill that causes pinch or sharp pain.',
          exercises: [
            ex('Foam roll — upper back', 'mobility', 1, null, 0, 'Slow; 5 min total along thoracic area.', { durationSec: 300, equipment: 'Foam roller' }),
            ex('Cat-cow', 'mobility', 2, null, 0, 'Gentle amplitude only.', { durationSec: 60 }),
            ex('Band pull-apart', 'upper back', 3, 15, 45, 'Easy tension; feel postural muscles switch on.', { equipment: 'Band' }),
          ],
        },
      ],
    }),
  },
  {
    name: 'Cricket & Field Sports',
    description: 'Rotational power, single-leg stability, and repeat sprint ability for pitch or field work.',
    difficulty: 'intermediate',
    durationWeeks: 6,
    daysPerWeek: 3,
    program: twoDay(
      6,
      3,
      'Rotation',
      px(3839090),
      'Match skill work to pre-season timing: heavy gym days not the day before a match. Prioritise sleep and fuel—repeat sprints demand glycogen.',
      {
        title: 'Rotation & hinge',
        notes: 'Med ball throws—choose weight you can move FAST.',
        exercises: [
          ex('Medicine ball slam', 'core', 3, 10, 75, 'Ball overhead; hinge slightly; slam hard into floor. Catch on bounce; reset tall. Stop if low back tires—reduce reps.', { equipment: 'Medicine ball' }),
          ex('Single-leg Romanian deadlift', 'hamstrings', 3, 10, 75, 'Kickstand or true single leg—hip stays level. Light dumbbell; balance over load.', { equipment: 'Dumbbell' }),
        ],
      },
      {
        title: 'Speed & lateral power',
        notes: 'Full rest between sprints—quality over quantity.',
        exercises: [
          ex('Treadmill sprint or Assault bike burst', 'cardio', 6, null, 90, '6× ~20 sec hard / easy recovery. If on treadmill, secure clip; controlled acceleration.', { durationSec: 20, equipment: 'Treadmill or bike' }),
          ex('Lateral bound', 'legs', 3, 8, 75, 'Push off outside leg; land softly on opposite leg in athletic stance. Short distances, crisp landings.', { equipment: 'Open floor' }),
        ],
      },
    ),
  },
];
