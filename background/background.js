// Flowbar background script - Core timer state management

/**
 * Gets the current timer state from chrome.storage.sync
 * @returns {Promise<Object>} The timer state object containing timerState and endTime
 */
async function getTimerState() {
  try {
    const result = await chrome.storage.sync.get(['timerState', 'endTime']);
    // Return the timer state with defaults if not set
    return {
      timerState: result.timerState || 'stopped', // Possible states: 'stopped', 'focus', 'break'
      endTime: result.endTime || null
    };
  } catch (error) {
    console.error('Flowbar background.js error:', error);
    // Return default state in case of error
    return {
      timerState: 'stopped',
      endTime: null
    };
  }
}

/**
 * Sets the timer state in chrome.storage.sync
 * @param {Object} state - The state object containing timerState and endTime
 * @param {string} state.timerState - The current state of the timer (e.g., 'stopped', 'focus', 'break')
 * @param {number|null} state.endTime - The Unix timestamp for when the timer ends, or null
 * @returns {Promise<void>}
 */
async function setTimerState(state) {
  try {
    await chrome.storage.sync.set({
      timerState: state.timerState,
      endTime: state.endTime
    });
  } catch (error) {
    console.error('Flowbar background.js error:', error);
  }
}

/**
 * Starts a timer with the specified duration and state
 * @param {number} duration - Duration in minutes
 * @param {'focus'|'break'} state - The state to start ('focus' or 'break')
 * @returns {Promise<void>}
 */
async function startTimer(duration, state) {
  try {
    // Calculate the end time (current time + duration in milliseconds)
    const now = Date.now();
    const endTime = now + (duration * 60 * 1000); // Convert minutes to milliseconds

    // Set the timer state
    await setTimerState({ timerState: state, endTime });

    // Create an alarm that will fire at the end time
    await chrome.alarms.create(`timer_${state}`, {
      when: endTime
    });
  } catch (error) {
    console.error('Flowbar background.js error:', error);
  }
}

/**
 * Stops the current timer and clears any active alarms
 * @returns {Promise<void>}
 */
async function stopTimer() {
  try {
    // Clear any existing alarms
    await chrome.alarms.clearAll();

    // Reset the timer state to stopped
    await setTimerState({ timerState: 'stopped', endTime: null });
  } catch (error) {
    console.error('Flowbar background.js error:', error);
  }
}

// Alarm listener to handle timer transitions
chrome.alarms.onAlarm.addListener(async (alarm) => {
  try {
    // Get the current timer state
    const currentState = await getTimerState();

    // Determine the next state based on the current state
    let nextState;
    let nextDuration;

    if (currentState.timerState === 'focus') {
      // After focus, transition to break (default 5 minutes)
      nextState = 'break';
      // In a real implementation, we would get the break duration from options
      nextDuration = 5; // Default break duration in minutes
    } else if (currentState.timerState === 'break') {
      // After break, transition back to focus (default 25 minutes)
      nextState = 'focus';
      // In a real implementation, we would get the focus duration from options
      nextDuration = 25; // Default focus duration in minutes
    } else {
      // If in any other state, just stop
      await setTimerState({ timerState: 'stopped', endTime: null });
      return;
    }

    // Start the next timer phase
    await startTimer(nextDuration, nextState);
  } catch (error) {
    console.error('Flowbar background.js error in alarm listener:', error);
  }
});