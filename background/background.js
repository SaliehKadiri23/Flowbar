// Flowbar background script - Core timer state management

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

/**
 * Calculates the flow score for a specific domain
 * @param {string} domain - The domain to calculate the score for
 * @param {Object} timeData - The time tracking data object
 * @returns {number} - The calculated flow score (0-100)
 */
async function calculateFlowScore(domain, timeData) {
  try {
    // Get distraction and focus sites from storage
    const settings = await chrome.storage.sync.get(['distractionSites', 'focusSites']);
    const distractionSites = (settings.distractionSites || '').split(',').map(site => site.trim()).filter(site => site);
    const focusSites = (settings.focusSites || '').split(',').map(site => site.trim()).filter(site => site);
    
    // Get all sessions for the specific domain
    const domainSessions = timeData.sessionHistory.filter(session => session.domain === domain);
    
    // Calculate focus time and distraction time separately for this domain
    const domainFocusTime = domainSessions
      .filter(session => session.type === 'focus' && !distractionSites.includes(session.domain))
      .reduce((total, session) => total + session.duration, 0);
    
    const domainDistractionTime = domainSessions
      .filter(session => session.type === 'focus' && distractionSites.includes(session.domain))
      .reduce((total, session) => total + session.duration, 0);
    
    // Calculate overall score based on balance of focus vs distraction time
    const totalTime = domainFocusTime + domainDistractionTime;
    
    if (totalTime === 0) {
      return 0; // No time spent on this domain
    }
    
    // Calculate score: higher focus time = higher score, higher distraction time = lower score
    // For distraction sites, heavily penalize the score
    if (distractionSites.includes(domain)) {
      // For distraction sites, the more time spent, the lower the score
      const hoursSpent = totalTime / 3600; // Convert to hours
      
      // More severe penalties for distraction sites
      if (hoursSpent > 2) {
        return 5;   // Very low score for spending more than 2 hours on a distraction site
      } else if (hoursSpent > 1) {
        return 10;  // Low score for 1-2 hours
      } else if (hoursSpent > 0.5) {
        return 20;  // 30 min to 1 hour
      } else if (hoursSpent > 0.25) {
        return 35;  // 15-30 min
      } else {
        return 50;  // Less than 15 min
      }
    } else if (focusSites.includes(domain)) {
      // For focus sites, reward the score based on time spent
      const hoursSpent = totalTime / 3600; // Convert to hours
      
      if (hoursSpent > 2) {
        return 95;  // Very high score for spending more than 2 hours on a focus site
      } else if (hoursSpent > 1) {
        return 85;  // High score for 1-2 hours
      } else if (hoursSpent > 0.5) {
        return 75;  // 30 min to 1 hour
      } else if (hoursSpent > 0.25) {
        return 65;  // 15-30 min
      } else {
        return 60;  // Less than 15 min
      }
    } else {
      // For non-distraction/focus sites, calculate based on ratio but with a penalty for any distraction time
      const focusPercentage = domainFocusTime > 0 ? (domainFocusTime / totalTime) * 100 : 0;
      
      // Apply a penalty if any distraction time was logged during session
      let baseScore;
      if (focusPercentage >= 90) {
        baseScore = 90;  // Mostly focus time
      } else if (focusPercentage >= 70) {
        baseScore = 75;  // Mostly focus time
      } else if (focusPercentage >= 50) {
        baseScore = 60;  // Balanced
      } else if (focusPercentage >= 30) {
        baseScore = 45;  // More distraction than focus
      } else if (focusPercentage > 0) {
        baseScore = 30;  // Mostly distraction time
      } else {
        baseScore = 15;  // All distraction time
      }
      
      // Also factor in total time spent (more time on productive sites = higher score)
      const hoursSpent = totalTime / 3600;
      if (hoursSpent > 2) {
        return Math.min(100, baseScore + 20); // Bonus for significant time on productive site
      } else if (hoursSpent > 1) {
        return Math.min(100, baseScore + 10);
      } else if (hoursSpent > 0.5) {
        return Math.min(100, baseScore + 5);
      } else {
        return baseScore;
      }
    }
  } catch (error) {
    console.error('Flowbar background.js error calculating flow score:', error);
    return 0;
  }
}

/**
 * Updates the border color for all tabs
 * @param {string} color - The color to set the border (e.g., 'rgba(46, 204, 113, 0.3)' for focus, 'rgba(52, 152, 219, 0.3)' for break)
 * @returns {Promise<void>}
 */
async function updateAllTabsBorder(color) {
  try {
    // Query all tabs (not just active ones) to ensure consistent border state across all tabs
    const tabs = await chrome.tabs.query({});

    // For each tab, inject the content script function to update the border
    for (const tab of tabs) {
      // Only inject into tabs that are not extension pages or special pages
      if (tab.url && 
          !tab.url.startsWith('chrome://') && 
          !tab.url.startsWith('chrome-extension://') && 
          !tab.url.startsWith('about:') && 
          !tab.url.startsWith('data:')) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (borderColor) => {
              // Create or update the style element for the border
              let style = document.getElementById('flowbar-styles');
              if (!style) {
                style = document.createElement('style');
                style.id = 'flowbar-styles';
                document.head.appendChild(style);
              }
              
              // Update the style with the new color
              style.textContent = `
                .flowbar-border {
                  position: fixed !important;
                  z-index: 2147483647 !important; /* Maximum z-index value */
                  pointer-events: none !important;
                  box-sizing: border-box !important;
                }
                
                .flowbar-border-top {
                  top: 0 !important;
                  left: 0 !important;
                  width: 100% !important;
                  height: 8px !important;
                  border-radius: 0 0 8px 8px !important;
                }
                
                .flowbar-border-right {
                  top: 0 !important;
                  right: 0 !important;
                  width: 8px !important;
                  height: 100% !important;
                  border-radius: 8px 0 0 8px !important;
                }
                
                .flowbar-border-bottom {
                  bottom: 0 !important;
                  left: 0 !important;
                  width: 100% !important;
                  height: 8px !important;
                  border-radius: 8px 8px 0 0 !important;
                }
                
                .flowbar-border-left {
                  top: 0 !important;
                  left: 0 !important;
                  width: 8px !important;
                  height: 100% !important;
                  border-radius: 0 8px 8px 0 !important;
                }
                
                .flowbar-focus {
                  background: linear-gradient(90deg, rgba(46, 204, 113, 0.3), rgba(39, 174, 96, 0.3)) !important;
                }
                
                .flowbar-break {
                  background: linear-gradient(90deg, rgba(52, 152, 219, 0.3), rgba(41, 128, 185, 0.3)) !important;
                }
                
                .flowbar-stopped {
                  background: transparent !important;
                }
                
                /* Dynamic color class that will be updated with the passed color */
                .flowbar-border-color {
                  background: ${borderColor} !important;
                  animation: flowbar-pulse 2s infinite ease-in-out !important;
                }
                
                @keyframes flowbar-pulse {
                  0% {
                    opacity: 0.3;
                  }
                  50% {
                    opacity: 0.6;
                  }
                  100% {
                    opacity: 0.3;
                  }
                }
              `;
              
              // Remove existing borders to avoid duplicates
              const existingBorders = document.querySelectorAll('[class*="flowbar-border"]');
              existingBorders.forEach(border => border.remove());
              
              // Create border elements for each side using the passed color
              const sides = ['top', 'right', 'bottom', 'left'];
              sides.forEach(side => {
                const border = document.createElement('div');
                border.className = `flowbar-border flowbar-border-${side} flowbar-border-color`;
                document.body.appendChild(border);
              });
            },
            args: [color]
          });
        } catch (injectError) {
          // If injection fails for a specific tab (e.g., due to permissions), continue with other tabs
          console.warn('Flowbar background.js warning: Could not inject into tab:', tab.url, injectError.message);
        }
      }
    }
  } catch (error) {
    console.error('Flowbar background.js error updating tabs border:', error);
  }
}

