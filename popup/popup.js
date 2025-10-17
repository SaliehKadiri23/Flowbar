// Flowbar Popup Logic - 2025 Modern UI
// Core logic for the popup UI to interact with the background timer

// Store references to DOM elements
const timerDisplay = document.getElementById('timerDisplay');
const controlButton = document.getElementById('controlButton');
const resetButton = document.getElementById('resetButton');
const settingsIcon = document.getElementById('settingsIcon');
const themeToggle = document.getElementById('themeToggle');
const progressRing = document.querySelector('.progress-ring-circle');
const focusCountElement = document.getElementById('focusCount');
const totalTimeElement = document.getElementById('totalTime');
const stateDots = document.querySelectorAll('.state-dot');

// Progress ring constants
const CIRCLE_RADIUS = 90;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

// Store the current interval ID to clear when needed
let updateInterval = null;

// Initialize the popup when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize theme from storage
  await initializeTheme();
  
  // Read the current timer state from storage to display the correct initial view
  await initializeTimerDisplay();
  
  // Load session stats
  await loadSessionStats();
  
  // Set up event listeners
  setupEventListeners();
  
  // Listen for state changes from background script
  setupStorageListener();
});

/**
 * Initialize theme from storage or system preference
 */
async function initializeTheme() {
  try {
    const result = await chrome.storage.sync.get(['theme']);
    const savedTheme = result.theme;
    
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
        await chrome.storage.sync.set({ theme: 'dark' });
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        await chrome.storage.sync.set({ theme: 'light' });
      }
    }
  } catch (error) {
    console.error("Flowbar popup.js error initializing theme:", error);
  }
}

/**
 * Reads the timer state from chrome.storage.sync on load to display the correct initial view
 */
async function initializeTimerDisplay() {
  try {
    const result = await chrome.storage.sync.get([
      'timerState', 
      'focusDuration', 
      'breakDuration', 
      'timeLeft', 
      'endTime',
      'totalDuration'
    ]);
    
    // Set default values if not found
    const timerState = result.timerState || 'stopped';
    const focusDuration = result.focusDuration || 25 * 60; // 25 minutes in seconds
    const breakDuration = result.breakDuration || 5 * 60;  // 5 minutes in seconds
    let timeLeft = result.timeLeft || focusDuration;
    const endTime = result.endTime || null;
    const totalDuration = result.totalDuration || focusDuration;
    
    // If timer is running and we have an endTime, calculate remaining time
    if ((timerState === 'focus' || timerState === 'break' || timerState === 'wind-down') && endTime) {
      const now = Date.now();
      const remainingMs = Math.max(0, endTime - now);
      timeLeft = Math.floor(remainingMs / 1000);
    }
    
    // Update the UI based on the current state
    updateUIBasedOnState(timerState, timeLeft, endTime, totalDuration);
    
    // If timer is running, start updating the display
    if (timerState === 'focus' || timerState === 'break' || timerState === 'wind-down') {
      startUpdatingTimerDisplay();
    }
  } catch (error) {
    console.error("Flowbar popup.js error initializing timer display:", error);
  }
}

/**
 * Load and display session statistics
 */
async function loadSessionStats() {
  try {
    // Get the time data from local storage
    const timeDataResult = await chrome.storage.local.get(['timeData']);
    const timeData = timeDataResult.timeData || {
      flowScores: {},
      totalFocusTime: 0,
      sessionHistory: []
    };
    
    // Get today's date for filtering (YYYY-MM-DD format)
    const today = new Date().toISOString().split('T')[0];
    
    // Filter completed focus sessions for today
    const todayFocusSessions = timeData.sessionHistory.filter(session => {
      // Check if session is completed (has endTime) and of type focus
      if (session.type === 'focus' && session.endTime) {
        // Convert the endTime to date string and compare with today
        const sessionDate = new Date(session.endTime).toISOString().split('T')[0];
        return sessionDate === today;
      }
      return false;
    });
    
    // Count completed focus sessions for today
    const focusSessionsToday = todayFocusSessions.length;
    
    // Calculate total focus time for today (in seconds)
    const totalFocusTimeToday = todayFocusSessions.reduce((total, session) => total + session.duration, 0);
    
    // Update the UI
    focusCountElement.textContent = focusSessionsToday;
    
    // Format total time for today
    if (totalFocusTimeToday < 60) {
      totalTimeElement.textContent = `${totalFocusTimeToday}s`;
    } else if (totalFocusTimeToday < 3600) {
      totalTimeElement.textContent = `${Math.floor(totalFocusTimeToday / 60)}m`;
    } else {
      const hours = Math.floor(totalFocusTimeToday / 3600);
      const minutes = Math.floor((totalFocusTimeToday % 3600) / 60);
      totalTimeElement.textContent = `${hours}h ${minutes}m`;
    }
  } catch (error) {
    console.error("Flowbar popup.js error loading session stats:", error);
  }
}

