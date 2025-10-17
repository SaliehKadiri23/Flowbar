// Flowbar Content Script - Ambient Border Visualization and Flow Score Display

// Function to create, style (with pulsing animation), and inject the flowbar border with a specified color
function createFlowbarBorder(color) {
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
    
    .flowbar-wind-down {
      background: linear-gradient(90deg, rgba(241, 196, 15, 0.3), rgba(243, 156, 18, 0.3)) !important; /* Yellow-like color */
    }
    
    .flowbar-stopped {
      background: transparent !important;
    }
    
    /* Dynamic color class that will be updated with the passed color */
    .flowbar-border-color {
      background: ${color} !important;
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
  removeAmbientBorder();
  
  // Create border elements for each side using the passed color
  const sides = ['top', 'right', 'bottom', 'left'];
  sides.forEach(side => {
    const border = document.createElement('div');
    border.className = `flowbar-border flowbar-border-${side} flowbar-border-color`;
    document.body.appendChild(border);
  });
}

// Check if the content script is already injected to prevent duplicates
if (!document.getElementById('flowbar-styles')) {
  // Create the style element for the border
  const style = document.createElement('style');
  style.id = 'flowbar-styles';
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
      animation: flowbar-pulse 2s infinite ease-in-out !important;
    }
    
    .flowbar-break {
      background: linear-gradient(90deg, rgba(52, 152, 219, 0.3), rgba(41, 128, 185, 0.3)) !important;
    }
    
    .flowbar-stopped {
      background: transparent !important;
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
  
  document.head.appendChild(style);
}

/**
 * Creates or updates the ambient border elements based on the timer state
 */
function updateAmbientBorder(timerState) {
  // Remove existing borders if they exist
  removeAmbientBorder();
  
  // Add borders for active states (focus, break, wind-down)
  if (timerState === 'focus' || timerState === 'break' || timerState === 'wind-down') {
    let borderClass;
    if (timerState === 'focus') {
      borderClass = 'flowbar-focus';
    } else if (timerState === 'break') {
      borderClass = 'flowbar-break';
    } else if (timerState === 'wind-down') {
      borderClass = 'flowbar-wind-down';
    }
    
    // Create border elements for each side
    const sides = ['top', 'right', 'bottom', 'left'];
    sides.forEach(side => {
      const border = document.createElement('div');
      border.className = `flowbar-border flowbar-border-${side} ${borderClass}`;
      document.body.appendChild(border);
    });
  }
}

/**
 * Removes all ambient border elements
 */
function removeAmbientBorder() {
  const existingBorders = document.querySelectorAll('[class*="flowbar-border"]');
  existingBorders.forEach(border => border.remove());
}

/**
 * Creates a flow score icon element and prepends it to the page
 * @param {number} score - The flow score (0-100)
 */
function prependIconToTitle(score) {
  // Remove existing Flowbar icon element if it exists to prevent duplicates
  const existingIcon = document.getElementById('flowbar-score-icon');
  if (existingIcon) {
    existingIcon.remove();
  }
  
  // Remove any existing title icon from document title to prevent duplicates
  let currentTitle = document.title;
  currentTitle = currentTitle.replace(/^\[FLOWBAR_ICON\].*?\[\/FLOWBAR_ICON\]\s*/, '');
  document.title = currentTitle;
  
  // Determine the icon styling based on the flow score
  let bgColor = '#808080'; // Default for no score
  let scoreText = '0';
  
  if (score >= 80) {
    bgColor = '#27ae60'; // Dark green for high score
    scoreText = 'A';
  } else if (score >= 60) {
    bgColor = '#2ecc71'; // Green for good score
    scoreText = 'B';
  } else if (score >= 40) {
    bgColor = '#f39c12'; // Orange for medium score
    scoreText = 'C';
  } else if (score > 0) {
    bgColor = '#e74c3c'; // Red for low score
    scoreText = 'D';
  }
  
  // Create the icon element
  const icon = document.createElement('span');
  icon.id = 'flowbar-score-icon';
  icon.innerHTML = scoreText;
  icon.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: ${bgColor};
    color: white;
    text-align: center;
    line-height: 20px;
    font-size: 10px;
    font-weight: bold;
    z-index: 2147483647;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    font-family: Arial, sans-serif;
  `;
  
  // Add the icon to the page
  document.body.appendChild(icon);
}

/**
 * Creates and manages the hover-modal div
 * @param {string} modalContent - The HTML content to display in the modal
 * @param {Object} options - Configuration options for the modal
 */
function createHoverModal(modalContent, options = {}) {
  // Default options
  const defaultOptions = {
    backgroundColor: '#2ecc71', // Default green color for focus state
    textColor: '#ffffff',
    width: 300,
    height: 200
  };
  
  // Merge provided options with defaults
  const modalOptions = { ...defaultOptions, ...options };
  
  // Check if modal already exists, if so, remove it first
  const existingModal = document.getElementById('flowbar-hover-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Create the modal element
  const modal = document.createElement('div');
  modal.id = 'flowbar-hover-modal';
  modal.innerHTML = modalContent;
  
  // Apply styles to the modal
  modal.style.position = 'fixed';
  modal.style.top = '40px'; // Position below the icon
  modal.style.left = '10px';
  modal.style.width = `${modalOptions.width}px`;
  modal.style.maxHeight = `${modalOptions.height}px`;
  modal.style.backgroundColor = modalOptions.backgroundColor;
  modal.style.color = modalOptions.textColor;
  modal.style.borderRadius = '8px';
  modal.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  modal.style.zIndex = '2147483646'; // Just below the border layer
  modal.style.padding = '15px';
  modal.style.overflow = 'auto';
  modal.style.fontSize = '14px';
  modal.style.lineHeight = '1.4';
  modal.style.display = 'none'; // Initially hidden
  modal.style.fontFamily = 'Arial, sans-serif';
  
  // Add the modal to the document body
  document.body.appendChild(modal);
  
  // Make modal visible on hover of the flowbar score icon
  const scoreIcon = document.getElementById('flowbar-score-icon');
  if (scoreIcon) {
    // Position the modal near the icon
    scoreIcon.addEventListener('mouseenter', () => {
      modal.style.display = 'block';
    });
    
    scoreIcon.addEventListener('mouseleave', () => {
      // Add a slight delay to allow moving to the modal
      setTimeout(() => {
        if (!modal.matches(':hover')) {
          modal.style.display = 'none';
        }
      }, 200);
    });
    
    // Also handle mouse events on the modal itself
    modal.addEventListener('mouseenter', () => {
      modal.style.display = 'block';
    });
    
    modal.addEventListener('mouseleave', () => {
      modal.style.display = 'none';
    });
  }
  
  return modal;
}

/**
 * Checks if a domain matches any of the configured sites, considering both www and non-www versions
 * @param {string} domain - The domain to check (e.g., 'www.google.com' or 'google.com')
 * @param {Array<string>} siteList - List of configured sites to match against
 * @returns {boolean} - True if the domain matches any site in the list
 */
function matchesDomain(domain, siteList) {
  // If the domain is empty, return false
  if (!domain) return false;
  
  // Normalize the domain by removing any trailing dots and converting to lowercase
  const normalizedDomain = domain.toLowerCase().replace(/\.$/, '');
  
  // Check if the normalized domain is in the list
  if (siteList.includes(normalizedDomain)) {
    return true;
  }
  
  // Check for www/non-www variations
  if (normalizedDomain.startsWith('www.')) {
    // Domain starts with www, also check the non-www version
    const nonWwwDomain = normalizedDomain.substring(4); // Remove 'www.'
    if (siteList.includes(nonWwwDomain)) {
      return true;
    }
  } else {
    // Domain does not start with www, also check the www version
    const wwwDomain = 'www.' + normalizedDomain;
    if (siteList.includes(wwwDomain)) {
      return true;
    }
  }
  
  return false;
}

// Function to update the flow score icon and its hover modal based on current state
async function updateFlowScoreIcon() {
  // Get the current timer state to know if we're in focus mode
  const stateResult = await chrome.storage.sync.get(['timerState']);
  const timerState = stateResult.timerState || 'stopped';
  
  // Only show flow score during focus session
  if (timerState === 'focus') {
    // Get the current domain for flow score calculation
    const currentDomain = window.location.hostname;
    
    // Get time data to calculate flow score
    const timeDataResult = await chrome.storage.local.get(['timeData']);
    const timeData = timeDataResult.timeData;
    
    // Get settings for distraction sites
    const settings = await chrome.storage.sync.get(['distractionSites', 'focusSites']);
    const distractionSites = (settings.distractionSites || '').split(',').map(site => site.trim()).filter(site => site);
    const focusSites = (settings.focusSites || '').split(',').map(site => site.trim()).filter(site => site);
    
    // Calculate flow score for this domain based on settings and session history
    let flowScore = 0;
    
    if (timeData && timeData.sessionHistory) {
      const domainSessions = timeData.sessionHistory.filter(session => 
        session.domain === currentDomain
      );
      
      // Calculate focus time and distraction time separately for this domain
      const domainFocusTime = domainSessions
        .filter(session => session.type === 'focus' && !matchesDomain(session.domain, distractionSites))
        .reduce((total, session) => total + session.duration, 0);
      
      const domainDistractionTime = domainSessions
        .filter(session => session.type === 'focus' && matchesDomain(session.domain, distractionSites))
        .reduce((total, session) => total + session.duration, 0);
      
      // Calculate overall score based on balance of focus vs distraction time
      const totalTime = domainFocusTime + domainDistractionTime;
      
      if (totalTime === 0) {
        flowScore = 0; // No time spent on this domain
      } else if (matchesDomain(currentDomain, distractionSites)) {
        // For distraction sites, heavily penalize the score
        const hoursSpent = totalTime / 3600; // Convert to hours
        
        if (hoursSpent > 2) {
          flowScore = 5;   // Very low score for spending more than 2 hours on a distraction site
        } else if (hoursSpent > 1) {
          flowScore = 10;  // Low score for 1-2 hours
        } else if (hoursSpent > 0.5) {
          flowScore = 20;  // 30 min to 1 hour
        } else if (hoursSpent > 0.25) {
          flowScore = 35;  // 15-30 min
        } else {
          flowScore = 50;  // Less than 15 min
        }
      } else if (focusSites.includes(currentDomain)) {
        // For focus sites, reward the score based on time spent
        const hoursSpent = totalTime / 3600; // Convert to hours
        
        if (hoursSpent > 2) {
          flowScore = 95;  // Very high score for spending more than 2 hours on a focus site
        } else if (hoursSpent > 1) {
          flowScore = 85;  // High score for 1-2 hours
        } else if (hoursSpent > 0.5) {
          flowScore = 75;  // 30 min to 1 hour
        } else if (hoursSpent > 0.25) {
          flowScore = 65;  // 15-30 min
        } else {
          flowScore = 60;  // Less than 15 min
        }
      } else {
        // For non-distraction/focus sites, calculate based on ratio but with a penalty for any distraction time
        const focusPercentage = domainFocusTime > 0 ? (domainFocusTime / totalTime) * 100 : 0;
        
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
          flowScore = Math.min(100, baseScore + 20);
        } else if (hoursSpent > 1) {
          flowScore = Math.min(100, baseScore + 10);
        } else if (hoursSpent > 0.5) {
          flowScore = Math.min(100, baseScore + 5);
        } else {
          flowScore = baseScore;
        }
      }
    }
    
    // Create or update the flow score icon
    if (window.flowbarTitleModifier && window.flowbarTitleModifier.prependIconToTitle) {
      window.flowbarTitleModifier.prependIconToTitle(flowScore);
    } else {
      // Fallback if title-modifier is not available - create the icon directly
      prependIconToTitle(flowScore);
    }
    
    // Prepare detailed time data for the hover modal
    if (timeData && timeData.sessionHistory) {
      const domainSessions = timeData.sessionHistory.filter(session => session.domain === currentDomain);
      
      // Calculate focus and distraction time separately
      const domainFocusTime = domainSessions
        .filter(session => session.type === 'focus' && !matchesDomain(session.domain, distractionSites) && !matchesDomain(session.domain, focusSites))
        .reduce((total, session) => total + session.duration, 0);
      
      const domainDistractionTime = domainSessions
        .filter(session => session.type === 'focus' && matchesDomain(session.domain, distractionSites))
        .reduce((total, session) => total + session.duration, 0);
      
      const focusHours = Math.floor(domainFocusTime / 3600);
      const focusMinutes = Math.floor((domainFocusTime % 3600) / 60);
      const distractionHours = Math.floor(domainDistractionTime / 3600);
      const distractionMinutes = Math.floor((domainDistractionTime % 3600) / 60);
      
      // Determine if current domain is a distraction site
      const isCurrentDistraction = matchesDomain(currentDomain, distractionSites);
      
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
      
      // Create hover modal if the function is available
      if (window.flowbarTitleModifier && window.flowbarTitleModifier.createHoverModal) {
        window.flowbarTitleModifier.createHoverModal(modalContent, {
          backgroundColor: '#2ecc71',
          textColor: '#ffffff',
          width: 300,
          height: 200
        });
      } else {
        // Fallback: use our local createHoverModal function
        createHoverModal(modalContent, {
          backgroundColor: '#2ecc71',
          textColor: '#ffffff',
          width: 300,
          height: 200
        });
      }
    }
  }
}



// Listen for state changes from the background script
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && (changes.timerState || changes.distractionSites || changes.focusSites)) {
    // Update ambient border based on new timer state
    if (changes.timerState) {
      const newTimerState = changes.timerState.newValue;
      updateAmbientBorder(newTimerState);
    }

    // Update flow score icon when timer state changes
    if (changes.timerState) {
      updateFlowScoreIcon();
    }
  }
});

// Initialize both border and flow score icon based on the current state when the script loads
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const result = await chrome.storage.sync.get(['timerState']);
    const timerState = result.timerState || 'stopped';
    updateAmbientBorder(timerState);
    
    // Also update the flow score icon
    await updateFlowScoreIcon();
  } catch (error) {
    console.error("Flowbar content.js error initializing border and flow score:", error);
  }
});

// Also check immediately in case DOM is already loaded
if (document.readyState === 'loading') {
  // DOM is still loading, the event listener will handle it
} else {
  // DOM is already loaded, initialize immediately
  (async () => {
    try {
      const result = await chrome.storage.sync.get(['timerState']);
      const timerState = result.timerState || 'stopped';
      updateAmbientBorder(timerState);
      
      // Also update the flow score icon
      await updateFlowScoreIcon();
    } catch (error) {
      console.error("Flowbar content.js error initializing border and flow score:", error);
    }
  })();
}