/**
 * Gets the current timer state from chrome.storage.sync
 * @returns {Promise<Object>} The timer state object containing timerState, endTime, and timeLeft
 */
async function getTimerState() {
  try {
    const result = await chrome.storage.sync.get(['timerState', 'originalTimerType', 'endTime', 'timeLeft', 'focusDuration', 'breakDuration']);
    
    // Set default durations if not found
    const focusDuration = result.focusDuration || 25 * 60; // 25 minutes in seconds
    const breakDuration = result.breakDuration || 5 * 60;  // 5 minutes in seconds
    
    // Calculate timeLeft if endTime exists
    let timeLeft = result.timeLeft || focusDuration;
    if (result.endTime && (result.timerState === 'focus' || result.timerState === 'break')) {
      const now = Date.now();
      const remainingMs = result.endTime - now;
      const remainingSecs = Math.max(0, Math.floor(remainingMs / 1000));
      timeLeft = remainingSecs;
    }
    
    // Return the timer state with defaults if not set
    return {
      timerState: result.timerState || 'stopped', // Possible states: 'stopped', 'focus', 'break', 'paused'
      originalTimerType: result.originalTimerType || null, // Original timer type when paused
      endTime: result.endTime || null,
      timeLeft: timeLeft,
      focusDuration: focusDuration,
      breakDuration: breakDuration
    };
  } catch (error) {
    console.error('Flowbar background.js error:', error);
    // Return default state in case of error
    return {
      timerState: 'stopped',
      originalTimerType: null,
      endTime: null,
      timeLeft: 25 * 60, // Default to 25 minutes
      focusDuration: 25 * 60,
      breakDuration: 5 * 60
    };
  }
}

/**
 * Sets the timer state in chrome.storage.sync
 * @param {Object} state - The state object containing timerState, originalTimerType, endTime, and timeLeft
 * @param {string} state.timerState - The current state of the timer (e.g., 'stopped', 'focus', 'break', 'paused')
 * @param {string|null} state.originalTimerType - The original timer type when paused ('focus' or 'break')
 * @param {number|null} state.endTime - The Unix timestamp for when the timer ends, or null
 * @param {number} state.timeLeft - Time remaining in seconds
 * @returns {Promise<void>}
 */
async function setTimerState(state) {
  try {
    await chrome.storage.sync.set({
      timerState: state.timerState,
      originalTimerType: state.originalTimerType,
      endTime: state.endTime,
      timeLeft: state.timeLeft
    });
  } catch (error) {
    console.error('Flowbar background.js error:', error);
  }
}

/**
 * Starts a timer with the specified duration and state
 * @param {number} durationInMinutes - Duration in minutes
 * @param {'focus'|'break'} state - The state to start ('focus' or 'break')
 * @returns {Promise<void>}
 */
async function startTimer(durationInMinutes, state) {
  try {
    // Calculate the end time (current time + duration in milliseconds)
    const now = Date.now();
    const endTime = now + (durationInMinutes * 60 * 1000); // Convert minutes to milliseconds
    const timeLeft = durationInMinutes * 60; // Duration in seconds

    // Set the timer state
    await setTimerState({ 
      timerState: state, 
      endTime: endTime,
      timeLeft: timeLeft
    });

    // Create an alarm that will fire at the end time
    await chrome.alarms.create(`timer_${state}`, {
      when: endTime
    });
    
    // Update the border color for all active tabs based on the timer state
    if (state === 'focus') {
      await updateAllTabsBorder('rgba(46, 204, 113, 0.3)'); // Green for focus state
    } else if (state === 'break') {
      await updateAllTabsBorder('rgba(52, 152, 219, 0.3)'); // Blue for break state
    }
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

    // Get the configured durations to reset to initial values
    const result = await chrome.storage.sync.get(['focusDuration', 'breakDuration']);
    const focusDuration = result.focusDuration || 25 * 60; // 25 minutes in seconds
    
    // Reset the timer state to stopped with initial time
    await setTimerState({ 
      timerState: 'stopped', 
      originalTimerType: null,
      endTime: null,
      timeLeft: focusDuration // Reset to initial focus duration
    });
    
    // Update the border to transparent/hidden for all active tabs
    await updateAllTabsBorder('transparent');
  } catch (error) {
    console.error('Flowbar background.js error:', error);
  }
}

// Update timer display periodically
let timerInterval = null;

/**
 * Starts the periodic update of timeLeft in storage
 */
function startTimerUpdates() {
  // Clear any existing interval
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  // Update every second
  timerInterval = setInterval(async () => {
    try {
      const state = await getTimerState();
      
      if (state.timerState === 'focus' || state.timerState === 'break') {
        if (state.endTime) {
          const now = Date.now();
          const remainingMs = Math.max(0, state.endTime - now);
          const remainingSecs = Math.floor(remainingMs / 1000);
          
          // Update timeLeft in storage
          await setTimerState({
            timerState: state.timerState,
            endTime: state.endTime,
            timeLeft: remainingSecs
          });
          
          // If timer has reached 0, the alarm should handle the transition
          if (remainingSecs <= 0) {
            // Wait a moment for the alarm to process, then potentially clear the interval
            setTimeout(async () => {
              const newState = await getTimerState();
              if (newState.timerState === 'stopped') {
                clearInterval(timerInterval);
                timerInterval = null;
              }
            }, 100);
          }
        }
      } else {
        // If not in focus or break state, stop the interval
        clearInterval(timerInterval);
        timerInterval = null;
      }
    } catch (error) {
      console.error('Flowbar background.js error updating timer:', error);
    }
  }, 1000);
}

