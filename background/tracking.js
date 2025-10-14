// Flowbar Time Tracking Module

/**
 * Gets the current time tracking data from chrome.storage.local
 * @returns {Promise<Object>} The time tracking data object containing flowScores, totalFocusTime, and sessionHistory
 */
async function getTimeData() {
  try {
    const result = await chrome.storage.local.get(['timeData']);
    
    // Return the time data with defaults if not set
    return result.timeData || {
      flowScores: {}, // Object to store flow scores by date (e.g., { '2023-10-15': 42 })
      totalFocusTime: 0, // Total accumulated focus time in seconds
      sessionHistory: [] // Array of session objects { startTime, endTime, duration, type }
    };
  } catch (error) {
    console.error('Flowbar tracking.js error getting time data:', error);
    // Return default structure in case of error
    return {
      flowScores: {},
      totalFocusTime: 0,
      sessionHistory: []
    };
  }
}

/**
 * Sets the time tracking data in chrome.storage.local
 * @param {Object} timeData - The time tracking data object
 * @param {Object} timeData.flowScores - Object to store flow scores by date
 * @param {number} timeData.totalFocusTime - Total accumulated focus time in seconds
 * @param {Array} timeData.sessionHistory - Array of session objects
 * @returns {Promise<void>}
 */
async function setTimeData(timeData) {
  try {
    await chrome.storage.local.set({
      timeData: timeData
    });
  } catch (error) {
    console.error('Flowbar tracking.js error setting time data:', error);
  }
}

// Make functions available globally for the background script
globalThis.getTimeData = getTimeData;
globalThis.setTimeData = setTimeData;