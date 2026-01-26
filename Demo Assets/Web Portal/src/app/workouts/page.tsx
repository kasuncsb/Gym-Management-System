'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";

export default function WorkoutsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedDuration, setSelectedDuration] = useState('all');
  const [activeWorkout, setActiveWorkout] = useState<number | null>(null);
  const [workoutTimer, setWorkoutTimer] = useState(0);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);

  const categories = [
    { id: 'all', name: 'All Workouts', icon: '/workouts/full-body.jpg' },
    { id: 'strength', name: 'Strength Training', icon: '/workouts/upper-body-strength.jpg' },
    { id: 'cardio', name: 'Cardio', icon: '/workouts/lower-body.jpg' },
    { id: 'hiit', name: 'HIIT', icon: '/workouts/hiit.jpg' },
    { id: 'yoga', name: 'Yoga & Flexibility', icon: '/workouts/yoga.jpg' },
    { id: 'functional', name: 'Functional', icon: '/workouts/core-crush.jpg' }
  ];

  const difficulties = [
    { id: 'all', name: 'All Levels' },
    { id: 'beginner', name: 'Beginner' },
    { id: 'intermediate', name: 'Intermediate' },
    { id: 'advanced', name: 'Advanced' }
  ];

  const durations = [
    { id: 'all', name: 'Any Duration' },
    { id: '15', name: '15 min' },
    { id: '30', name: '30 min' },
    { id: '45', name: '45 min' },
    { id: '60', name: '60+ min' }
  ];

  const workoutPlans = [
    {
      id: 1,
      name: 'Upper Body Strength',
      category: 'strength',
      difficulty: 'intermediate',
      duration: 45,
      calories: 320,
      exercises: 8,
      description: 'Build upper body strength with compound movements',
      image: '/workouts/upper-body-strength.jpg',
      exerciseList: [
        { name: 'Bench Press', sets: 4, reps: '8-10', rest: '2-3 min' },
        { name: 'Pull-ups', sets: 3, reps: '6-8', rest: '2-3 min' },
        { name: 'Overhead Press', sets: 3, reps: '8-10', rest: '2-3 min' },
        { name: 'Barbell Rows', sets: 3, reps: '8-10', rest: '2-3 min' },
        { name: 'Dips', sets: 3, reps: '8-12', rest: '1-2 min' },
        { name: 'Bicep Curls', sets: 3, reps: '10-12', rest: '1-2 min' },
        { name: 'Tricep Extensions', sets: 3, reps: '10-12', rest: '1-2 min' },
        { name: 'Plank', sets: 3, reps: '30-60 sec', rest: '1 min' }
      ]
    },
    {
      id: 2,
      name: 'HIIT Cardio Blast',
      category: 'hiit',
      difficulty: 'advanced',
      duration: 30,
      calories: 450,
      exercises: 6,
      description: 'High-intensity interval training for maximum fat burn',
      image: '/workouts/hiit.jpg',
      exerciseList: [
        { name: 'Burpees', sets: 4, reps: '30 sec', rest: '30 sec' },
        { name: 'Mountain Climbers', sets: 4, reps: '30 sec', rest: '30 sec' },
        { name: 'Jump Squats', sets: 4, reps: '30 sec', rest: '30 sec' },
        { name: 'High Knees', sets: 4, reps: '30 sec', rest: '30 sec' },
        { name: 'Push-ups', sets: 4, reps: '30 sec', rest: '30 sec' },
        { name: 'Jumping Lunges', sets: 4, reps: '30 sec', rest: '30 sec' }
      ]
    },
    {
      id: 3,
      name: 'Morning Yoga Flow',
      category: 'yoga',
      difficulty: 'beginner',
      duration: 30,
      calories: 150,
      exercises: 10,
      description: 'Gentle yoga flow to start your day with energy',
      image: '/workouts/yoga.jpg',
      exerciseList: [
        { name: 'Child\'s Pose', sets: 1, reps: '2 min', rest: '0' },
        { name: 'Cat-Cow Stretch', sets: 1, reps: '1 min', rest: '0' },
        { name: 'Downward Dog', sets: 1, reps: '1 min', rest: '0' },
        { name: 'Warrior I', sets: 1, reps: '1 min each', rest: '0' },
        { name: 'Warrior II', sets: 1, reps: '1 min each', rest: '0' },
        { name: 'Triangle Pose', sets: 1, reps: '1 min each', rest: '0' },
        { name: 'Tree Pose', sets: 1, reps: '1 min each', rest: '0' },
        { name: 'Bridge Pose', sets: 1, reps: '1 min', rest: '0' },
        { name: 'Cobra Pose', sets: 1, reps: '1 min', rest: '0' },
        { name: 'Corpse Pose', sets: 1, reps: '3 min', rest: '0' }
      ]
    },
    {
      id: 4,
      name: 'Lower Body Power',
      category: 'strength',
      difficulty: 'intermediate',
      duration: 50,
      calories: 380,
      exercises: 7,
      description: 'Build explosive lower body strength and power',
      image: '/workouts/lower-body.jpg',
      exerciseList: [
        { name: 'Squats', sets: 4, reps: '8-10', rest: '2-3 min' },
        { name: 'Deadlifts', sets: 4, reps: '6-8', rest: '3-4 min' },
        { name: 'Lunges', sets: 3, reps: '10 each', rest: '2-3 min' },
        { name: 'Bulgarian Split Squats', sets: 3, reps: '8 each', rest: '2-3 min' },
        { name: 'Romanian Deadlifts', sets: 3, reps: '10-12', rest: '2-3 min' },
        { name: 'Calf Raises', sets: 4, reps: '15-20', rest: '1-2 min' },
        { name: 'Wall Sit', sets: 3, reps: '30-60 sec', rest: '1-2 min' }
      ]
    },
    {
      id: 5,
      name: 'Core Crusher',
      category: 'functional',
      difficulty: 'intermediate',
      duration: 25,
      calories: 280,
      exercises: 8,
      description: 'Intense core workout for a strong midsection',
      image: '/workouts/core-crush.jpg',
      exerciseList: [
        { name: 'Plank', sets: 3, reps: '45-60 sec', rest: '1 min' },
        { name: 'Russian Twists', sets: 3, reps: '20 each', rest: '1 min' },
        { name: 'Mountain Climbers', sets: 3, reps: '30 sec', rest: '1 min' },
        { name: 'Bicycle Crunches', sets: 3, reps: '20 each', rest: '1 min' },
        { name: 'Leg Raises', sets: 3, reps: '15-20', rest: '1 min' },
        { name: 'Side Plank', sets: 3, reps: '30 sec each', rest: '1 min' },
        { name: 'Dead Bug', sets: 3, reps: '10 each', rest: '1 min' },
        { name: 'Hollow Hold', sets: 3, reps: '30-45 sec', rest: '1 min' }
      ]
    },
    {
      id: 6,
      name: 'Full Body Circuit',
      category: 'functional',
      difficulty: 'beginner',
      duration: 35,
      calories: 300,
      exercises: 6,
      description: 'Complete full body workout for all fitness levels',
      image: '/workouts/full-body.jpg',
      exerciseList: [
        { name: 'Push-ups', sets: 3, reps: '8-12', rest: '1-2 min' },
        { name: 'Squats', sets: 3, reps: '12-15', rest: '1-2 min' },
        { name: 'Lunges', sets: 3, reps: '10 each', rest: '1-2 min' },
        { name: 'Plank', sets: 3, reps: '30-45 sec', rest: '1-2 min' },
        { name: 'Jumping Jacks', sets: 3, reps: '30 sec', rest: '1-2 min' },
        { name: 'Burpees', sets: 3, reps: '5-8', rest: '1-2 min' }
      ]
    }
  ];

  const filteredWorkouts = workoutPlans.filter(workout => {
    const categoryMatch = selectedCategory === 'all' || workout.category === selectedCategory;
    const difficultyMatch = selectedDifficulty === 'all' || workout.difficulty === selectedDifficulty;
    const durationMatch = selectedDuration === 'all' || 
      (selectedDuration === '15' && workout.duration <= 15) ||
      (selectedDuration === '30' && workout.duration > 15 && workout.duration <= 30) ||
      (selectedDuration === '45' && workout.duration > 30 && workout.duration <= 45) ||
      (selectedDuration === '60' && workout.duration > 45);
    
    return categoryMatch && difficultyMatch && durationMatch;
  });

  const startWorkout = (workoutId: number) => {
    setActiveWorkout(workoutId);
    setIsWorkoutActive(true);
    setWorkoutTimer(0);
  };

  const stopWorkout = () => {
    setActiveWorkout(null);
    setIsWorkoutActive(false);
    setWorkoutTimer(0);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWorkoutActive) {
      interval = setInterval(() => {
        setWorkoutTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorkoutActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-400 bg-green-500/20';
      case 'intermediate':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'advanced':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation Header */}
      <nav className="bg-white text-gray-900 py-4 px-6 relative z-10 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3 group">
              <Image
                src="/logo.png"
                alt="PowerWorld Fitness Logo"
                width={50}
                height={50}
                className="transition-transform group-hover:scale-105"
                priority
              />
              <span className="text-xl font-bold text-gray-900 group-hover:text-red-500 transition-colors">
                PowerWorld
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Workout Plans</h1>
            <p className="text-gray-600">Choose from our curated collection of workout routines</p>
          </div>

          {/* Active Workout Overlay */}
          {isWorkoutActive && activeWorkout && (
            <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50">
              <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-md w-full mx-4 shadow-lg">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {workoutPlans.find(w => w.id === activeWorkout)?.name}
                  </h3>
                  <div className="text-4xl font-mono text-red-500 mb-4">
                    {formatTime(workoutTimer)}
                  </div>
                  <p className="text-gray-600">
                    Workout in progress...
                  </p>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={stopWorkout}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    End Workout
                  </button>
                  <button
                    onClick={() => setIsWorkoutActive(!isWorkoutActive)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition-colors"
                  >
                    {isWorkoutActive ? 'Pause' : 'Resume'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {difficulties.map(difficulty => (
                    <option key={difficulty.id} value={difficulty.id}>
                      {difficulty.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration
                </label>
                <select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {durations.map(duration => (
                    <option key={duration.id} value={duration.id}>
                      {duration.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Workout Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkouts.map((workout) => (
              <div key={workout.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-red-500 transition-colors shadow-sm">
                <div className="h-48 relative overflow-hidden">
                  <Image
                    src={workout.image}
                    alt={`${workout.name} workout`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{workout.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(workout.difficulty)}`}>
                      {workout.difficulty}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">{workout.description}</p>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{workout.duration}</div>
                      <div className="text-xs text-gray-600">minutes</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-500">{workout.calories}</div>
                      <div className="text-xs text-gray-600">calories</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-500">{workout.exercises}</div>
                      <div className="text-xs text-gray-600">exercises</div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startWorkout(workout.id)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold transition-colors"
                    >
                      Start Workout
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      Preview
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Exercise Details Modal would go here */}
          {filteredWorkouts.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No workouts found</h3>
              <p className="text-gray-600">Try adjusting your filters to see more results</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