// Message listener to handle requests from popup
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  try {
    if (request.action === 'startTimer') {
      // Get current timer state
      const currentState = await getTimerState();
      
      if (currentState.timerState === 'stopped') {
        // Start a new focus timer using configured duration
        const durationInMinutes = currentState.focusDuration / 60; // Convert seconds to minutes
        await startTimer(durationInMinutes, 'focus');
        
        // Start updating the timer display
        startTimerUpdates();
        
        // Update the border to focus color for all active tabs when starting a focus session
        await updateAllTabsBorder('rgba(46, 204, 113, 0.3)'); // Green for focus state
      } else if (currentState.timerState === 'paused') {
        // If paused, resume the paused timer (this is now handled by resumeTimer action)
        return Promise.resolve({ success: false, error: "Use resumeTimer action to resume a paused timer" });
      } else {
        // If running, pause the current timer - calculate and preserve the current timeLeft
        // Calculate the actual remaining time at the moment of pause
        let currentRemainingTime = currentState.timeLeft;
        if (currentState.endTime) {
          const now = Date.now();
          const remainingMs = Math.max(0, currentState.endTime - now);
          currentRemainingTime = Math.floor(remainingMs / 1000);
        }
        
        // Complete any ongoing session for the current domain
        if (currentState.timerState === 'focus') {
          const now = Date.now(); // Define 'now' variable
          const timeData = await getTimeData();
          const ongoingSessionIndex = timeData.sessionHistory.findIndex(session => 
            session.domain === currentDomain && 
            session.type === 'focus' && 
            !session.endTime // Incomplete session
          );
          
          if (ongoingSessionIndex !== -1) {
            // Complete the ongoing session
            timeData.sessionHistory[ongoingSessionIndex].endTime = now;
            await setTimeData(timeData);
          }
        }
        
        await setTimerState({ 
          timerState: 'paused', 
          originalTimerType: currentState.timerState, // Preserve the original timer type (focus/break)
          endTime: currentState.endTime, // Keep the original endTime for potential resume
          timeLeft: currentRemainingTime // Preserve the exact remaining time
        });
        await chrome.alarms.clearAll(); // Clear active alarms when paused
        
        // Stop the timer updates
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        
        // Update the border to transparent/hidden for all active tabs when pausing
        await updateAllTabsBorder('transparent');
      }
      
      // Send response back to popup (using async/await pattern)
      return Promise.resolve({ success: true });
    } else if (request.action === 'pauseTimer') {
      // Pause the current timer - calculate and preserve the current timeLeft
      const currentState = await getTimerState();
      
      if (currentState.timerState === 'focus' || currentState.timerState === 'break') {
        // Calculate the actual remaining time at the moment of pause
        let currentRemainingTime = currentState.timeLeft;
        if (currentState.endTime) {
          const now = Date.now();
          const remainingMs = Math.max(0, currentState.endTime - now);
          currentRemainingTime = Math.floor(remainingMs / 1000);
        }
        
        // Complete any ongoing session for the current domain
        if (currentState.timerState === 'focus') {
          const now = Date.now(); // Define 'now' variable
          const timeData = await getTimeData();
          const ongoingSessionIndex = timeData.sessionHistory.findIndex(session => 
            session.domain === currentDomain && 
            session.type === 'focus' && 
            !session.endTime // Incomplete session
          );
          
          if (ongoingSessionIndex !== -1) {
            // Complete the ongoing session
            timeData.sessionHistory[ongoingSessionIndex].endTime = now;
            await setTimeData(timeData);
          }
        }
        
        await setTimerState({ 
          timerState: 'paused', // Set state to paused
          originalTimerType: currentState.timerState, // Preserve the original timer type (focus/break)
          endTime: currentState.endTime, // Keep the original endTime for potential resume
          timeLeft: currentRemainingTime // Preserve the exact remaining time
        });
        await chrome.alarms.clearAll(); // Clear active alarms when paused
        
        // Stop the timer updates
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
      }
      
      // Update the Flow Score icon on the current active tab to reflect the paused state (with debounce)
      if (currentActiveTabId && currentDomain) {
        const now = Date.now();
        if (now - lastIconUpdateTime > ICON_UPDATE_DEBOUNCE_MS) { // Only update if enough time has passed
          lastIconUpdateTime = now;
          try {
            const timeData = await getTimeData();
            const flowScore = await calculateFlowScore(currentDomain, timeData);
            
            // Prepare detailed time data for the hover modal
            const domainSessions = timeData.sessionHistory.filter(session => session.domain === currentDomain);
            
            // Get distraction and focus sites from storage
            const settings = await chrome.storage.sync.get(['distractionSites', 'focusSites']);
            const distractionSites = (settings.distractionSites || '').split(',').map(site => site.trim()).filter(site => site);
            const focusSites = (settings.focusSites || '').split(',').map(site => site.trim()).filter(site => site);
            
            // Calculate focus and distraction time separately
            const domainFocusTime = domainSessions
              .filter(session => session.type === 'focus' && !distractionSites.includes(session.domain) && !focusSites.includes(session.domain))
              .reduce((total, session) => total + session.duration, 0);
            
            const domainDistractionTime = domainSessions
              .filter(session => session.type === 'focus' && distractionSites.includes(session.domain))
              .reduce((total, session) => total + session.duration, 0);
            
            const focusHours = Math.floor(domainFocusTime / 3600);
            const focusMinutes = Math.floor((domainFocusTime % 3600) / 60);
            const distractionHours = Math.floor(domainDistractionTime / 3600);
            const distractionMinutes = Math.floor((domainDistractionTime % 3600) / 60);
            
            // Determine if current domain is a distraction site
            const isCurrentDistraction = distractionSites.includes(currentDomain);
            
            const modalContent = `
              <div class="flowbar-modal-header">
                <h3>Flow Score: ${flowScore}/100</h3>
              </div>
              <div class="flowbar-modal-content">
                <p><strong>Domain:</strong> ${currentDomain}</p>
                <p><strong>Focus Time:</strong> ${focusHours}h ${focusMinutes}m</p>
                <p><strong>Distraction Time:</strong> ${distractionHours}h ${distractionMinutes}m</p>
                <p><strong>Sessions:</strong> ${domainSessions.length}</p>
                ${isCurrentDistraction ? '<p class="distraction-warning"><strong>This is a distraction site</strong></p>' : ''}
              </div>
            `;
            
            await chrome.scripting.executeScript({
              target: { tabId: currentActiveTabId },
              func: (score, content) => {
                // Use the title-modifier functions that should be available in the content script
                if (window.flowbarTitleModifier && window.flowbarTitleModifier.prependIconToTitle) {
                  window.flowbarTitleModifier.prependIconToTitle(score);
                }
                
                // Create hover modal if the function is available
                if (window.flowbarTitleModifier && window.flowbarTitleModifier.createHoverModal) {
                  window.flowbarTitleModifier.createHoverModal(content, {
                    backgroundColor: '#2ecc71',
                    textColor: '#ffffff',
                    width: 300,
                    height: 200
                  });
                }
              },
              args: [flowScore, modalContent]
            });
          } catch (scriptError) {
            console.warn('Flowbar background.js: Could not update icon on active tab after pause:', scriptError.message);
          }
        }
      }
      
      // Send response back to popup
      return Promise.resolve({ success: true });
    } else if (request.action === 'resumeTimer') {
      // Resume the paused timer
      const currentState = await getTimerState();
      
      if (currentState.timerState === 'paused') {
        // When resuming, calculate a new endTime based on the preserved timeLeft
        const now = Date.now();
        const newEndTime = now + (currentState.timeLeft * 1000); // Current time + remaining time from pause
        
        // Update the state to the original timer type and restart the alarm with the new end time
        const timerType = currentState.originalTimerType || 'focus'; // Default to focus if not set
        
        await setTimerState({ 
          timerState: timerType,
          originalTimerType: null, // Clear the original timer type since we're now running
          endTime: newEndTime, // New end time based on current time + preserved remaining time
          timeLeft: currentState.timeLeft // Keep the preserved remaining time
        });
        
        // Restart alarm with the new end time
        await chrome.alarms.create(`timer_${timerType}`, {
          when: newEndTime
        });
        
        // Start updating the timer display
        startTimerUpdates();
      }
      
      // Update the Flow Score icon on the current active tab to reflect the resumed state (with debounce)
      if (currentActiveTabId && currentDomain) {
        const now = Date.now();
        if (now - lastIconUpdateTime > ICON_UPDATE_DEBOUNCE_MS) { // Only update if enough time has passed
          lastIconUpdateTime = now;
          try {
            const timeData = await getTimeData();
            const flowScore = await calculateFlowScore(currentDomain, timeData);
            
            // Prepare detailed time data for the hover modal
            const domainSessions = timeData.sessionHistory.filter(session => session.domain === currentDomain);
            
            // Get distraction and focus sites from storage
            const settings = await chrome.storage.sync.get(['distractionSites', 'focusSites']);
            const distractionSites = (settings.distractionSites || '').split(',').map(site => site.trim()).filter(site => site);
            const focusSites = (settings.focusSites || '').split(',').map(site => site.trim()).filter(site => site);
            
            // Calculate focus and distraction time separately
            const domainFocusTime = domainSessions
              .filter(session => session.type === 'focus' && !distractionSites.includes(session.domain) && !focusSites.includes(session.domain))
              .reduce((total, session) => total + session.duration, 0);
            
            const domainDistractionTime = domainSessions
              .filter(session => session.type === 'focus' && distractionSites.includes(session.domain))
              .reduce((total, session) => total + session.duration, 0);
            
            const focusHours = Math.floor(domainFocusTime / 3600);
            const focusMinutes = Math.floor((domainFocusTime % 3600) / 60);
            const distractionHours = Math.floor(domainDistractionTime / 3600);
            const distractionMinutes = Math.floor((domainDistractionTime % 3600) / 60);
            
            // Determine if current domain is a distraction site
            const isCurrentDistraction = distractionSites.includes(currentDomain);
            
            const modalContent = `
              <div class="flowbar-modal-header">
                <h3>Flow Score: ${flowScore}/100</h3>
              </div>
              <div class="flowbar-modal-content">
                <p><strong>Domain:</strong> ${currentDomain}</p>
                <p><strong>Focus Time:</strong> ${focusHours}h ${focusMinutes}m</p>
                <p><strong>Distraction Time:</strong> ${distractionHours}h ${distractionMinutes}m</p>
                <p><strong>Sessions:</strong> ${domainSessions.length}</p>
                ${isCurrentDistraction ? '<p class="distraction-warning"><strong>This is a distraction site</strong></p>' : ''}
              </div>
            `;
            
            await chrome.scripting.executeScript({
              target: { tabId: currentActiveTabId },
              func: (score, content) => {
                // Use the title-modifier functions that should be available in the content script
                if (window.flowbarTitleModifier && window.flowbarTitleModifier.prependIconToTitle) {
                  window.flowbarTitleModifier.prependIconToTitle(score);
                }
                
                // Create hover modal if the function is available
                if (window.flowbarTitleModifier && window.flowbarTitleModifier.createHoverModal) {
                  window.flowbarTitleModifier.createHoverModal(content, {
                    backgroundColor: '#2ecc71',
                    textColor: '#ffffff',
                    width: 300,
                    height: 200
                  });
                }
              },
              args: [flowScore, modalContent]
            });
          } catch (scriptError) {
            console.warn('Flowbar background.js: Could not update icon on active tab after resume:', scriptError.message);
          }
        }
      }
      
      // Send response back to popup
      return Promise.resolve({ success: true });
    } else if (request.action === 'resetTimer') {
      // For resetTimer: fully reset the timer to initial state
      // Clear any existing alarms
      await chrome.alarms.clearAll();
      
      // Stop the timer updates
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      
      // Get the configured durations to reset to initial values
      const result = await chrome.storage.sync.get(['focusDuration']);
      const focusDuration = result.focusDuration || 25 * 60; // 25 minutes in seconds
      
      // Reset the timer state to stopped with initial time
      await setTimerState({ 
        timerState: 'stopped', 
        endTime: null,
        timeLeft: focusDuration // Reset to initial focus duration
      });
      
      // Update the border to transparent/hidden for all active tabs when reset
      await updateAllTabsBorder('transparent');
      
      // Update the Flow Score icon on the current active tab to reflect the reset state (with debounce)
      if (currentActiveTabId && currentDomain) {
        const now = Date.now();
        if (now - lastIconUpdateTime > ICON_UPDATE_DEBOUNCE_MS) { // Only update if enough time has passed
          lastIconUpdateTime = now;
          try {
            const timeData = await getTimeData();
            const flowScore = await calculateFlowScore(currentDomain, timeData);
            
            // Prepare detailed time data for the hover modal
            const domainSessions = timeData.sessionHistory.filter(session => session.domain === currentDomain);
            
            // Get distraction and focus sites from storage
            const settings = await chrome.storage.sync.get(['distractionSites', 'focusSites']);
            const distractionSites = (settings.distractionSites || '').split(',').map(site => site.trim()).filter(site => site);
            const focusSites = (settings.focusSites || '').split(',').map(site => site.trim()).filter(site => site);
            
            // Calculate focus and distraction time separately
            const domainFocusTime = domainSessions
              .filter(session => session.type === 'focus' && !distractionSites.includes(session.domain) && !focusSites.includes(session.domain))
              .reduce((total, session) => total + session.duration, 0);
            
            const domainDistractionTime = domainSessions
              .filter(session => session.type === 'focus' && distractionSites.includes(session.domain))
              .reduce((total, session) => total + session.duration, 0);
            
            const focusHours = Math.floor(domainFocusTime / 3600);
            const focusMinutes = Math.floor((domainFocusTime % 3600) / 60);
            const distractionHours = Math.floor(domainDistractionTime / 3600);
            const distractionMinutes = Math.floor((domainDistractionTime % 3600) / 60);
            
            // Determine if current domain is a distraction site
            const isCurrentDistraction = distractionSites.includes(currentDomain);
            
            const modalContent = `
              <div class="flowbar-modal-header">
                <h3>Flow Score: ${flowScore}/100</h3>
              </div>
              <div class="flowbar-modal-content">
                <p><strong>Domain:</strong> ${currentDomain}</p>
                <p><strong>Focus Time:</strong> ${focusHours}h ${focusMinutes}m</p>
                <p><strong>Distraction Time:</strong> ${distractionHours}h ${distractionMinutes}m</p>
                <p><strong>Sessions:</strong> ${domainSessions.length}</p>
                ${isCurrentDistraction ? '<p class="distraction-warning"><strong>This is a distraction site</strong></p>' : ''}
              </div>
            `;
            
            await chrome.scripting.executeScript({
              target: { tabId: currentActiveTabId },
              func: (score, content) => {
                // Use the title-modifier functions that should be available in the content script
                if (window.flowbarTitleModifier && window.flowbarTitleModifier.prependIconToTitle) {
                  window.flowbarTitleModifier.prependIconToTitle(score);
                }
                
                // Create hover modal if the function is available
                if (window.flowbarTitleModifier && window.flowbarTitleModifier.createHoverModal) {
                  window.flowbarTitleModifier.createHoverModal(content, {
                    backgroundColor: '#2ecc71',
                    textColor: '#ffffff',
                    width: 300,
                    height: 200
                  });
                }
              },
              args: [flowScore, modalContent]
            });
          } catch (scriptError) {
            console.warn('Flowbar background.js: Could not update icon on active tab after reset:', scriptError.message);
          }
        }
      }
      
      // Send response back to popup
      return Promise.resolve({ success: true });
    } else if (request.action === 'stopTimer') {
      // Get current state to check if we need to log a partial session
      const currentState = await getTimerState();
      
      // If currently in focus state, log the partial session before stopping
      if (currentState.timerState === 'focus' && currentState.endTime) {
        const timeData = await getTimeData();
        const ongoingSessionIndex = timeData.sessionHistory.findIndex(session => 
          session.domain === currentDomain && 
          session.type === 'focus' && 
          !session.endTime // Incomplete session
        );
        
        if (ongoingSessionIndex !== -1) {
          // Complete the ongoing session
          timeData.sessionHistory[ongoingSessionIndex].endTime = Date.now();
          await setTimeData(timeData);
        }
      }
      
      // For stopTimer: just stop the current timer
      await stopTimer();
      
      // Stop the timer updates
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      
      // Update the Flow Score icon on the current active tab to reflect the stopped state (with debounce)
      if (currentActiveTabId && currentDomain) {
        const now = Date.now();
        if (now - lastIconUpdateTime > ICON_UPDATE_DEBOUNCE_MS) { // Only update if enough time has passed
          lastIconUpdateTime = now;
          try {
            const timeData = await getTimeData();
            const flowScore = await calculateFlowScore(currentDomain, timeData);
            
            // Prepare detailed time data for the hover modal
            const domainSessions = timeData.sessionHistory.filter(session => session.domain === currentDomain);
            
            // Get distraction and focus sites from storage
            const settings = await chrome.storage.sync.get(['distractionSites', 'focusSites']);
            const distractionSites = (settings.distractionSites || '').split(',').map(site => site.trim()).filter(site => site);
            const focusSites = (settings.focusSites || '').split(',').map(site => site.trim()).filter(site => site);
            
            // Calculate focus and distraction time separately
            const domainFocusTime = domainSessions
              .filter(session => session.type === 'focus' && !distractionSites.includes(session.domain) && !focusSites.includes(session.domain))
              .reduce((total, session) => total + session.duration, 0);
            
            const domainDistractionTime = domainSessions
              .filter(session => session.type === 'focus' && distractionSites.includes(session.domain))
              .reduce((total, session) => total + session.duration, 0);
            
            const focusHours = Math.floor(domainFocusTime / 3600);
            const focusMinutes = Math.floor((domainFocusTime % 3600) / 60);
            const distractionHours = Math.floor(domainDistractionTime / 3600);
            const distractionMinutes = Math.floor((domainDistractionTime % 3600) / 60);
            
            // Determine if current domain is a distraction site
            const isCurrentDistraction = distractionSites.includes(currentDomain);
            
            const modalContent = `
              <div class="flowbar-modal-header">
                <h3>Flow Score: ${flowScore}/100</h3>
              </div>
              <div class="flowbar-modal-content">
                <p><strong>Domain:</strong> ${currentDomain}</p>
                <p><strong>Focus Time:</strong> ${focusHours}h ${focusMinutes}m</p>
                <p><strong>Distraction Time:</strong> ${distractionHours}h ${distractionMinutes}m</p>
                <p><strong>Sessions:</strong> ${domainSessions.length}</p>
                ${isCurrentDistraction ? '<p class="distraction-warning"><strong>This is a distraction site</strong></p>' : ''}
              </div>
            `;
            
            await chrome.scripting.executeScript({
              target: { tabId: currentActiveTabId },
              func: (score, content) => {
                // Use the title-modifier functions that should be available in the content script
                if (window.flowbarTitleModifier && window.flowbarTitleModifier.prependIconToTitle) {
                  window.flowbarTitleModifier.prependIconToTitle(score);
                }
                
                // Create hover modal if the function is available
                if (window.flowbarTitleModifier && window.flowbarTitleModifier.createHoverModal) {
                  window.flowbarTitleModifier.createHoverModal(content, {
                    backgroundColor: '#2ecc71',
                    textColor: '#ffffff',
                    width: 300,
                    height: 200
                  });
                }
              },
              args: [flowScore, modalContent]
            });
          } catch (scriptError) {
            console.warn('Flowbar background.js: Could not update icon on active tab after stop:', scriptError.message);
          }
        }
      }
      
      // Send response back to popup
      return Promise.resolve({ success: true });
    } else if (request.action === 'getTimerInfo') {
      // Return current timer state and time left for sanctuary page
      const state = await getTimerState();
      return Promise.resolve({ 
        timeLeft: state.timeLeft,
        timerState: state.timerState
      });
    } else if (request.action === 'allowDistractionFor60s') {
      // Allow distraction site for 60 seconds
      if (request.site) {
        const expiryTime = Date.now() + (60 * 1000); // 60 seconds from now
        await chrome.storage.local.set({
          [`tempAccess_${request.site}`]: expiryTime
        });
        return Promise.resolve({ success: true });
      }
      return Promise.resolve({ success: false, error: 'No site provided' });
    }
  } catch (error) {
    console.error('Flowbar background.js error handling message:', error);
    return Promise.resolve({ success: false, error: error.message });
  }
});

