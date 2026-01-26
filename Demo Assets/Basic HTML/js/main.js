// Main JavaScript file for Gym Management System Static Website

// Global state
let currentTime = new Date();
let isCheckedIn = false;
let isLoading = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeTime();
  initializeForms();
  initializeNavigation();
  initializeFormValidation();
  initializeRegistrationFlow();
  initializeProgressPage();
  initializeAppointmentsPage();
  initializeAdminUsersPage();
  initializeModernUI();
});

// Update time every second
function initializeTime() {
  const timeElements = document.querySelectorAll('.current-time');
  const dateElements = document.querySelectorAll('.current-date');
  
  if (timeElements.length > 0 || dateElements.length > 0) {
    updateTime();
    setInterval(updateTime, 1000);
  }
}

function updateTime() {
  currentTime = new Date();
  
  // Update time displays
  const timeElements = document.querySelectorAll('.current-time');
  timeElements.forEach(element => {
    element.textContent = formatTime(currentTime);
  });
  
  // Update date displays
  const dateElements = document.querySelectorAll('.current-date');
  dateElements.forEach(element => {
    element.textContent = formatDate(currentTime);
  });
  
  // Update greeting
  const greetingElements = document.querySelectorAll('.greeting');
  greetingElements.forEach(element => {
    element.textContent = getGreeting(currentTime);
  });
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getGreeting(date) {
  const hour = date.getHours();
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
}

// Form handling
function initializeForms() {
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Register form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
  
  // Personal details form
  const personalDetailsForm = document.getElementById('personalDetailsForm');
  if (personalDetailsForm) {
    personalDetailsForm.addEventListener('submit', handlePersonalDetails);
  }
  
  // Identity verification form
  const identityVerificationForm = document.getElementById('identityVerificationForm');
  if (identityVerificationForm) {
    identityVerificationForm.addEventListener('submit', handleIdentityVerification);
  }
  
  // Subscription form
  const subscriptionForm = document.getElementById('subscriptionForm');
  if (subscriptionForm) {
    subscriptionForm.addEventListener('submit', handleSubscription);
  }
  
  // Password visibility toggle
  const passwordToggles = document.querySelectorAll('.password-toggle');
  passwordToggles.forEach(toggle => {
    toggle.addEventListener('click', togglePasswordVisibility);
  });
}
async function handleLogin(event) {
  event.preventDefault();
  
  const form = event.target;
  const email = form.querySelector('#email').value;
  const password = form.querySelector('#password').value;
  const submitButton = form.querySelector('button[type="submit"]');
  
  // Show loading state
  isLoading = true;
  submitButton.disabled = true;
  submitButton.innerHTML = `
    <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span>Signing in...</span>
  `;
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Role-based routing based on email input
  const emailLower = email.toLowerCase();
  let redirectPath = 'dashboard.html';
  
  if (emailLower.includes('admin')) {
    redirectPath = 'admin-dashboard.html';
  } else if (emailLower.includes('manager')) {
    redirectPath = 'manager-dashboard.html';
  } else if (emailLower.includes('staff')) {
    redirectPath = 'staff-dashboard.html';
  } else if (emailLower.includes('member')) {
    redirectPath = 'dashboard.html';
  }
  
  // Redirect to appropriate dashboard
  window.location.href = redirectPath;
}

async function handleRegister(event) {
  event.preventDefault();
  
  const form = event.target;
  const email = form.querySelector('#email').value;
  const submitButton = form.querySelector('button[type="submit"]');
  
  // Show loading state
  isLoading = true;
  submitButton.disabled = true;
  submitButton.innerHTML = `
    <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span>Processing...</span>
  `;
  
  // Simulate API call (very short delay)
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Redirect to personal details page
  window.location.href = 'register-personal-details.html';
}

async function handlePersonalDetails(event) {
  event.preventDefault();
  
  const form = event.target;
  const submitButton = form.querySelector('button[type="submit"]');
  
  // Show loading state
  isLoading = true;
  submitButton.disabled = true;
  submitButton.innerHTML = `
    <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span>Saving...</span>
  `;
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Redirect to identity verification page
  window.location.href = 'register-identity-verification.html';
}

async function handleIdentityVerification(event) {
  event.preventDefault();
  
  const form = event.target;
  const submitButton = form.querySelector('button[type="submit"]');
  
  // Show loading state
  isLoading = true;
  submitButton.disabled = true;
  submitButton.innerHTML = `
    <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span>Uploading...</span>
  `;
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Redirect to subscription page
  window.location.href = 'register-subscription.html';
}

async function handleSubscription(event) {
  event.preventDefault();
  
  const form = event.target;
  const submitButton = form.querySelector('button[type="submit"]');
  
  // Show loading state
  isLoading = true;
  submitButton.disabled = true;
  submitButton.innerHTML = `
    <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span>Processing...</span>
  `;
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Redirect to welcome dashboard
  window.location.href = 'register-welcome-dashboard.html';
}

function initializeProgressPage() {
  const periodSelector = document.getElementById('periodSelector');
  if (!periodSelector) {
    return;
  }

  const buttons = periodSelector.querySelectorAll('.period-btn');
  if (!buttons.length) {
    return;
  }

  let selectedPeriod = 'week';

  const workoutData = {
    week: [1, 0, 1, 1, 0, 1, 0],
    month: [4, 3, 5, 4, 6, 3, 4, 5, 4, 6, 3, 4, 5, 4, 6, 3, 4, 5, 4, 6, 3, 4, 5, 4, 6, 3, 4, 5, 4, 6, 3],
    year: [18, 22, 19, 25, 21, 23, 20, 24, 22, 26, 21, 23]
  };

  const weightData = {
    week: [75.8, 75.6, 75.4, 75.3, 75.2, 75.1, 75.0],
    month: [76.5, 76.2, 75.9, 75.7, 75.5, 75.3, 75.1, 75.0, 74.8, 74.6, 74.4, 74.2, 74.0, 73.8, 73.6, 73.4, 73.2, 73.0, 72.8, 72.6, 72.4, 72.2, 72.0, 71.8, 71.6, 71.4, 71.2, 71.0, 70.8, 70.6, 70.4],
    year: [80.0, 79.0, 78.0, 77.0, 76.0, 75.0, 74.0, 73.0, 72.0, 71.0, 70.0, 69.0]
  };

  const weeklyStats = {
    workouts: 4,
    totalTime: '6h 30m',
    caloriesBurned: 2840,
    avgHeartRate: 145,
    steps: 45600,
    distance: '32.5 km'
  };

  const monthlyStats = {
    workouts: 18,
    totalTime: '28h 45m',
    caloriesBurned: 12840,
    avgHeartRate: 142,
    steps: 198600,
    distance: '142.3 km'
  };

  const annualStats = {
    workouts: 204,
    totalTime: '320h 10m',
    caloriesBurned: 152400,
    avgHeartRate: 138,
    steps: 2320000,
    distance: '1650 km'
  };

  const personalRecords = [
    { exercise: 'Bench Press', current: '120 kg', previous: '115 kg', improvement: '+5 kg', date: '2025-01-15' },
    { exercise: 'Squat', current: '150 kg', previous: '145 kg', improvement: '+5 kg', date: '2025-01-12' },
    { exercise: 'Deadlift', current: '180 kg', previous: '175 kg', improvement: '+5 kg', date: '2025-01-10' },
    { exercise: 'Overhead Press', current: '80 kg', previous: '75 kg', improvement: '+5 kg', date: '2025-01-08' },
    { exercise: 'Pull-ups', current: '15 reps', previous: '12 reps', improvement: '+3 reps', date: '2025-01-05' }
  ];

  const achievements = [
    { name: 'First Workout', description: 'Completed your first workout', date: '2024-12-01', icon: '🏃‍♂️' },
    { name: 'Week Warrior', description: 'Worked out 5 days in a week', date: '2024-12-15', icon: '💪' },
    { name: 'Month Master', description: 'Worked out 20 days in a month', date: '2024-12-31', icon: '🏆' },
    { name: 'Weight Loss', description: 'Lost 5kg in a month', date: '2025-01-10', icon: '⚖️' },
    { name: 'Strength Gain', description: 'Increased bench press by 10kg', date: '2025-01-15', icon: '🔥' },
    { name: 'Consistency Legend', description: 'Kept a 90 day streak', date: '2025-01-20', icon: '📆' }
  ];

  const elements = {
    currentWeight: document.getElementById('currentWeight'),
    targetWeight: document.getElementById('targetWeight'),
    weightProgressBar: document.getElementById('weightProgressBar'),
    weightProgressText: document.getElementById('weightProgressText'),
    workoutPeriodLabel: document.getElementById('workoutPeriodLabel'),
    workoutCount: document.getElementById('workoutCount'),
    totalTime: document.getElementById('totalTime'),
    caloriesBurned: document.getElementById('caloriesBurned'),
    steps: document.getElementById('steps'),
    distance: document.getElementById('distance'),
    averageHeartRate: document.getElementById('averageHeartRate'),
    workoutChart: document.getElementById('workoutChart'),
    weightChart: document.getElementById('weightChart'),
    personalRecords: document.getElementById('personalRecords'),
    achievements: document.getElementById('achievements')
  };

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weekLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  function getStats() {
    if (selectedPeriod === 'week') {
      return weeklyStats;
    }
    if (selectedPeriod === 'month') {
      return monthlyStats;
    }
    return annualStats;
  }

  function formatNumber(value) {
    if (typeof value === 'number') {
      return value.toLocaleString('en-US');
    }
    return value;
  }

  function calculateProgress(currentValues) {
    const target = 70;
    const starting = currentValues[0];
    const current = currentValues[currentValues.length - 1];
    const totalDiff = Math.max(starting - target, 1);
    const progress = ((starting - current) / totalDiff) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }

  function updateQuickStats() {
    const weightValues = weightData[selectedPeriod];
    const progressPercent = calculateProgress(weightValues);
    const currentWeight = weightValues[weightValues.length - 1];

    if (elements.currentWeight) {
      elements.currentWeight.textContent = `${currentWeight.toFixed(1)} kg`;
    }
    if (elements.weightProgressBar) {
      elements.weightProgressBar.style.width = `${progressPercent.toFixed(0)}%`;
    }
    if (elements.weightProgressText) {
      elements.weightProgressText.textContent = `${progressPercent.toFixed(1)}% to goal`;
    }

    const stats = getStats();
    if (elements.workoutPeriodLabel) {
      elements.workoutPeriodLabel.textContent = selectedPeriod;
    }
    if (elements.workoutCount) {
      elements.workoutCount.textContent = formatNumber(stats.workouts);
    }
    if (elements.totalTime) {
      elements.totalTime.textContent = stats.totalTime;
    }
    if (elements.caloriesBurned) {
      elements.caloriesBurned.textContent = formatNumber(stats.caloriesBurned);
    }
    if (elements.steps) {
      elements.steps.textContent = formatNumber(stats.steps);
    }
    if (elements.distance) {
      elements.distance.textContent = stats.distance;
    }
    if (elements.averageHeartRate) {
      elements.averageHeartRate.textContent = `${stats.avgHeartRate} bpm`;
    }
  }

  function renderWorkoutChart() {
    const container = elements.workoutChart;
    if (!container) {
      return;
    }

    const data = workoutData[selectedPeriod];
    const maxValue = Math.max(...data, 1);
    container.innerHTML = '';

    data.forEach((value, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'flex flex-col items-center flex-1';

      const bar = document.createElement('div');
      bar.className = `w-full max-w-4 rounded-t-lg transition-all duration-500 ${value > 0 ? 'bg-gradient-to-t from-red-500 to-red-400' : 'bg-gray-300'}`;
      bar.style.height = `${Math.min((value / maxValue) * 200, 200)}px`;

      const label = document.createElement('span');
      label.className = 'text-gray-600 text-xs mt-2 truncate w-full text-center';

      if (selectedPeriod === 'week') {
        label.textContent = weekLabels[index] || '';
      } else if (selectedPeriod === 'month') {
        label.textContent = String(index + 1);
      } else {
        label.textContent = monthLabels[index] || '';
      }

      wrapper.appendChild(bar);
      wrapper.appendChild(label);
      container.appendChild(wrapper);
    });
  }

  function renderWeightChart() {
    const container = elements.weightChart;
    if (!container) {
      return;
    }

    const data = weightData[selectedPeriod];
    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const denominator = Math.max(maxValue - minValue, 1);
    container.innerHTML = '';

    data.forEach((value, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'flex flex-col items-center flex-1';

      const bar = document.createElement('div');
      bar.className = 'w-full max-w-4 rounded-t-lg bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-500';
      bar.style.height = `${Math.min(((value - minValue) / denominator) * 200, 200)}px`;

      const label = document.createElement('span');
      label.className = 'text-gray-600 text-xs mt-2 truncate w-full text-center';

      if (selectedPeriod === 'week') {
        label.textContent = weekLabels[index] || '';
      } else if (selectedPeriod === 'month') {
        label.textContent = String(index + 1);
      } else {
        label.textContent = monthLabels[index] || '';
      }

      wrapper.appendChild(bar);
      wrapper.appendChild(label);
      container.appendChild(wrapper);
    });
  }

  function renderPersonalRecords() {
    const container = elements.personalRecords;
    if (!container) {
      return;
    }

    container.innerHTML = personalRecords.map((record) => `
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-gray-900 font-semibold">${record.exercise}</h4>
          <span class="text-green-500 text-sm font-bold">${record.improvement}</span>
        </div>
        <div class="space-y-1">
          <div class="flex justify-between">
            <span class="text-gray-600">Current:</span>
            <span class="text-gray-900 font-bold">${record.current}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Previous:</span>
            <span class="text-gray-700">${record.previous}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Date:</span>
            <span class="text-gray-700 text-sm">${record.date}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderAchievements() {
    const container = elements.achievements;
    if (!container) {
      return;
    }

    container.innerHTML = achievements.map((achievement) => `
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="flex items-center space-x-3 mb-3">
          <div class="text-2xl">${achievement.icon}</div>
          <div>
            <h4 class="text-gray-900 font-semibold">${achievement.name}</h4>
            <p class="text-gray-600 text-sm">${achievement.description}</p>
          </div>
        </div>
        <div class="text-right">
          <span class="text-gray-500 text-xs">${achievement.date}</span>
        </div>
      </div>
    `).join('');
  }

  function updateActiveButton() {
    buttons.forEach((button) => {
      const period = button.getAttribute('data-period');
      if (period === selectedPeriod) {
        button.classList.remove('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
        button.classList.add('bg-red-500', 'text-white', 'hover:bg-red-600');
      } else {
        button.classList.remove('bg-red-500', 'text-white', 'hover:bg-red-600');
        button.classList.add('bg-gray-200', 'text-gray-700');
        if (!button.classList.contains('hover:bg-gray-300')) {
          button.classList.add('hover:bg-gray-300');
        }
      }
    });
  }

  function updateProgressView() {
    updateActiveButton();
    updateQuickStats();
    renderWorkoutChart();
    renderWeightChart();
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const period = button.getAttribute('data-period');
      if (period && period !== selectedPeriod) {
        selectedPeriod = period;
        updateProgressView();
      }
    });
  });

  renderPersonalRecords();
  renderAchievements();
  updateProgressView();
}

function initializeAppointmentsPage() {
  const calendarView = document.getElementById('calendarView');
  const listView = document.getElementById('listView');
  const viewToggle = document.getElementById('appointmentViewToggle');

  if (!calendarView || !listView || !viewToggle) {
    return;
  }

  const viewButtons = viewToggle.querySelectorAll('.view-btn');
  const selectedDateLabel = document.getElementById('selectedDateLabel');
  const selectedDateCaption = document.getElementById('selectedDateCaption');
  const calendarDays = document.getElementById('calendarDays');
  const trainerSelect = document.getElementById('trainerSelect');
  const appointmentTypeSelect = document.getElementById('appointmentTypeSelect');
  const timeSlotSelect = document.getElementById('timeSlotSelect');
  const notesInput = document.getElementById('notesInput');
  const appointmentForm = document.getElementById('appointmentForm');
  const upcomingAppointmentsList = document.getElementById('upcomingAppointmentsList');
  const pastAppointmentsList = document.getElementById('pastAppointmentsList');
  const prevMonthBtn = document.getElementById('prevMonthBtn');
  const nextMonthBtn = document.getElementById('nextMonthBtn');
  const bookAppointmentPrimary = document.getElementById('bookAppointmentPrimary');
  const openCalendarFromList = document.getElementById('openCalendarFromList');

  const trainers = [
    { id: '1', name: 'Nadeesha Silva', specialization: 'Strength Training', rating: 4.9, experience: '5 years', location: 'Studio A' },
    { id: '2', name: 'Chamara Perera', specialization: 'Cardio & HIIT', rating: 4.8, experience: '7 years', location: 'Consultation Room' },
    { id: '3', name: 'Dilini Fernando', specialization: 'Yoga & Flexibility', rating: 4.9, experience: '4 years', location: 'Yoga Studio' },
    { id: '4', name: 'Ravindu Jayasinghe', specialization: 'Bodybuilding', rating: 4.7, experience: '8 years', location: 'Strength Zone' },
    { id: '5', name: 'Ishara Wickramasinghe', specialization: 'Nutrition & Wellness', rating: 4.9, experience: '6 years', location: 'Consultation Room' }
  ];

  const appointmentTypes = [
    'Personal Training',
    'Nutrition Consultation',
    'Group Class',
    'Assessment',
    'Rehabilitation',
    'Sports Specific Training'
  ];

  const timeSlots = [
    '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
    '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM'
  ];

  const upcomingAppointments = [
    {
      id: 1,
      trainerId: '1',
      trainer: 'Nadeesha Silva',
      type: 'Personal Training',
      date: '2025-01-18',
      time: '10:00 AM',
      duration: '60 min',
      status: 'confirmed',
      location: 'Studio A'
    },
    {
      id: 2,
      trainerId: '2',
      trainer: 'Chamara Perera',
      type: 'Nutrition Consultation',
      date: '2025-01-20',
      time: '2:00 PM',
      duration: '45 min',
      status: 'confirmed',
      location: 'Consultation Room'
    },
    {
      id: 3,
      trainerId: '3',
      trainer: 'Dilini Fernando',
      type: 'Group Class',
      date: '2025-01-22',
      time: '6:00 PM',
      duration: '75 min',
      status: 'pending',
      location: 'Yoga Studio'
    }
  ];

  const pastAppointments = [
    {
      id: 4,
      trainer: 'Ravindu Jayasinghe',
      type: 'Personal Training',
      date: '2025-01-15',
      time: '9:00 AM',
      duration: '60 min',
      status: 'completed',
      rating: 5,
      notes: 'Focused on upper body strength.'
    },
    {
      id: 5,
      trainer: 'Ishara Wickramasinghe',
      type: 'Nutrition Consultation',
      date: '2025-01-12',
      time: '3:00 PM',
      duration: '45 min',
      status: 'completed',
      rating: 5,
      notes: 'Reviewed meal plan and progress.'
    }
  ];

  const today = new Date();
  let currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectedDate = formatDateKey(today);

  populateSelect(trainerSelect, trainers.map((trainer) => ({ value: trainer.id, label: `${trainer.name} — ${trainer.specialization}` })), 'Choose a trainer');
  populateSelect(appointmentTypeSelect, appointmentTypes.map((type) => ({ value: type, label: type })), 'Select type');
  populateSelect(timeSlotSelect, timeSlots.map((slot) => ({ value: slot, label: slot })), 'Select time');

  function populateSelect(selectElement, items, placeholder) {
    if (!selectElement) {
      return;
    }
    selectElement.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = placeholder;
    selectElement.appendChild(defaultOption);
    items.forEach((item) => {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      selectElement.appendChild(option);
    });
  }

  function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function parseDateKey(dateKey) {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function formatDisplayDate(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function getAppointmentsForDate(dateKey) {
    return upcomingAppointments.filter((appointment) => appointment.date === dateKey);
  }

  function updateSelectedDateInfo() {
    if (selectedDateLabel) {
      selectedDateLabel.textContent = formatDisplayDate(parseDateKey(selectedDate));
    }
    if (selectedDateCaption) {
      const count = getAppointmentsForDate(selectedDate).length;
      selectedDateCaption.textContent = count > 0
        ? `${count} upcoming appointment${count > 1 ? 's' : ''} scheduled`
        : 'No appointments booked yet';
    }
  }

  function renderCalendar() {
    if (!calendarDays) {
      return;
    }

  const selectedDateObj = parseDateKey(selectedDate);
    if (
      selectedDateObj.getMonth() !== currentMonth.getMonth() ||
      selectedDateObj.getFullYear() !== currentMonth.getFullYear()
    ) {
      selectedDate = formatDateKey(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
    }

    calendarDays.innerHTML = '';

    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const leadingEmptyDays = firstDayOfMonth.getDay();

    if (selectedDateLabel) {
      selectedDateLabel.textContent = formatDisplayDate(parseDateKey(selectedDate));
    }

    for (let i = 0; i < leadingEmptyDays; i += 1) {
      const placeholder = document.createElement('div');
      placeholder.className = 'aspect-square bg-transparent';
      calendarDays.appendChild(placeholder);
    }

    for (let day = 1; day <= lastDayOfMonth.getDate(); day += 1) {
      const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateKey = formatDateKey(dateObj);
      const isToday = dateKey === formatDateKey(today);
      const isSelected = dateKey === selectedDate;
      const appointmentsForDay = getAppointmentsForDate(dateKey);
      const isBooked = appointmentsForDay.length > 0;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'aspect-square flex flex-col items-center justify-center rounded-lg transition-colors';

      if (isSelected) {
        button.classList.add('bg-red-500', 'text-white');
      } else if (isBooked) {
        button.classList.add('border', 'border-red-500', 'bg-red-500/10', 'text-red-500', 'hover:bg-red-500/20');
      } else {
        button.classList.add('bg-gray-100', 'hover:bg-gray-200', 'text-gray-900');
        if (isToday) {
          button.classList.add('border', 'border-red-500');
        }
      }

      button.innerHTML = `
        <span class="text-sm font-medium">${day}</span>
        ${isBooked ? '<span class="w-2 h-2 rounded-full bg-red-500 mt-1"></span>' : ''}
      `;

      button.addEventListener('click', () => {
        selectedDate = dateKey;
        updateSelectedDateInfo();
        renderCalendar();
      });

      calendarDays.appendChild(button);
    }

    updateSelectedDateInfo();
  }

  function renderUpcomingAppointments() {
    if (!upcomingAppointmentsList) {
      return;
    }

    const sorted = [...upcomingAppointments].sort((a, b) => {
      const dateComparison = parseDateKey(a.date).getTime() - parseDateKey(b.date).getTime();
      if (dateComparison !== 0) {
        return dateComparison;
      }
      return timeSlots.indexOf(a.time) - timeSlots.indexOf(b.time);
    });

    upcomingAppointmentsList.innerHTML = sorted.map((appointment) => `
      <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div class="flex items-center space-x-4">
          <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h3 class="text-gray-900 font-semibold">${appointment.trainer}</h3>
            <p class="text-gray-600 text-sm">${appointment.type}</p>
            <p class="text-gray-500 text-xs">${appointment.location}</p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-gray-900 font-semibold">${formatDisplayDate(parseDateKey(appointment.date))}</p>
          <p class="text-gray-600 text-sm">${appointment.time} (${appointment.duration})</p>
          <div class="flex space-x-2 mt-2 justify-end">
            <button data-action="reschedule" data-id="${appointment.id}" class="text-blue-500 hover:text-blue-600 text-sm">Reschedule</button>
            <button data-action="cancel" data-id="${appointment.id}" class="text-red-500 hover:text-red-600 text-sm">Cancel</button>
          </div>
        </div>
      </div>
    `).join('');

    upcomingAppointmentsList.querySelectorAll('button[data-action="cancel"]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = Number(button.getAttribute('data-id'));
        const index = upcomingAppointments.findIndex((appointment) => appointment.id === id);
        if (index !== -1) {
          upcomingAppointments.splice(index, 1);
          showNotification('Appointment cancelled successfully!', 'success');
          renderCalendar();
          renderUpcomingAppointments();
        }
      });
    });

    upcomingAppointmentsList.querySelectorAll('button[data-action="reschedule"]').forEach((button) => {
      button.addEventListener('click', () => {
        showNotification('Reschedule functionality coming soon.', 'info');
      });
    });
  }

  function renderPastAppointments() {
    if (!pastAppointmentsList) {
      return;
    }

  const ratingStar = '<svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
  const mutedStar = '<svg class="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';

    pastAppointmentsList.innerHTML = pastAppointments.map((appointment) => `
      <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 class="text-gray-900 font-semibold">${appointment.trainer}</h3>
          <p class="text-gray-600 text-sm">${appointment.type}</p>
          <p class="text-gray-500 text-xs">${appointment.notes}</p>
        </div>
        <div class="text-right">
          <p class="text-gray-900 font-semibold">${formatDisplayDate(parseDateKey(appointment.date))}</p>
          <p class="text-gray-600 text-sm">${appointment.time} (${appointment.duration})</p>
          <div class="flex justify-end space-x-1 mt-2">
            ${Array.from({ length: 5 }, (_, index) => index < appointment.rating ? ratingStar : mutedStar).join('')}
          </div>
        </div>
      </div>
    `).join('');
  }

  function switchView(view) {
    if (view === 'calendar') {
      calendarView.classList.remove('hidden');
      listView.classList.add('hidden');
    } else {
      calendarView.classList.add('hidden');
      listView.classList.remove('hidden');
    }

    viewButtons.forEach((button) => {
      const buttonView = button.getAttribute('data-view');
      if (buttonView === view) {
        button.classList.remove('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
        button.classList.add('bg-red-500', 'text-white', 'hover:bg-red-600');
      } else {
        button.classList.remove('bg-red-500', 'text-white', 'hover:bg-red-600');
        button.classList.add('bg-gray-200', 'text-gray-700');
        if (!button.classList.contains('hover:bg-gray-300')) {
          button.classList.add('hover:bg-gray-300');
        }
      }
    });
  }

  function handleFormSubmit(event) {
    event.preventDefault();

    if (!selectedDate) {
      showNotification('Please select a date from the calendar before booking.', 'warning');
      return;
    }

    const trainerId = trainerSelect ? trainerSelect.value : '';
    const appointmentType = appointmentTypeSelect ? appointmentTypeSelect.value : '';
    const timeSlot = timeSlotSelect ? timeSlotSelect.value : '';
    const notes = notesInput ? notesInput.value.trim() : '';

    if (!trainerId || !appointmentType || !timeSlot) {
      showNotification('Please fill in all required fields.', 'warning');
      return;
    }

    const trainer = trainers.find((item) => item.id === trainerId);
    const newAppointment = {
      id: Date.now(),
      trainerId,
      trainer: trainer ? trainer.name : 'Trainer',
      type: appointmentType,
      date: selectedDate,
      time: timeSlot,
      duration: '60 min',
      status: 'pending',
      location: trainer ? trainer.location : 'TBA',
      notes
    };

    upcomingAppointments.push(newAppointment);
    showNotification('Appointment booked successfully!', 'success');
    if (appointmentForm) {
      appointmentForm.reset();
    }

    renderCalendar();
    renderUpcomingAppointments();
    switchView('list');
  }

  if (appointmentForm) {
    appointmentForm.addEventListener('submit', handleFormSubmit);
  }

  viewButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const view = button.getAttribute('data-view');
      if (view) {
        switchView(view);
      }
    });
  });

  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      renderCalendar();
    });
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
      renderCalendar();
    });
  }

  if (bookAppointmentPrimary) {
    bookAppointmentPrimary.addEventListener('click', () => {
      switchView('calendar');
      if (appointmentForm) {
        appointmentForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  if (openCalendarFromList) {
    openCalendarFromList.addEventListener('click', () => {
      switchView('calendar');
      if (calendarView) {
        calendarView.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  renderCalendar();
  renderUpcomingAppointments();
  renderPastAppointments();
  switchView('calendar');
}

function togglePasswordVisibility(event) {
  event.preventDefault();
  
  const button = event.target.closest('button');
  if (!button) return;
  
  const input = button.parentElement.querySelector('input');
  if (!input) return;
  
  const isPassword = input.type === 'password';
  
  input.type = isPassword ? 'text' : 'password';
  
  // Update icon
  const icon = button.querySelector('svg');
  if (icon) {
    if (isPassword) {
      icon.innerHTML = `
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
      `;
    } else {
      icon.innerHTML = `
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      `;
    }
  }
}

// Navigation handling
function initializeNavigation() {
  // Handle check-in/out functionality
  const checkInButtons = document.querySelectorAll('.check-in-btn');
  checkInButtons.forEach(button => {
    button.addEventListener('click', handleCheckIn);
  });
  
  // Handle QR scanner simulation
  const qrScannerLinks = document.querySelectorAll('a[href*="qr-scanner"]');
  qrScannerLinks.forEach(link => {
    link.addEventListener('click', handleQRScanner);
  });
}

function handleCheckIn(event) {
  event.preventDefault();
  
  // Simulate check-in process
  isCheckedIn = !isCheckedIn;
  
  const button = event.target.closest('a');
  const statusElement = button.querySelector('h3');
  const descriptionElement = button.querySelector('p');
  
  if (isCheckedIn) {
    button.className = button.className.replace('border-red-500', 'border-green-500')
                                     .replace('text-red-400', 'text-green-400')
                                     .replace('bg-red-500/10', 'bg-green-500/10');
    statusElement.textContent = 'Check Out';
    descriptionElement.textContent = 'Tap to check out';
  } else {
    button.className = button.className.replace('border-green-500', 'border-red-500')
                                     .replace('text-green-400', 'text-red-400')
                                     .replace('bg-green-500/10', 'bg-red-500/10');
    statusElement.textContent = 'Check In';
    descriptionElement.textContent = 'Scan QR to enter';
  }
  
  // Show success message
  showNotification(isCheckedIn ? 'Checked in successfully!' : 'Checked out successfully!');
}

function handleQRScanner(event) {
  event.preventDefault();
  
  // Simulate QR scanner
  const qrCode = prompt('Scan QR Code (simulated): Enter a code to continue');
  if (qrCode) {
    showNotification('QR Code scanned successfully!');
    // Redirect to dashboard or show success
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);
  }
}

// Utility functions
function showNotification(message, type = 'success') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full ${
    type === 'success' ? 'bg-green-500 text-white' : 
    type === 'error' ? 'bg-red-500 text-white' :
    type === 'warning' ? 'bg-yellow-500 text-white' :
    type === 'info' ? 'bg-blue-500 text-white' :
    'bg-gray-500 text-white'
  }`;
  
  notification.innerHTML = `
    <div class="flex items-center space-x-3">
      <div class="flex-shrink-0">
        ${type === 'success' ? `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        ` : type === 'error' ? `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ` : type === 'warning' ? `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        ` : `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `}
      </div>
      <div class="flex-1">
        <p class="text-sm font-medium">${message}</p>
      </div>
      <button onclick="this.closest('.fixed').remove()" class="flex-shrink-0 text-white hover:text-gray-200">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  `;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.classList.remove('translate-x-full');
    notification.classList.add('translate-x-0');
  }, 100);
  
  // Remove after 5 seconds
  setTimeout(() => {
    notification.classList.add('translate-x-full');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Form validation functions removed - no validations needed
function validateEmail(email) {
  return true; // Always return true - no validation
}

function validatePassword(password) {
  return true; // Always return true - no validation
}

// Form validation disabled - removed for easier testing
function initializeFormValidation() {
  // All form validations removed as requested
  console.log('Form validation disabled');
}

// Initialize registration flow interactions
function initializeRegistrationFlow() {
  // Document type selection for identity verification
  const documentTypeBtns = document.querySelectorAll('.document-type-btn');
  if (documentTypeBtns.length) {
    documentTypeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        documentTypeBtns.forEach((otherBtn) => {
          otherBtn.classList.remove('border-red-500', 'bg-red-50', 'text-red-600');
          otherBtn.classList.add('border-gray-300');
          otherBtn.setAttribute('aria-pressed', 'false');
        });

        btn.classList.remove('border-gray-300');
        btn.classList.add('border-red-500', 'bg-red-50', 'text-red-600');
        btn.setAttribute('aria-pressed', 'true');

        updateIdentityVerificationSubmitButton();
      });
    });
  }

  // File upload handlers for identity verification
  const uploadConfigs = [
    { inputId: 'front-upload', type: 'front' },
    { inputId: 'back-upload', type: 'back' }
  ];

  uploadConfigs.forEach(({ inputId, type }) => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener('change', function() {
        handleFileUpload(this, type);
      });
    }
  });

  // Membership plan selection
  const planCards = document.querySelectorAll('.plan-card');
  if (planCards.length) {
    planCards.forEach((card) => {
      card.addEventListener('click', () => {
        planCards.forEach((otherCard) => {
          otherCard.classList.remove('border-red-500', 'bg-red-50', 'ring-2', 'ring-red-500', 'shadow-lg');
          otherCard.classList.add('border-gray-300');
          otherCard.setAttribute('aria-pressed', 'false');
        });

        card.classList.remove('border-gray-300');
        card.classList.add('border-red-500', 'bg-red-50', 'ring-2', 'ring-red-500', 'shadow-lg');
        card.setAttribute('aria-pressed', 'true');

        updateSubscriptionSubmitButton();
      });
    });
  }

  // Payment method selection
  const paymentMethodBtns = document.querySelectorAll('.payment-method-btn');
  if (paymentMethodBtns.length) {
    paymentMethodBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        paymentMethodBtns.forEach((otherBtn) => {
          otherBtn.classList.remove('border-red-500', 'bg-red-50');
          otherBtn.classList.add('border-gray-300');
          otherBtn.setAttribute('aria-pressed', 'false');
        });

        btn.classList.remove('border-gray-300');
        btn.classList.add('border-red-500', 'bg-red-50');
        btn.setAttribute('aria-pressed', 'true');

        updateSubscriptionSubmitButton();
      });
    });
  }

  // Terms checkbox for subscription
  const termsCheckbox = document.getElementById('terms');
  if (termsCheckbox) {
    termsCheckbox.addEventListener('change', updateSubscriptionSubmitButton);
  }

  // Auto-redirect countdown for welcome dashboard
  initializeWelcomeCountdown();
}