/**
 * Sets up event listeners for UI elements
 */
function setupEventListeners() {
  // Event listener for the start/stop button that sends messages to background.js
  controlButton.addEventListener('click', async () => {
    try {
      // Add ripple effect
      addRippleEffect(controlButton);
      
      // Determine action based on current timer state
      const result = await chrome.storage.sync.get(['timerState']);
      const currentState = result.timerState || 'stopped';
      
      if (currentState === 'stopped') {
        // Start a new timer
        await chrome.runtime.sendMessage({ action: 'startTimer' });
      } else if (currentState === 'paused') {
        // Resume the paused timer
        await chrome.runtime.sendMessage({ action: 'resumeTimer' });
      } else {
        // Pause the running timer
        await chrome.runtime.sendMessage({ action: 'pauseTimer' });
      }
    } catch (error) {
      console.error("Flowbar popup.js error handling button click:", error);
    }
  });
  
  // Event listener for the reset button to restart the timer
  resetButton.addEventListener('click', async () => {
    try {
      // Add ripple effect
      addRippleEffect(resetButton);
      
      await chrome.runtime.sendMessage({ action: 'resetTimer' });
    } catch (error) {
      console.error("Flowbar popup.js error handling reset button click:", error);
    }
  });
  
  // Settings icon click handler
  settingsIcon.addEventListener('click', () => {
    // Add ripple effect
    addRippleEffect(settingsIcon);
    
    // Open the options page in a new tab
    chrome.runtime.openOptionsPage();
  });
  
  // Theme toggle click handler
  themeToggle.addEventListener('click', async () => {
    try {
      // Add ripple effect
      addRippleEffect(themeToggle);
      
      // Toggle theme
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      // Update DOM
      document.documentElement.setAttribute('data-theme', newTheme);
      
      // Save to storage
      await chrome.storage.sync.set({ theme: newTheme });
    } catch (error) {
      console.error("Flowbar popup.js error handling theme toggle:", error);
    }
  });
  
  // State dots click handlers
  stateDots.forEach(dot => {
    dot.addEventListener('click', async () => {
      try {
        // Get the state from the class
        const classes = dot.classList;
        let targetState = null;
        
        if (classes.contains('focus')) targetState = 'focus';
        else if (classes.contains('break')) targetState = 'break';
        else if (classes.contains('wind-down')) targetState = 'wind-down';
        
        if (targetState) {
          // Update active state visually
          stateDots.forEach(d => d.classList.remove('active'));
          dot.classList.add('active');
          
          // Send message to switch mode
          await chrome.runtime.sendMessage({ action: 'switchMode', mode: targetState });
        }
      } catch (error) {
        console.error("Flowbar popup.js error handling state dot click:", error);
      }
    });
  });
}

/**
 * Updates the UI based on the current timer state
 */
function updateUIBasedOnState(timerState, timeLeft, endTime, totalDuration = null) {
  // Update the body class for state-specific styling
  document.body.className = timerState;
  
  // Update active state dot
  stateDots.forEach(dot => {
    dot.classList.remove('active');
    if (dot.classList.contains(timerState)) {
      dot.classList.add('active');
    }
  });
  
  // Update the button text and style based on timer state
  const buttonIcon = controlButton.querySelector('.button-icon');
  const buttonText = controlButton.querySelector('.button-text');
  
  switch (timerState) {
    case 'focus':
      buttonText.textContent = 'Pause Focus';
      buttonIcon.textContent = 'pause';
      controlButton.className = 'control-button stop-button';
      break;
    case 'wind-down':
      buttonText.textContent = 'Pause Wind-Down';
      buttonIcon.textContent = 'pause';
      controlButton.className = 'control-button stop-button';
      break;
    case 'break':
      buttonText.textContent = 'Pause Break';
      buttonIcon.textContent = 'pause';
      controlButton.className = 'control-button stop-button';
      break;
    case 'paused':
      buttonText.textContent = 'Resume';
      buttonIcon.textContent = 'play_arrow';
      controlButton.className = 'control-button start-button';
      break;
    default: // 'stopped'
      buttonText.textContent = 'Start Focus';
      buttonIcon.textContent = 'play_arrow';
      controlButton.className = 'control-button start-button';
  }
  
  // Update the timer display with formatted time
  timerDisplay.textContent = formatTime(timeLeft);
  
  // Update progress ring if we have total duration
  if (totalDuration && timeLeft >= 0) {
    const progress = 1 - (timeLeft / totalDuration);
    const dashoffset = CIRCLE_CIRCUMFERENCE * (1 - progress);
    progressRing.style.strokeDashoffset = dashoffset;
  } else {
    progressRing.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE;
  }
}