// Variables for tracking active tab and domain
let currentActiveTabId = null;
let currentDomain = null;
let trackingInterval = null;
let lastIconUpdateTime = 0; // Track the last time we updated the icon
const ICON_UPDATE_DEBOUNCE_MS = 2000; // Only update icon every 2 seconds to avoid quota issues

// Debounce variables to prevent too many storage operations
let iconUpdateTimeout = null;

// Listener for tab activation (when user switches tabs)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  currentActiveTabId = activeInfo.tabId;
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url) {
      const url = new URL(tab.url);
      currentDomain = url.hostname;
      
      // Calculate flow score for the current domain
        let flowScore = 0;
        try {
          const timeData = await getTimeData();
          flowScore = await calculateFlowScore(currentDomain, timeData);
        } catch (error) {
          console.error('Flowbar background.js error calculating flow score:', error);
        }
        
        // Prepare detailed time data for the hover modal
        const timeData = await getTimeData();
        const domainSessions = timeData.sessionHistory.filter(session => session.domain === currentDomain);
        
        // Get distraction and focus sites from storage
        const settings = await chrome.storage.sync.get(['distractionSites', 'focusSites']);
        const distractionSites = (settings.distractionSites || '').split(',').map(site => site.trim()).filter(site => site);
        const focusSites = (settings.focusSites || '').split(',').map(site => site.trim()).filter(site => site);
        
        // Calculate focus and distraction time separately
        const domainFocusTime = domainSessions
          .filter(session => session.type === 'focus' && !distractionSites.includes(session.domain) && !focusSites.includes(session.domain))
          .reduce((total, session) => total + session.duration, 0);
        
        const domainDistractionTime = domainSessions
          .filter(session => session.type === 'focus' && distractionSites.includes(session.domain))
          .reduce((total, session) => total + session.duration, 0);
        
        const focusHours = Math.floor(domainFocusTime / 3600);
        const focusMinutes = Math.floor((domainFocusTime % 3600) / 60);
        const distractionHours = Math.floor(domainDistractionTime / 3600);
        const distractionMinutes = Math.floor((domainDistractionTime % 3600) / 60);
        
        // Determine if current domain is a distraction site
        const isCurrentDistraction = distractionSites.includes(currentDomain);
        
        const modalContent = `
          <div class="flowbar-modal-header">
            <h3>Flow Score: ${flowScore}/100</h3>
          </div>
          <div class="flowbar-modal-content">
            <p><strong>Domain:</strong> ${currentDomain}</p>
            <p><strong>Focus Time:</strong> ${focusHours}h ${focusMinutes}m</p>
            <p><strong>Distraction Time:</strong> ${distractionHours}h ${distractionMinutes}m</p>
            <p><strong>Sessions:</strong> ${domainSessions.length}</p>
            ${isCurrentDistraction ? '<p class="distraction-warning"><strong>This is a distraction site</strong></p>' : ''}
          </div>
        `;
        
        // Execute the title-modifier script to update the title and create modal
        try {
          await chrome.scripting.executeScript({
            target: { tabId: activeInfo.tabId },
            func: (score, content) => {
              // Use the title-modifier functions that should be available in the content script
              if (window.flowbarTitleModifier && window.flowbarTitleModifier.prependIconToTitle) {
                window.flowbarTitleModifier.prependIconToTitle(score);
              }
              
              // Create hover modal if the function is available
              if (window.flowbarTitleModifier && window.flowbarTitleModifier.createHoverModal) {
                window.flowbarTitleModifier.createHoverModal(content, {
                  backgroundColor: '#2ecc71',
                  textColor: '#ffffff',
                  width: 300,
                  height: 200
                });
              }
            },
            args: [flowScore, modalContent]
          });
        } catch (scriptError) {
          console.warn('Flowbar background.js: Could not execute title-modifier in tab:', scriptError.message);
        }
    }
  } catch (error) {
    console.error('Flowbar background.js error getting active tab:', error);
    currentDomain = null;
  }
});