function handleFileUpload(input, type) {
  const file = input.files[0];
  if (file) {
    const uploadArea = document.getElementById(`${type}-upload-area`);
    uploadArea.dataset.uploaded = 'true';
    uploadArea.innerHTML = `
      <div class="space-y-2">
        <div class="text-green-500 text-sm">✓ File uploaded: ${file.name}</div>
        <button
          type="button"
          onclick="removeFile('${type}')"
          class="text-red-500 hover:text-red-600 text-sm"
        >
          Remove file
        </button>
      </div>
    `;
  }
  updateIdentityVerificationSubmitButton();
}

function removeFile(type) {
  const uploadArea = document.getElementById(`${type}-upload-area`);
  const existingInput = document.getElementById(`${type}-upload`);

  if (existingInput) {
    existingInput.value = '';
  }
  uploadArea.dataset.uploaded = 'false';
  uploadArea.innerHTML = `
    <input
      type="file"
      accept="image/*"
      id="${type}-upload"
      class="hidden"
    />
    <label
      for="${type}-upload"
      class="cursor-pointer flex flex-col items-center space-y-2"
    >
      <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      <span class="text-gray-300">Click to upload ${type} image</span>
      <span class="text-xs text-gray-400">PNG, JPG up to 10MB</span>
    </label>
  `;
  
  // Re-attach event listener
  const newInput = document.getElementById(`${type}-upload`);
  newInput.addEventListener('change', function() {
    handleFileUpload(this, type);
  });
  
  updateIdentityVerificationSubmitButton();
}

