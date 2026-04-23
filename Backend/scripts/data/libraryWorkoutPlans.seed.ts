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
 * Pexels CDN; license: https://www.pexels.com/license/
 * Hero pool: 10483717, 6456006, 6388513, 14623668, 8032748, 6339342, 34043597, 8413737, 12966655, 6922154.
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
    description: 'Beginner Full Body: learn squat, push, pull, and core in three short gym sessions per week—built for your first weeks at GymSphere.',
    difficulty: 'beginner',
    durationWeeks: 4,
    daysPerWeek: 3,
    program: twoDay(
      4,
      3,
      'General fitness',
      px(10483717),
      'Beginner Full Body is for new GymSphere members: three non-consecutive days (e.g. Mon/Wed/Fri) with simple patterns (squat, push, pull, core). Prioritise smooth reps over weight—add load only when every rep matches the first.',
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
    description: 'Fat Loss Circuit: walk, bike, and light strength circuits to burn calories while keeping muscle—structured for real club cardio kit and busy schedules.',
    difficulty: 'beginner',
    durationWeeks: 6,
    daysPerWeek: 4,
    program: twoDay(
      6,
      4,
      'Fat loss',
      px(6456006),
      'Fat Loss Circuit pairs steady cardio with simple strength circuits. Keep cardio at a conversational-but-working effort (RPE ~6/10); swap in the bike or incline walk if knees complain. Match it with protein and sleep.',
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
    description: 'Push Pull Legs: the classic gym split—chest/shoulders/triceps, back/biceps, then legs—for members ready to train compounds several days a week.',
    difficulty: 'intermediate',
    durationWeeks: 8,
    daysPerWeek: 3,
    program: twoDay(
      8,
      3,
      'PPL',
      px(14623668),
      'Push Pull Legs rotates pressing, back work, and legs. Add 2.5–5 lb only when all target reps stay crisp; on compounds stay 1–2 reps shy of failure until week 5+.',
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
    description: 'Upper Lower Split: four sessions a week balancing upper-body pushing/pulling with knee- and hip-dominant leg work on the gym floor.',
    difficulty: 'intermediate',
    durationWeeks: 8,
    daysPerWeek: 4,
    program: twoDay(
      8,
      4,
      'Upper/Lower',
      px(8032748),
      'Upper Lower Split alternates upper and lower days (four sessions per week). If your lower back is fried, cut hinge volume next time; after a long run, deload by trimming sets ~30%.',
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
    description: 'Cardio & Core: club bike or elliptical plus planks and rotation work—steady effort that is kind to most joints.',
    difficulty: 'beginner',
    durationWeeks: 4,
    daysPerWeek: 3,
    program: twoDay(
      4,
      3,
      'Cardio',
      px(6388513),
      'Cardio & Core uses bike/elliptical for sustainable conditioning, then anti-extension and rotation core work. Use the talk test: you should speak in short sentences; add time or resistance weekly—not both at once.',
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
    description: 'Strength Basics: barbell squat, RDL, bench, and row with moderate reps—learn solid technique under sensible loads on the rack and platform.',
    difficulty: 'intermediate',
    durationWeeks: 8,
    daysPerWeek: 3,
    program: twoDay(
      8,
      3,
      'Strength',
      px(10483717),
      'Strength Basics centres on heavy squat, hinge, bench, and row patterns. Work around RPE 7–8 on mains; film squats now and then for depth. If the low back rounds on hinges, reduce load until the pattern is clean.',
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
    description: 'Glutes & Legs: quad-biased and posterior-chain sessions using leg press, lunges, hip thrusts, and curls—shaped for lower-body strength and shape.',
    difficulty: 'intermediate',
    durationWeeks: 6,
    daysPerWeek: 3,
    program: twoDay(
      6,
      3,
      'Lower body',
      px(6339342),
      'Glutes & Legs biases quads on one day and hamstrings/glutes on the other using presses, lunges, hip thrusts, and curls. Sandwich hard leg days with walking or upper work; fuel with carbs around these sessions.',
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
    description: 'Chest & Back: presses and rows in the same programme so shoulders stay balanced and posture stays strong.',
    difficulty: 'beginner',
    durationWeeks: 6,
    daysPerWeek: 3,
    program: twoDay(
      6,
      3,
      'Upper',
      px(14623668),
      'Chest & Back balances horizontal pressing with rows and pulldowns. If flat bench bites the shoulders, use a neutral machine press; aim for a bit more pull volume than push across the week.',
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
    description: 'Shoulders & Arms: lighter isolation work for delts, biceps, and triceps—good as an extra day or when you want less heavy compound stress.',
    difficulty: 'beginner',
    durationWeeks: 4,
    daysPerWeek: 3,
    program: twoDay(
      4,
      3,
      'Arms',
      px(34043597),
      'Shoulders & Arms keeps rests honest for shoulder presses, raises, curls, and pushdowns without maxing joints. Stop on sharp elbow or wrist pain—swap cable angles or dumbbells as needed.',
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
    description: 'HIIT Conditioning: machine sprints and low-impact power work—only if you are cleared for hard cardio and you warm up properly.',
    difficulty: 'advanced',
    durationWeeks: 6,
    daysPerWeek: 3,
    program: twoDay(
      6,
      3,
      'HIIT',
      px(6456006),
      'HIIT Conditioning uses rowing sprints, swings, fan bike, and jumps—short hard work with full recovery. Stop if dizzy or HR won’t settle; beginners should halve work intervals for two weeks. Keep easy movement on other days too.',
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
    description: 'Mobility & Stretch: gentle flows for hips, upper back, and shoulders between heavier training weeks.',
    difficulty: 'beginner',
    durationWeeks: 4,
    daysPerWeek: 3,
    program: twoDay(
      4,
      3,
      'Mobility',
      px(8413737),
      'Mobility & Stretch is active recovery on the floor: cat-cow, thoracic openers, hips, and band pull-aparts—no sharp pain, only comfortable range and steady breathing. Add easy walks on rest days.',
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
    description: 'Minimal Equipment: dumbbells and bodyweight only—full workouts when racks are busy or you train in a small corner.',
    difficulty: 'beginner',
    durationWeeks: 6,
    daysPerWeek: 3,
    program: twoDay(
      6,
      3,
      'Minimal',
      px(8032748),
      'Minimal Equipment needs only dumbbells and body weight: goblet squats, push-ups, rows, hinges, and presses. With light weights, slow the lowering phase and add reps before chasing heavier pairs.',
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
    description: 'Muscle Gain: higher-volume upper and lower sessions for size—machines and cables included for pump-friendly work.',
    difficulty: 'intermediate',
    durationWeeks: 10,
    daysPerWeek: 4,
    program: twoDay(
      10,
      4,
      'Hypertrophy',
      px(34043597),
      'Muscle Gain stacks moderate-rep upper and lower volume for hypertrophy. Eat a small surplus with ~1.6–2.2 g protein/kg if you are gaining; sleep 7+ h and add load or reps in small weekly steps.',
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
    description: 'Athletic Conditioning: jumps, throws, carries, and sled work for members who want a more field-ready feel.',
    difficulty: 'advanced',
    durationWeeks: 8,
    daysPerWeek: 3,
    program: twoDay(
      8,
      3,
      'Athletic',
      px(6456006),
      'Athletic Conditioning pairs low-volume jumps and broad jumps with carries and sled pushes. Land softly and rest fully between explosive sets; swap jumps for step-ups if ankles or knees grumble.',
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
    description: 'Low Impact: machines and controlled ranges for members who need less pounding on hips, knees, and shoulders but still want clear progression.',
    difficulty: 'beginner',
    durationWeeks: 6,
    daysPerWeek: 3,
    program: twoDay(
      6,
      3,
      'Low impact',
      px(6339342),
      'Low Impact uses bikes, leg press, and selectorized push/pull machines—smooth ranges only. Effort ~6–7/10; add resistance only when reps stay clean with no heel lift, neck strain, or white-knuckle grip.',
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
    description: 'Abs & Core: bracing, anti-rotation, and light rotation drills—stack after lifting or use as short standalone sessions.',
    difficulty: 'beginner',
    durationWeeks: 4,
    daysPerWeek: 3,
    program: twoDay(
      4,
      3,
      'Core',
      px(12966655),
      'Abs & Core mixes planks, dead bugs, anti-rotation presses, and controlled rotation. Exhale on the hardest moment; if flexion bothers your back, favour planks and Pallof work over heavy crunching.',
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
    description: 'Active Recovery: very easy cardio and mobility between hard days—blood flow without new fatigue.',
    difficulty: 'beginner',
    durationWeeks: 4,
    daysPerWeek: 2,
    program: prog({
      meta: {
        durationWeeks: 4,
        daysPerWeek: 2,
        focus: 'Recovery',
        locale: 'LK',
        coverImageUrl: px(6922154),
        programIntro: 'Active Recovery is two easy days: light bike, walking, foam rolling, and band pull-aparts. You should feel better leaving than arriving—use it when you are stiff, not when you need another hard session.',
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
];