// Listener for tab updates (when URL changes in current tab)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tab.url) {
    // Check for distraction site immediately when URL starts loading
    const isDistractionRedirected = await checkDistractionSite(tabId, tab.url);
    if (isDistractionRedirected) {
      return; // Exit early if redirected to sanctuary
    }
  }
  
  if (changeInfo.status === 'complete' && tab.active && tab.windowId === (await chrome.windows.getCurrent()).id) {
    currentActiveTabId = tabId;
    if (tab.url) {
      try {
        const url = new URL(tab.url);
        currentDomain = url.hostname;
        
        // Calculate flow score for the current domain
        const timeData = await getTimeData();
        const flowScore = await calculateFlowScore(currentDomain, timeData);
        
        // Prepare detailed time data for the hover modal
        const domainSessions = timeData.sessionHistory.filter(session => session.domain === currentDomain);
        
        // Get distraction and focus sites from storage
        const settings = await chrome.storage.sync.get(['distractionSites', 'focusSites']);
        const distractionSites = (settings.distractionSites || '').split(',').map(site => site.trim()).filter(site => site);
        const focusSites = (settings.focusSites || '').split(',').map(site => site.trim()).filter(site => site);
        
        // Calculate focus and distraction time separately
        const domainFocusTime = domainSessions
          .filter(session => session.type === 'focus' && !distractionSites.includes(session.domain) && !focusSites.includes(session.domain))
          .reduce((total, session) => total + session.duration, 0);
        
        const domainDistractionTime = domainSessions
          .filter(session => session.type === 'focus' && distractionSites.includes(session.domain))
          .reduce((total, session) => total + session.duration, 0);
        
        const focusHours = Math.floor(domainFocusTime / 3600);
        const focusMinutes = Math.floor((domainFocusTime % 3600) / 60);
        const distractionHours = Math.floor(domainDistractionTime / 3600);
        const distractionMinutes = Math.floor((domainDistractionTime % 3600) / 60);
        
        // Determine if current domain is a distraction site
        const isCurrentDistraction = distractionSites.includes(currentDomain);
        
        const modalContent = `
          <div class="flowbar-modal-header">
            <h3>Flow Score: ${flowScore}/100</h3>
          </div>
          <div class="flowbar-modal-content">
            <p><strong>Domain:</strong> ${currentDomain}</p>
            <p><strong>Focus Time:</strong> ${focusHours}h ${focusMinutes}m</p>
            <p><strong>Distraction Time:</strong> ${distractionHours}h ${distractionMinutes}m</p>
            <p><strong>Sessions:</strong> ${domainSessions.length}</p>
            ${isCurrentDistraction ? '<p class="distraction-warning"><strong>This is a distraction site</strong></p>' : ''}
          </div>
        `;
        
        // Execute the title-modifier script to update the title and create modal
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: (score, content) => {
              // Use the title-modifier functions that should be available in the content script
              if (window.flowbarTitleModifier && window.flowbarTitleModifier.prependIconToTitle) {
                window.flowbarTitleModifier.prependIconToTitle(score);
              }
              
              // Create hover modal if the function is available
              if (window.flowbarTitleModifier && window.flowbarTitleModifier.createHoverModal) {
                window.flowbarTitleModifier.createHoverModal(content, {
                  backgroundColor: '#2ecc71',
                  textColor: '#ffffff',
                  width: 300,
                  height: 200
                });
              }
            },
            args: [flowScore, modalContent]
          });
        } catch (scriptError) {
          console.warn('Flowbar background.js: Could not execute title-modifier in tab:', scriptError.message);
        }
      } catch (error) {
        console.error('Flowbar background.js error parsing URL:', error);
        currentDomain = null;
      }
    }
  }
});

