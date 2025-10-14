// Flowbar Content Script - Ambient Border Visualization

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
  
  // Only add borders if timer is active (focus or break)
  if (timerState === 'focus' || timerState === 'break') {
    const borderClass = timerState === 'focus' ? 'flowbar-focus' : 'flowbar-break';
    
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

// Listen for state changes from the background script
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.timerState) {
    const newTimerState = changes.timerState.newValue;
    updateAmbientBorder(newTimerState);
  }
});

// Initialize the border based on the current state when the script loads
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const result = await chrome.storage.sync.get(['timerState']);
    const timerState = result.timerState || 'stopped';
    updateAmbientBorder(timerState);
  } catch (error) {
    console.error("Flowbar content.js error initializing border:", error);
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
    } catch (error) {
      console.error("Flowbar content.js error initializing border:", error);
    }
  })();
}