function updateIdentityVerificationSubmitButton() {
  const submitBtn = document.getElementById('submitBtn');
  if (!submitBtn) return;
  
  const selectedDoc = document.querySelector('.document-type-btn.border-red-500');
  const frontUploaded = document.getElementById('front-upload-area')?.dataset.uploaded === 'true';
  const backUploaded = document.getElementById('back-upload-area')?.dataset.uploaded === 'true';

  const canSubmit = Boolean(selectedDoc && frontUploaded && backUploaded);
  
  submitBtn.disabled = !canSubmit;
  if (canSubmit) {
    submitBtn.classList.remove('from-gray-400', 'to-gray-500');
    submitBtn.classList.add('from-red-600', 'to-red-700');
  } else {
    submitBtn.classList.remove('from-red-600', 'to-red-700');
    submitBtn.classList.add('from-gray-400', 'to-gray-500');
  }
}

function updateSubscriptionSubmitButton() {
  const submitBtn = document.getElementById('submitBtn');
  if (!submitBtn) return;
  
  const selectedPlan = document.querySelector('.plan-card.border-red-500');
  const selectedPayment = document.querySelector('.payment-method-btn.border-red-500');
  const termsChecked = document.getElementById('terms')?.checked;
  
  const canSubmit = selectedPlan && selectedPayment && termsChecked;
  
  submitBtn.disabled = !canSubmit;
  if (canSubmit) {
    submitBtn.classList.remove('from-gray-400', 'to-gray-500');
    submitBtn.classList.add('from-red-600', 'to-red-700');
  } else {
    submitBtn.classList.remove('from-red-600', 'to-red-700');
    submitBtn.classList.add('from-gray-400', 'to-gray-500');
  }
}