// Listener for window focus changes
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  try {
    // Get the currently active tab in the focused window
    const tabs = await chrome.tabs.query({ active: true, windowId: windowId });
    if (tabs.length > 0) {
      const activeTab = tabs[0];
      currentActiveTabId = activeTab.id;
      if (activeTab.url) {
        const url = new URL(activeTab.url);
        currentDomain = url.hostname;
        
        // Calculate flow score for the current domain
        const timeData = await getTimeData();
        const flowScore = await calculateFlowScore(currentDomain, timeData);
        
        // Prepare detailed time data for the hover modal
        const domainSessions = timeData.sessionHistory.filter(session => session.domain === currentDomain);
        
        // Get distraction and focus sites from storage
        const settings = await chrome.storage.sync.get(['distractionSites', 'focusSites']);
        const distractionSites = (settings.distractionSites || '').split(',').map(site => site.trim()).filter(site => site);
        const focusSites = (settings.focusSites || '').split(',').map(site => site.trim()).filter(site => site);
        
        // Calculate focus and distraction time separately
        const domainFocusTime = domainSessions
          .filter(session => session.type === 'focus' && !distractionSites.includes(session.domain) && !focusSites.includes(session.domain))
          .reduce((total, session) => total + session.duration, 0);
        
        const domainDistractionTime = domainSessions
          .filter(session => session.type === 'focus' && distractionSites.includes(session.domain))
          .reduce((total, session) => total + session.duration, 0);
        
        const focusHours = Math.floor(domainFocusTime / 3600);
        const focusMinutes = Math.floor((domainFocusTime % 3600) / 60);
        const distractionHours = Math.floor(domainDistractionTime / 3600);
        const distractionMinutes = Math.floor((domainDistractionTime % 3600) / 60);
        
        // Determine if current domain is a distraction site
        const isCurrentDistraction = distractionSites.includes(currentDomain);
        
        const modalContent = `
          <div class="flowbar-modal-header">
            <h3>Flow Score: ${flowScore}/100</h3>
          </div>
          <div class="flowbar-modal-content">
            <p><strong>Domain:</strong> ${currentDomain}</p>
            <p><strong>Focus Time:</strong> ${focusHours}h ${focusMinutes}m</p>
            <p><strong>Distraction Time:</strong> ${distractionHours}h ${distractionMinutes}m</p>
            <p><strong>Sessions:</strong> ${domainSessions.length}</p>
            ${isCurrentDistraction ? '<p class="distraction-warning"><strong>This is a distraction site</strong></p>' : ''}
          </div>
        `;
        
        // Execute the title-modifier script to update the title and create modal
        try {
          await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: (score, content) => {
              // Use the title-modifier functions that should be available in the content script
              if (window.flowbarTitleModifier && window.flowbarTitleModifier.prependIconToTitle) {
                window.flowbarTitleModifier.prependIconToTitle(score);
              }
              
              // Create hover modal if the function is available
              if (window.flowbarTitleModifier && window.flowbarTitleModifier.createHoverModal) {
                window.flowbarTitleModifier.createHoverModal(content, {
                  backgroundColor: '#2ecc71',
                  textColor: '#ffffff',
                  width: 300,
                  height: 200
                });
              }
            },
            args: [flowScore, modalContent]
          });
        } catch (scriptError) {
          console.warn('Flowbar background.js: Could not execute title-modifier in tab:', scriptError.message);
        }
      }
    }
  } catch (error) {
    console.error('Flowbar background.js error in window focus change:', error);
  }
});

