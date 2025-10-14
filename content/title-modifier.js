// Flowbar Title Modifier Content Script

/**
 * Creates a custom HTML/CSS flow score icon element and prepends it to the page
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
 * Creates a custom HTML/CSS flow score icon
 * @param {number} score - The flow score (0-100)
 * @returns {string} - HTML string for the custom icon
 */
function createFlowScoreIcon(score) {
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
  
  return `
    <span id="flowbar-score-icon" style="
      display: inline-block;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background-color: ${bgColor};
      color: white;
      text-align: center;
      line-height: 16px;
      font-size: 10px;
      font-weight: bold;
      margin-right: 4px;
      vertical-align: middle;
      box-shadow: 0 1px 2px rgba(0,0,0,0.2);
    ">${scoreText}</span>
  `;
}

/**
 * Creates and manages the hover-modal div
 * @param {string} modalContent - The HTML content to display in the modal
 * @param {Object} options - Configuration options for the modal
 * @param {string} options.backgroundColor - Background color of the modal
 * @param {string} options.textColor - Text color of the modal
 * @param {number} options.width - Width of the modal in pixels
 * @param {number} options.height - Height of the modal in pixels
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

// Export functions for use in other parts of the extension
// For content scripts, we'll attach to the window object
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { prependIconToTitle, createHoverModal };
} else {
  // For browser environment, attach to window
  window.flowbarTitleModifier = {
    prependIconToTitle,
    createHoverModal
  };
}