function initializeAdminUsersPage() {
  const tabNav = document.getElementById('adminUserTabs');
  const tableContainer = document.getElementById('adminUsersTable');
  const searchInput = document.getElementById('userSearchInput');
  const roleFilterWrapper = document.getElementById('userRoleFilterWrapper');
  const roleFilterSelect = document.getElementById('userRoleFilter');

  if (!tabNav || !tableContainer || !searchInput) {
    return;
  }

  const tabButtons = Array.from(tabNav.querySelectorAll('[data-admin-users-tab]'));
  if (!tabButtons.length) {
    return;
  }

  const data = {
    members: [
      { id: 'MEM001', name: 'Kamal Perera', email: 'john.smith@email.com', phone: '+94123456789', joinDate: '2024-01-15', status: 'active', subscription: 'Premium Monthly' },
      { id: 'MEM002', name: 'Sanduni Silva', email: 'sarah.j@email.com', phone: '+94123456788', joinDate: '2024-01-10', status: 'active', subscription: 'Basic Monthly' },
      { id: 'MEM003', name: 'Dinesh Fernando', email: 'mike.chen@email.com', phone: '+94123456787', joinDate: '2024-01-05', status: 'inactive', subscription: 'Elite Monthly' },
      { id: 'MEM004', name: 'Thilini Jayawardena', email: 'emma.w@email.com', phone: '+94123456786', joinDate: '2024-01-20', status: 'active', subscription: 'Annual Basic' },
      { id: 'MEM005', name: 'Roshan Wickramasinghe', email: 'david.r@email.com', phone: '+94123456785', joinDate: '2024-01-12', status: 'suspended', subscription: 'Premium Monthly' }
    ],
    staff: [
      { id: 'STF001', name: 'Nuwan De Silva', email: 'mike.d@email.com', phone: '+94123456784', role: 'admin', hireDate: '2023-06-01', status: 'active' },
      { id: 'STF002', name: 'Samanthi Rajapakse', email: 'lisa.t@email.com', phone: '+94123456783', role: 'manager', hireDate: '2023-08-15', status: 'active' },
      { id: 'STF003', name: 'Ashan Bandara', email: 'alex.b@email.com', phone: '+94123456782', role: 'instructor', hireDate: '2023-09-10', status: 'active' },
      { id: 'STF004', name: 'Malsha Gunawardena', email: 'maria.g@email.com', phone: '+94123456781', role: 'receptionist', hireDate: '2023-10-05', status: 'inactive' }
    ],
    trainers: [
      { id: 'TRN001', name: 'Sanduni Silva', email: 'sarah.trainer@email.com', phone: '+94123456780', specialization: 'Weightlifting', hourlyRate: 2500, status: 'active' },
      { id: 'TRN002', name: 'Tharindu Mendis', email: 'tom.w@email.com', phone: '+94123456779', specialization: 'Yoga', hourlyRate: 2000, status: 'active' },
      { id: 'TRN003', name: 'Janani Wijesinghe', email: 'jessica.l@email.com', phone: '+94123456778', specialization: 'Cardio', hourlyRate: 2200, status: 'inactive' }
    ]
  };

  const tabCountElements = document.querySelectorAll('[data-tab-count]');
  let activeTab = 'members';
  let searchTerm = '';
  let selectedRole = roleFilterSelect ? roleFilterSelect.value : 'all';

  function updateCounts() {
    tabCountElements.forEach((countEl) => {
      const key = countEl.getAttribute('data-tab-count');
      if (key && data[key]) {
        countEl.textContent = data[key].length;
      }
    });
  }

  function updateTabButtonStates() {
    tabButtons.forEach((button) => {
      const tab = button.getAttribute('data-admin-users-tab');
      const isActive = tab === activeTab;

      if (isActive) {
        button.classList.add('border-red-500', 'text-red-500');
        button.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
      } else {
        button.classList.remove('border-red-500', 'text-red-500');
        button.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
      }

      button.setAttribute('aria-selected', String(isActive));
    });
  }

  function updateRoleFilterVisibility() {
    if (!roleFilterWrapper) {
      return;
    }

    if (activeTab === 'staff') {
      roleFilterWrapper.classList.remove('hidden');
    } else {
      roleFilterWrapper.classList.add('hidden');
    }
  }

  function getStatusBadge(status) {
    let badgeClasses = 'text-gray-600 bg-gray-100';
    if (status === 'active') {
      badgeClasses = 'text-green-600 bg-green-500/20';
    } else if (status === 'inactive') {
      badgeClasses = 'text-gray-500 bg-gray-200';
    } else if (status === 'suspended') {
      badgeClasses = 'text-red-600 bg-red-500/20';
    }
    return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${badgeClasses}">${status}</span>`;
  }

  function getRoleBadge(role) {
    let badgeClasses = 'text-gray-600 bg-gray-100';
    if (role === 'admin') {
      badgeClasses = 'text-red-500 bg-red-500/20';
    } else if (role === 'manager') {
      badgeClasses = 'text-blue-500 bg-blue-500/20';
    } else if (role === 'instructor') {
      badgeClasses = 'text-green-600 bg-green-500/20';
    } else if (role === 'receptionist') {
      badgeClasses = 'text-purple-500 bg-purple-500/20';
    }
    return `<span class="px-2 py-1 rounded-full text-xs font-semibold capitalize ${badgeClasses}">${role}</span>`;
  }

  function getMembersTableRows(items) {
    return items.map((member) => `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 whitespace-nowrap">
          <div>
            <div class="text-sm font-medium text-gray-900">${member.name}</div>
            <div class="text-sm text-gray-500">${member.id}</div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm text-gray-900">${member.email}</div>
          <div class="text-sm text-gray-500">${member.phone}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${member.joinDate}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${member.subscription}</td>
        <td class="px-6 py-4 whitespace-nowrap">${getStatusBadge(member.status)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <button type="button" class="text-red-500 hover:text-red-600 mr-3">Edit</button>
          <button type="button" class="text-gray-500 hover:text-gray-700">View</button>
        </td>
      </tr>
    `).join('');
  }

  function getStaffTableRows(items) {
    return items.map((staffMember) => `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 whitespace-nowrap">
          <div>
            <div class="text-sm font-medium text-gray-900">${staffMember.name}</div>
            <div class="text-sm text-gray-500">${staffMember.id}</div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm text-gray-900">${staffMember.email}</div>
          <div class="text-sm text-gray-500">${staffMember.phone}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">${getRoleBadge(staffMember.role)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${staffMember.hireDate}</td>
        <td class="px-6 py-4 whitespace-nowrap">${getStatusBadge(staffMember.status)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <button type="button" class="text-red-500 hover:text-red-600 mr-3">Edit</button>
          <button type="button" class="text-gray-500 hover:text-gray-700">View</button>
        </td>
      </tr>
    `).join('');
  }

  function getTrainersTableRows(items) {
    return items.map((trainer) => `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 whitespace-nowrap">
          <div>
            <div class="text-sm font-medium text-gray-900">${trainer.name}</div>
            <div class="text-sm text-gray-500">${trainer.id}</div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm text-gray-900">${trainer.email}</div>
          <div class="text-sm text-gray-500">${trainer.phone}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${trainer.specialization}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rs. ${trainer.hourlyRate.toLocaleString('en-US')}</td>
        <td class="px-6 py-4 whitespace-nowrap">${getStatusBadge(trainer.status)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <button type="button" class="text-red-500 hover:text-red-600 mr-3">Edit</button>
          <button type="button" class="text-gray-500 hover:text-gray-700">View</button>
        </td>
      </tr>
    `).join('');
  }

  function renderTable() {
    const dataset = data[activeTab] || [];
    const searchValue = searchTerm.trim().toLowerCase();

    const filteredItems = dataset.filter((item) => {
      const matchesSearch = !searchValue ||
        item.name.toLowerCase().includes(searchValue) ||
        item.email.toLowerCase().includes(searchValue) ||
        item.id.toLowerCase().includes(searchValue);

      if (activeTab === 'staff') {
        const matchesRole = selectedRole === 'all' || item.role === selectedRole;
        return matchesSearch && matchesRole;
      }

      return matchesSearch;
    });

    if (!filteredItems.length) {
      tableContainer.innerHTML = '<div class="p-6 text-center text-gray-500">No users match your filters yet.</div>';
      return;
    }

    let header = '';
    let rows = '';

    if (activeTab === 'members') {
      header = `
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      `;
      rows = getMembersTableRows(filteredItems);
    } else if (activeTab === 'staff') {
      header = `
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hire Date</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      `;
      rows = getStaffTableRows(filteredItems);
    } else {
      header = `
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trainer</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialization</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hourly Rate</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      `;
      rows = getTrainersTableRows(filteredItems);
    }

    tableContainer.innerHTML = `
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">${header}</thead>
          <tbody class="bg-white divide-y divide-gray-200">${rows}</tbody>
        </table>
      </div>
    `;
  }

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const tab = button.getAttribute('data-admin-users-tab');
      if (!tab || tab === activeTab) {
        return;
      }

      activeTab = tab;
      updateTabButtonStates();
      updateRoleFilterVisibility();
      renderTable();
    });
  });

  searchInput.addEventListener('input', (event) => {
    searchTerm = event.target.value || '';
    renderTable();
  });

  if (roleFilterSelect) {
    roleFilterSelect.addEventListener('change', (event) => {
      selectedRole = event.target.value;
      renderTable();
    });
  }

  updateCounts();
  updateTabButtonStates();
  updateRoleFilterVisibility();
  renderTable();
}