// Initialize the current active tab and domain when the background script starts
async function initializeActiveTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0) {
      const activeTab = tabs[0];
      currentActiveTabId = activeTab.id;
      if (activeTab.url) {
        const url = new URL(activeTab.url);
        currentDomain = url.hostname;
      }
    }
  } catch (error) {
    console.error('Flowbar background.js error initializing active tab:', error);
  }
}

// Function to check if the current navigation is to a distraction site during focus
async function checkDistractionSite(tabId, url) {
  try {
    // Get current timer state and distraction sites
    const [timerState, settings] = await Promise.all([
      getTimerState(),
      chrome.storage.sync.get(['distractionSites'])
    ]);
    
    const distractionSites = (settings.distractionSites || '').split(',').map(site => site.trim()).filter(site => site);
    const currentDomain = new URL(url).hostname;
    
    // Check if we're in focus state and the site is in distraction list
    if (timerState.timerState === 'focus' && distractionSites.includes(currentDomain)) {
      // Check if this domain has been granted temporary access (for 60 seconds)
      const tempAccess = await chrome.storage.local.get([`tempAccess_${currentDomain}`]);
      const now = Date.now();
      
      if (!tempAccess[`tempAccess_${currentDomain}`] || now > tempAccess[`tempAccess_${currentDomain}`]) {
        // Redirect to sanctuary page
        const sanctuaryUrl = chrome.runtime.getURL('sanctuary.html?site=' + encodeURIComponent(currentDomain) + '&url=' + encodeURIComponent(url));
        chrome.tabs.update(tabId, { url: sanctuaryUrl });
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Flowbar background.js error checking distraction site:', error);
    return false;
  }
}

// 10-second interval to track time based on active domain and focus state (to reduce storage writes)
function startTracking() {
  if (trackingInterval) {
    clearInterval(trackingInterval);
  }
  
  trackingInterval = setInterval(async () => {
    try {
      // Get the current timer state
      const timerState = await getTimerState();
      const timeData = await getTimeData();
      
      // Get distraction and focus sites from storage
      const settings = await chrome.storage.sync.get(['distractionSites', 'focusSites']);
      const distractionSites = (settings.distractionSites || '').split(',').map(site => site.trim()).filter(site => site);
      const focusSites = (settings.focusSites || '').split(',').map(site => site.trim()).filter(site => site);
      
      // Only track if timer is in focus state and there's an active domain
      if (timerState.timerState === 'focus' && currentDomain) {
        // Check if current domain is in distraction sites
        const isDistractionSite = distractionSites.includes(currentDomain);
        
        // Increment the total focus time (this tracks all focus session time regardless of site)
        timeData.totalFocusTime += 10; // Increased to account for 10-second interval
        
        // Find the current session for this domain to update
        const activeSessionIndex = timeData.sessionHistory.findIndex(session => 
          session.domain === currentDomain && 
          session.type === 'focus' && 
          !session.endTime // Incomplete session
        );
        
        if (activeSessionIndex !== -1) {
          // Update the duration of the active session
          timeData.sessionHistory[activeSessionIndex].duration += 10; // Increased to account for 10-second interval
        } else {
          // Create a new ongoing session if none exists
          const newSession = {
            startTime: Date.now(),
            endTime: null, // Will be set when the session ends
            duration: 10, // Start with 10 seconds for 10-second interval
            type: 'focus',
            domain: currentDomain,
            isDistraction: isDistractionSite // Track if this session was on a distraction site
          };
          timeData.sessionHistory.push(newSession);
        }
        
        // Get today's date in YYYY-MM-DD format for the flow score
        const today = new Date().toISOString().split('T')[0];
        
        // Initialize or increment today's flow score
        if (!timeData.flowScores[today]) {
          timeData.flowScores[today] = 0;
        }
        timeData.flowScores[today] += 10; // Increased to account for 10-second interval
        
        // Save updated time data (only once every 10 seconds instead of every second)
        await setTimeData(timeData);
      } else if (timerState.timerState === 'break' && currentDomain) {
        // Optional: Track break time separately if needed
        // For now, we're only tracking focus time for the Flow Score
      }
      
      // Update the browser action badge with current session time if timer is active
      if (timerState.timerState === 'focus' || timerState.timerState === 'break') {
        const minutes = Math.floor(timerState.timeLeft / 60);
        const seconds = timerState.timeLeft % 60;
        const badgeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        chrome.action.setBadgeText({ text: badgeText });
        
        // Use different colors for focus vs break
        if (timerState.timerState === 'focus') {
          chrome.action.setBadgeBackgroundColor({ color: '#2ecc71' }); // Green for focus
        } else {
          chrome.action.setBadgeBackgroundColor({ color: '#3498db' }); // Blue for break
        }
      } else {
        chrome.action.setBadgeText({ text: '' }); // Clear badge when not focusing
      }
    } catch (error) {
      console.error('Flowbar background.js error in tracking interval:', error);
    }
  }, 10000); // 10 second interval to reduce storage writes
}

// Function to stop tracking
function stopTracking() {
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
}

// Storage change listener to handle timer state changes and update icons accordingly
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === 'sync') {
    // Check if timer state has changed
    if (changes.timerState) {
      // Update the Flow Score icon on the current active tab to reflect the new state (with debounce)
      if (currentActiveTabId && currentDomain) {
        const now = Date.now();
        if (now - lastIconUpdateTime > ICON_UPDATE_DEBOUNCE_MS) { // Only update if enough time has passed
          lastIconUpdateTime = now;
          try {
            const timeData = await getTimeData();
            const flowScore = await calculateFlowScore(currentDomain, timeData);
            
            // Prepare detailed time data for the hover modal
            const domainSessions = timeData.sessionHistory.filter(session => session.domain === currentDomain);
            
            // Get distraction and focus sites from storage
            const settings = await chrome.storage.sync.get(['distractionSites', 'focusSites']);
            const distractionSites = (settings.distractionSites || '').split(',').map(site => site.trim()).filter(site => site);
            const focusSites = (settings.focusSites || '').split(',').map(site => site.trim()).filter(site => site);
            
            // Calculate focus and distraction time separately
            const domainFocusTime = domainSessions
              .filter(session => session.type === 'focus' && !distractionSites.includes(session.domain) && !focusSites.includes(session.domain))
              .reduce((total, session) => total + session.duration, 0);
            
            const domainDistractionTime = domainSessions
              .filter(session => session.type === 'focus' && distractionSites.includes(session.domain))
              .reduce((total, session) => total + session.duration, 0);
            
            const focusHours = Math.floor(domainFocusTime / 3600);
            const focusMinutes = Math.floor((domainFocusTime % 3600) / 60);
            const distractionHours = Math.floor(domainDistractionTime / 3600);
            const distractionMinutes = Math.floor((domainDistractionTime % 3600) / 60);
            
            // Determine if current domain is a distraction site
            const isCurrentDistraction = distractionSites.includes(currentDomain);
            
            const modalContent = `
              <div class="flowbar-modal-header">
                <h3>Flow Score: ${flowScore}/100</h3>
              </div>
              <div class="flowbar-modal-content">
                <p><strong>Domain:</strong> ${currentDomain}</p>
                <p><strong>Focus Time:</strong> ${focusHours}h ${focusMinutes}m</p>
                <p><strong>Distraction Time:</strong> ${distractionHours}h ${distractionMinutes}m</p>
                <p><strong>Sessions:</strong> ${domainSessions.length}</p>
                ${isCurrentDistraction ? '<p class="distraction-warning"><strong>This is a distraction site</strong></p>' : ''}
              </div>
            `;
            
            await chrome.scripting.executeScript({
              target: { tabId: currentActiveTabId },
              func: (score, content) => {
                // Use the title-modifier functions that should be available in the content script
                if (window.flowbarTitleModifier && window.flowbarTitleModifier.prependIconToTitle) {
                  window.flowbarTitleModifier.prependIconToTitle(score);
                }
                
                // Create hover modal if the function is available
                if (window.flowbarTitleModifier && window.flowbarTitleModifier.createHoverModal) {
                  window.flowbarTitleModifier.createHoverModal(content, {
                    backgroundColor: '#2ecc71',
                    textColor: '#ffffff',
                    width: 300,
                    height: 200
                  });
                }
              },
              args: [flowScore, modalContent]
            });
          } catch (scriptError) {
            console.warn('Flowbar background.js: Could not update icon on active tab after state change:', scriptError.message);
          }
        }
      }
    }
  }
});

