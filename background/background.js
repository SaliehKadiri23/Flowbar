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