function initializeModernUI() {
  applyModernFormControls();
  applyModernButtons();
}

function applyModernFormControls() {
  const textInputs = document.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"])');
  const fileInputs = document.querySelectorAll('input[type="file"]');
  const textAreas = document.querySelectorAll('textarea');
  const selects = document.querySelectorAll('select');
  const leadingPaddingClasses = ['pl-2', 'pl-3', 'pl-4', 'pl-5', 'pl-6', 'pl-8', 'pl-10', 'pl-12', 'pl-14'];
  const trailingPaddingClasses = ['pr-2', 'pr-3', 'pr-4', 'pr-5', 'pr-6', 'pr-8', 'pr-10', 'pr-12', 'pr-14'];
  const legacyPositionClasses = ['absolute', 'inset-y-0', 'left-0', 'right-0', 'pl-3', 'pr-3', 'flex', 'items-center'];

  [...textInputs, ...fileInputs, ...textAreas, ...selects].forEach((field) => {
    const isHiddenFileInput = field.type === 'file' && field.classList.contains('hidden');
    if (isHiddenFileInput) {
      field.setAttribute('aria-hidden', 'true');
      field.style.display = 'none';
      return;
    }

    field.classList.add('form-control');

    const parent = field.parentElement;
    if (!parent) {
      return;
    }

    const leadingIcon = parent.querySelector('.absolute.inset-y-0.left-0');
    const trailingIcon = parent.querySelector('.absolute.inset-y-0.right-0');
    const trailingButton = parent.querySelector('button.password-toggle, button.trailing-action');

    if (leadingIcon || trailingIcon || trailingButton) {
      parent.classList.add('input-stack');
    }

    if (leadingIcon) {
      leadingIcon.classList.add('leading-icon');
      leadingIcon.setAttribute('aria-hidden', 'true');
      legacyPositionClasses.forEach((cls) => leadingIcon.classList.remove(cls));
      parent.classList.add('has-leading-icon');
      leadingPaddingClasses.forEach((cls) => field.classList.remove(cls));
      field.classList.add('input-icon-left');
      field.style.paddingLeft = '3.4rem';
      field.style.minHeight = '3.25rem';
    }

    if (trailingIcon) {
      trailingIcon.classList.add('trailing-icon');
      trailingIcon.setAttribute('aria-hidden', 'true');
      legacyPositionClasses.forEach((cls) => trailingIcon.classList.remove(cls));
      parent.classList.add('has-trailing-icon');
      trailingPaddingClasses.forEach((cls) => field.classList.remove(cls));
      field.classList.add('input-icon-right');
      field.style.paddingRight = '3.4rem';
      field.style.minHeight = '3.25rem';
    }

    if (trailingButton) {
      trailingButton.classList.add('trailing-action');
      legacyPositionClasses.forEach((cls) => trailingButton.classList.remove(cls));
      parent.classList.add('has-trailing-icon');
      trailingPaddingClasses.forEach((cls) => field.classList.remove(cls));
      field.classList.add('input-icon-right');
      field.style.paddingRight = '3.4rem';
      field.style.minHeight = '3.25rem';
    }
  });
}

