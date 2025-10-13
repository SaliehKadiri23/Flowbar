// Flowbar Popup Logic
// Core logic for the popup UI to interact with the background timer

// Store references to DOM elements
const timerDisplay = document.getElementById('timerDisplay');
const controlButton = document.getElementById('controlButton');
const resetButton = document.getElementById('resetButton');
const settingsIcon = document.getElementById('settingsIcon');

// Store the current interval ID to clear when needed
let updateInterval = null;

// Initialize the popup when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Read the current timer state from storage to display the correct initial view
  await initializeTimerDisplay();
  
  // Set up event listeners
  setupEventListeners();
  
  // Listen for state changes from background script
  setupStorageListener();
});

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
      'endTime'
    ]);
    
    // Set default values if not found
    const timerState = result.timerState || 'stopped';
    const focusDuration = result.focusDuration || 25 * 60; // 25 minutes in seconds
    const breakDuration = result.breakDuration || 5 * 60;  // 5 minutes in seconds
    let timeLeft = result.timeLeft || focusDuration;
    const endTime = result.endTime || null;
    
    // If timer is running and we have an endTime, calculate remaining time
    if ((timerState === 'focus' || timerState === 'break') && endTime) {
      const now = Date.now();
      const remainingMs = Math.max(0, endTime - now);
      timeLeft = Math.floor(remainingMs / 1000);
    }
    
    // Update the UI based on the current state
    updateUIBasedOnState(timerState, timeLeft, endTime);
    
    // If timer is running, start updating the display
    if (timerState === 'focus' || timerState === 'break') {
      startUpdatingTimerDisplay();
    }
  } catch (error) {
    console.error("Flowbar popup.js error initializing timer display:", error);
  }
}

/**
 * Sets up event listeners for UI elements
 */
function setupEventListeners() {
  // Event listener for the start/stop button that sends messages to background.js
  controlButton.addEventListener('click', async () => {
    try {
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
      await chrome.runtime.sendMessage({ action: 'resetTimer' });
    } catch (error) {
      console.error("Flowbar popup.js error handling reset button click:", error);
    }
  });
  
  // Settings icon click handler
  settingsIcon.addEventListener('click', () => {
    // Open the options page in a new tab
    chrome.runtime.openOptionsPage();
  });
}

/**
 * Updates the UI based on the current timer state
 */
function updateUIBasedOnState(timerState, timeLeft, endTime) {
  // Update the button text and style based on timer state
  switch (timerState) {
    case 'focus':
      controlButton.textContent = 'Pause Focus';
      controlButton.className = 'control-button stop-button';
      break;
    case 'break':
      controlButton.textContent = 'Pause Break';
      controlButton.className = 'control-button stop-button';
      break;
    case 'paused':
      controlButton.textContent = 'Resume';
      controlButton.className = 'control-button start-button';
      break;
    default: // 'stopped'
      controlButton.textContent = 'Start Focus';
      controlButton.className = 'control-button start-button';
  }
  
  // Update the timer display with formatted time
  timerDisplay.textContent = formatTime(timeLeft);
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
      const result = await chrome.storage.sync.get(['timerState', 'timeLeft', 'endTime']);
      const timerState = result.timerState || 'stopped';
      const timeLeft = result.timeLeft || 0;
      const endTime = result.endTime || null;
      
      // Only update if timer is running
      if (timerState === 'focus' || timerState === 'break') {
        // If we have an endTime, calculate the real-time remaining (more accurate)
        if (endTime) {
          const now = Date.now();
          const remainingMs = Math.max(0, endTime - now);
          const calculatedTimeLeft = Math.floor(remainingMs / 1000);
          timerDisplay.textContent = formatTime(calculatedTimeLeft);
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
      if (changes.timerState || changes.timeLeft || changes.endTime) {
        // Update the UI with the new state
        (async () => {
          const current = await chrome.storage.sync.get(['timerState', 'timeLeft', 'endTime']);
          let state = current.timerState;
          let left = current.timeLeft;
          let end = current.endTime;
          
          // If timer is running and we have an endTime, calculate remaining time
          if ((state === 'focus' || state === 'break') && end) {
            const now = Date.now();
            const remainingMs = Math.max(0, end - now);
            left = Math.floor(remainingMs / 1000);
          }
          
          updateUIBasedOnState(state, left, end);
          
          // If timer is running, ensure we're updating the display
          if (state === 'focus' || state === 'break') {
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