// When extension starts, check if there's an active timer and resume updates if needed
chrome.runtime.onStartup.addListener(async () => {
  const state = await getTimerState();
  if (state.timerState === 'focus' || state.timerState === 'break') {
    startTimerUpdates();
  }
  
  // Initialize the active tab and start tracking
  await initializeActiveTab();
  startTracking();
});

// When extension is installed, set default durations
chrome.runtime.onInstalled.addListener(async () => {
  // Set default durations
  chrome.storage.sync.get(['focusDuration', 'breakDuration']).then((result) => {
    if (!result.focusDuration) {
      chrome.storage.sync.set({ focusDuration: 25 * 60 }); // 25 minutes in seconds
    }
    if (!result.breakDuration) {
      chrome.storage.sync.set({ breakDuration: 5 * 60 }); // 5 minutes in seconds
    }
  });
  
  // Initialize the active tab and start tracking
  await initializeActiveTab();
  startTracking();
});

// Alarm listener to handle timer transitions
chrome.alarms.onAlarm.addListener(async (alarm) => {
  try {
    // Get the current timer state
    const currentState = await getTimerState();

    // Determine the next state based on the current state
    let nextState;
    let nextDurationSeconds;

    if (currentState.timerState === 'focus') {
      // After focus, transition to break using configured duration
      nextState = 'break';
      nextDurationSeconds = currentState.breakDuration; // Duration in seconds
      
      // Complete any ongoing session for the current domain
      const timeData = await getTimeData();
      const ongoingSessionIndex = timeData.sessionHistory.findIndex(session => 
        session.domain === currentDomain && 
        session.type === 'focus' && 
        !session.endTime // Incomplete session
      );
      
      if (ongoingSessionIndex !== -1) {
        // Complete the ongoing session
        timeData.sessionHistory[ongoingSessionIndex].endTime = Date.now();
        await setTimeData(timeData);
      }
    } else if (currentState.timerState === 'break') {
      // After break, transition back to focus using configured duration
      nextState = 'focus';
      nextDurationSeconds = currentState.focusDuration; // Duration in seconds
    } else {
      // If in any other state, just stop
      await setTimerState({ 
        timerState: 'stopped', 
        originalTimerType: null,
        endTime: null,
        timeLeft: currentState.timeLeft // Preserve timeLeft
      });
      // Complete any ongoing session for the current domain
      const timeData = await getTimeData();
      const ongoingSessionIndex = timeData.sessionHistory.findIndex(session => 
        session.domain === currentDomain && 
        session.type === 'focus' && 
        !session.endTime // Incomplete session
      );
      
      if (ongoingSessionIndex !== -1) {
        // Complete the ongoing session
        timeData.sessionHistory[ongoingSessionIndex].endTime = Date.now();
        await setTimeData(timeData);
      }
      
      // Update the border to transparent/hidden for all active tabs
      await updateAllTabsBorder('transparent');
      return;
    }

    // Start the next timer phase (convert seconds to minutes for startTimer function)
    await startTimer(nextDurationSeconds / 60, nextState);
    
    // Restart timer updates as the new timer has started
    startTimerUpdates();
  } catch (error) {
    console.error('Flowbar background.js error in alarm listener:', error);
  }
});