function applyModernButtons() {
  const primarySubmits = document.querySelectorAll('button[type="submit"], input[type="submit"]');
  primarySubmits.forEach((btn) => {
    btn.classList.add('btn', 'btn-primary', 'btn-full');
    [
      'bg-gradient-to-r', 'from-red-600', 'to-red-700', 'hover:from-red-700', 'hover:to-red-800',
      'disabled:from-gray-400', 'disabled:to-gray-500', 'text-white', 'py-3', 'px-4', 'transition-all',
      'duration-300', 'transform', 'hover:scale-105', 'hover:shadow-xl', 'disabled:scale-100', 'disabled:shadow-none'
    ].forEach((cls) => btn.classList.remove(cls));
  });

  const legacyPrimaryButtons = document.querySelectorAll([
    'button.bg-red-600',
    'button.bg-red-500',
    'button.bg-gradient-to-r',
    'a.bg-red-600',
    'a.bg-red-500',
    'a.bg-gradient-to-r',
    'button.from-red-600',
    'a.from-red-600'
  ].join(','));

  legacyPrimaryButtons.forEach((btn) => {
    if (
      btn.classList.contains('btn') ||
      btn.classList.contains('document-type-btn') ||
      btn.closest('[data-quick-actions]') ||
      btn.matches('.quick-action-card, [data-check-in-card], .quick-action-card *')
    ) {
      return;
    }

    btn.classList.add('btn', 'btn-primary');
    [
      'bg-red-600', 'bg-red-500', 'bg-gradient-to-r', 'from-red-600', 'to-red-700', 'hover:bg-red-700',
      'hover:bg-red-800', 'hover:from-red-700', 'hover:to-red-800', 'text-white', 'py-2', 'py-2.5', 'py-3',
      'px-4', 'px-5', 'px-6', 'rounded-lg', 'transition-all', 'duration-300', 'transform', 'hover:scale-105',
      'hover:shadow-lg', 'hover:shadow-xl'
    ].forEach((cls) => btn.classList.remove(cls));
  });

  const legacyOutlineButtons = document.querySelectorAll([
    'button.border-2',
    'a.border-2'
  ].join(','));

  legacyOutlineButtons.forEach((btn) => {
    if (
      btn.classList.contains('btn') ||
      btn.classList.contains('document-type-btn') ||
      btn.closest('[data-quick-actions]') ||
      btn.matches('.quick-action-card, [data-check-in-card], .quick-action-card *')
    ) {
      return;
    }

    btn.classList.add('btn', 'btn-outline');
    ['border-2', 'border-secondary', 'text-secondary', 'hover:text-red-500', 'transition-colors'].forEach((cls) => btn.classList.remove(cls));
  });

  const navLoginLinks = document.querySelectorAll('nav a[href="login.html"]');
  navLoginLinks.forEach((link) => {
    link.classList.add('btn', 'btn-primary', 'btn-sm');
  });

  const navRegisterLinks = document.querySelectorAll('nav a[href="register.html"]');
  navRegisterLinks.forEach((link) => {
    link.classList.add('btn', 'btn-outline', 'btn-sm');
  });

  const heroCTAButtons = document.querySelectorAll('main a[href="register.html"], .hero-cta');
  heroCTAButtons.forEach((link) => {
    link.classList.add('btn', 'btn-primary', 'btn-lg');
  });

  const secondaryLinks = document.querySelectorAll('a.border-2.text-red-500');
  secondaryLinks.forEach((link) => {
    link.classList.add('btn', 'btn-outline');
  });

  const socialButtons = document.querySelectorAll('.grid button[type="button"], .social-login button[type="button"], button[data-social]');
  socialButtons.forEach((btn) => {
    btn.classList.add('btn', 'btn-white', 'btn-full');
    ['inline-flex', 'justify-center', 'py-3', 'px-4', 'border', 'border-secondary', 'bg-primary', 'text-sm', 'font-medium', 'text-secondary', 'hover:bg-secondary', 'transition-colors']
      .forEach((cls) => btn.classList.remove(cls));
  });

  const outlineActions = document.querySelectorAll('button.btn-outline, a.btn-outline');
  outlineActions.forEach((btn) => {
    btn.classList.add('btn');
  });
}

function initializeWelcomeCountdown() {
  const countdownElement = document.getElementById('countdown');
  if (!countdownElement) return;
  
  let timeLeft = 8;
  countdownElement.textContent = timeLeft;
  
  const countdown = setInterval(() => {
    timeLeft--;
    countdownElement.textContent = timeLeft;
    
    if (timeLeft <= 0) {
      clearInterval(countdown);
      window.location.href = 'dashboard.html';
    }
  }, 1000);
}

function showFieldError(input, message) {
  // Field error display disabled - no validations
  return;
}

function clearFieldError(input) {
  // Field error clearing disabled - no validations
  return;
}