/**
 * Starts updating the timer display every second
 */
function startUpdatingTimerDisplay() {
  // Clear any existing interval to prevent multiple intervals
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  
  // Update the display every second
  updateInterval = setInterval(async () => {
    try {
      const result = await chrome.storage.sync.get(['timerState', 'timeLeft', 'endTime', 'totalDuration']);
      const timerState = result.timerState || 'stopped';
      const timeLeft = result.timeLeft || 0;
      const endTime = result.endTime || null;
      const totalDuration = result.totalDuration || 0;
      
      // Only update if timer is running
      if (timerState === 'focus' || timerState === 'break' || timerState === 'wind-down') {
        // If we have an endTime, calculate the real-time remaining (more accurate)
        if (endTime) {
          const now = Date.now();
          const remainingMs = Math.max(0, endTime - now);
          const calculatedTimeLeft = Math.floor(remainingMs / 1000);
          
          // Update timer display
          timerDisplay.textContent = formatTime(calculatedTimeLeft);
          
          // Update progress ring
          const progress = 1 - (calculatedTimeLeft / totalDuration);
          const dashoffset = CIRCLE_CIRCUMFERENCE * (1 - progress);
          progressRing.style.strokeDashoffset = dashoffset;
        } else {
          // Fallback to the stored timeLeft if no endTime is available
          timerDisplay.textContent = formatTime(timeLeft);
        }
      } else {
        // If timer is not running, stop the interval
        clearInterval(updateInterval);
        updateInterval = null;
      }
    } catch (error) {
      console.error("Flowbar popup.js error updating timer display:", error);
    }
  }, 1000);
}

/**
 * Sets up the chrome.storage.onChanged listener to keep the UI in sync with background state changes
 */
function setupStorageListener() {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
      // Check if timer-related values have changed
      if (changes.timerState || changes.timeLeft || changes.endTime || changes.totalDuration) {
        // Update the UI with the new state
        (async () => {
          const current = await chrome.storage.sync.get(['timerState', 'timeLeft', 'endTime', 'totalDuration']);
          let state = current.timerState;
          let left = current.timeLeft;
          let end = current.endTime;
          let total = current.totalDuration;
          
          // If timer is running and we have an endTime, calculate remaining time
          if ((state === 'focus' || state === 'break' || state === 'wind-down') && end) {
            const now = Date.now();
            const remainingMs = Math.max(0, end - now);
            left = Math.floor(remainingMs / 1000);
          }
          
          updateUIBasedOnState(state, left, end, total);
          
          // If timer is running, ensure we're updating the display
          if (state === 'focus' || state === 'break' || state === 'wind-down') {
            startUpdatingTimerDisplay();
          } else {
            // If timer is not running, stop the interval
            if (updateInterval) {
              clearInterval(updateInterval);
              updateInterval = null;
            }
          }
        })();
      }
      
      // Check if theme has changed
      if (changes.theme) {
        document.documentElement.setAttribute('data-theme', changes.theme.newValue);
      }
    }
    
    // Listen for changes to timeData in local storage (for session stats)
    if (namespace === 'local' && changes.timeData) {
      loadSessionStats();
    }
  });
}

/**
 * Formats seconds into MM:SS format
 */
function formatTime(seconds) {
  const mins = Math.floor(Math.abs(seconds) / 60);
  const secs = Math.abs(seconds) % 60;
  const sign = seconds < 0 ? '-' : '';
  return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Adds a ripple effect to an element when clicked
 */
function addRippleEffect(element) {
  // Create ripple element
  const ripple = document.createElement('span');
  ripple.classList.add('ripple');
  
  // Position the ripple at the click position
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  
  // Add the ripple to the element
  element.appendChild(ripple);
  
  // Remove the ripple after animation completes
  setTimeout(() => {
    ripple.remove();
  }, 800);
}