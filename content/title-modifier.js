// Flowbar Title Modifier Content Script

/**
 * Prepends an icon to the document title
 * @param {string} iconHtml - The HTML string for the icon to prepend
 */
function prependIconToTitle(iconHtml) {
  // Get the current title
  let currentTitle = document.title;
  
  // Check if the icon is already prepended to avoid duplicates
  if (!currentTitle.includes(iconHtml.trim())) {
    // Prepend the icon to the title
    document.title = iconHtml + currentTitle;
  }
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
  modal.style.top = '10px';
  modal.style.right = '10px';
  modal.style.width = `${modalOptions.width}px`;
  modal.style.height = `${modalOptions.height}px`;
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
  
  // Add the modal to the document body
  document.body.appendChild(modal);
  
  // Make modal visible on hover of the title icon
  const titleIcon = document.querySelector('.flowbar-title-icon');
  if (titleIcon) {
    titleIcon.addEventListener('mouseenter', () => {
      modal.style.display = 'block';
    });
    
    titleIcon.addEventListener('mouseleave', () => {
      modal.style.display = 'none';
    });
    
    // Also hide modal when mouse leaves the modal itself
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