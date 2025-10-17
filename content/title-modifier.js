// Flowbar Title Modifier Content Script - 2025 Edition

/**
 * Creates a custom HTML/CSS flow score icon element and prepends it to the page
 * with modern design trends for 2025 including glassmorphism and micro-interactions
 * @param {number} score - The flow score (0-100)
 */
function prependIconToTitle(score) {
  // Remove existing Flowbar icon element if it exists to prevent duplicates
  const existingIcon = document.getElementById("flowbar-score-icon");
  if (existingIcon) {
    existingIcon.remove();
  }

  // Remove any existing title icon from document title to prevent duplicates
  let currentTitle = document.title;
  currentTitle = currentTitle.replace(
    /^\[FLOWBAR_ICON\].*?\[\/FLOWBAR_ICON\]\s*/,
    ""
  );
  document.title = currentTitle;

  // Define modern color palette with gradients for 2025 design trends
  const colorPalette = {
    excellent: {
      gradient: "linear-gradient(135deg, #20E3B2, #2CCCFF)",
      glow: "rgba(32, 227, 178, 0.5)",
      text: "A",
    },
    good: {
      gradient: "linear-gradient(135deg, #6EDCC4, #1AAB8B)",
      glow: "rgba(110, 220, 196, 0.5)",
      text: "B",
    },
    average: {
      gradient: "linear-gradient(135deg, #FFD166, #F0B429)",
      glow: "rgba(255, 209, 102, 0.5)",
      text: "C",
    },
    poor: {
      gradient: "linear-gradient(135deg, #FF6B6B, #EE5253)",
      glow: "rgba(255, 107, 107, 0.5)",
      text: "D",
    },
    none: {
      gradient: "linear-gradient(135deg, #A5A5A5, #7D7D7D)",
      glow: "rgba(165, 165, 165, 0.3)",
      text: "0",
    },
  };

  // Determine the icon styling based on the flow score
  let style = colorPalette.none;

  if (score >= 80) {
    style = colorPalette.excellent;
  } else if (score >= 60) {
    style = colorPalette.good;
  } else if (score >= 40) {
    style = colorPalette.average;
  } else if (score > 0) {
    style = colorPalette.poor;
  }

  // Create the icon element with modern design
  const icon = document.createElement("div");
  icon.id = "flowbar-score-icon";

  // Create inner elements for layered design
  const innerCircle = document.createElement("span");
  innerCircle.className = "flowbar-inner-circle";
  innerCircle.textContent = style.text;

  // Append inner elements
  icon.appendChild(innerCircle);

  // Apply modern glassmorphism and neomorphism styles
  icon.style.cssText = `
    position: fixed;
    top: 12px;
    left: 12px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: ${style.gradient};
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2147483647;
    box-shadow: 0 4px 12px ${style.glow}, inset 0 -2px 5px rgba(0,0,0,0.1), inset 0 2px 5px rgba(255,255,255,0.2);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: pointer;
    font-family: 'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif;
  `;

  // Apply styles to inner circle
  innerCircle.style.cssText = `
    font-size: 12px;
    font-weight: 700;
    letter-spacing: -0.2px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.1);
    transform: translateY(-0.5px);
  `;

  // Add hover and active state animations
  icon.addEventListener("mouseenter", () => {
    icon.style.transform = "scale(1.1)";
    icon.style.boxShadow = `0 6px 16px ${style.glow}, inset 0 -2px 5px rgba(0,0,0,0.1), inset 0 2px 5px rgba(255,255,255,0.2)`;
  });

  icon.addEventListener("mouseleave", () => {
    icon.style.transform = "scale(1)";
    icon.style.boxShadow = `0 4px 12px ${style.glow}, inset 0 -2px 5px rgba(0,0,0,0.1), inset 0 2px 5px rgba(255,255,255,0.2)`;
  });

  icon.addEventListener("mousedown", () => {
    icon.style.transform = "scale(0.95)";
  });

  icon.addEventListener("mouseup", () => {
    icon.style.transform = "scale(1.1)";
  });

  // Add ARIA attributes for accessibility
  icon.setAttribute("role", "button");
  icon.setAttribute("aria-label", `Flow score: ${style.text}`);
  icon.setAttribute("tabindex", "0");

  // Add keyboard accessibility
  icon.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      // Trigger modal display via custom event
      const event = new MouseEvent("mouseenter");
      icon.dispatchEvent(event);
    }
  });

  // Add the icon to the page
  document.body.appendChild(icon);

  // Add entrance animation
  setTimeout(() => {
    icon.style.transform = "scale(1)";
  }, 10);
  icon.style.transform = "scale(0)";
}

/**
 * Creates a custom HTML/CSS flow score icon with modern 2025 design trends
 * @param {number} score - The flow score (0-100)
 * @returns {string} - HTML string for the custom icon with glassmorphism effects
 */
function createFlowScoreIcon(score) {
  // Define modern color palette with gradients for 2025 design trends
  const colorPalette = {
    excellent: {
      gradient: "linear-gradient(135deg, #20E3B2, #2CCCFF)",
      glow: "rgba(32, 227, 178, 0.5)",
      text: "A",
    },
    good: {
      gradient: "linear-gradient(135deg, #6EDCC4, #1AAB8B)",
      glow: "rgba(110, 220, 196, 0.5)",
      text: "B",
    },
    average: {
      gradient: "linear-gradient(135deg, #FFD166, #F0B429)",
      glow: "rgba(255, 209, 102, 0.5)",
      text: "C",
    },
    poor: {
      gradient: "linear-gradient(135deg, #FF6B6B, #EE5253)",
      glow: "rgba(255, 107, 107, 0.5)",
      text: "D",
    },
    none: {
      gradient: "linear-gradient(135deg, #A5A5A5, #7D7D7D)",
      glow: "rgba(165, 165, 165, 0.3)",
      text: "0",
    },
  };

  // Determine the icon styling based on the flow score
  let style = colorPalette.none;

  if (score >= 80) {
    style = colorPalette.excellent;
  } else if (score >= 60) {
    style = colorPalette.good;
  } else if (score >= 40) {
    style = colorPalette.average;
  } else if (score > 0) {
    style = colorPalette.poor;
  }

  // Return modern HTML with glassmorphism and neomorphism effects
  return `
    <div id="flowbar-score-icon" style="
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: ${style.gradient};
      color: white;
      font-size: 11px;
      font-weight: 700;
      margin-right: 6px;
      vertical-align: middle;
      box-shadow: 0 2px 6px ${style.glow}, inset 0 -1px 3px rgba(0,0,0,0.1), inset 0 1px 3px rgba(255,255,255,0.2);
      position: relative;
      overflow: hidden;
      font-family: 'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif;
      letter-spacing: -0.2px;
      text-shadow: 0 1px 1px rgba(0,0,0,0.1);
      backdrop-filter: blur(3px);
      -webkit-backdrop-filter: blur(3px);
      ">
      <span style="transform: translateY(-0.5px);">${style.text}</span>
      <span style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 50%;
        background: linear-gradient(to bottom, rgba(255,255,255,0.15), rgba(255,255,255,0));
        border-radius: 50% 50% 0 0;
      "></span>
    </div>
  `;
}

/**
 * Creates and manages the hover-modal div with modern 2025 design trends
 * @param {string} modalContent - The HTML content to display in the modal
 * @param {Object} options - Configuration options for the modal
 * @param {string} options.accentColor - Primary accent color (will generate appropriate gradients)
 * @param {string} options.textColor - Text color of the modal
 * @param {number} options.width - Width of the modal in pixels
 * @param {number} options.height - Height of the modal in pixels
 * @param {boolean} options.darkMode - Whether to use dark mode styling
 */
function createHoverModal(modalContent, options = {}) {
  // Default options with modern design values
  const defaultOptions = {
    accentColor: "#2CCCFF", // Default accent color
    textColor: "#ffffff",
    width: 320,
    height: 220,
    darkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
  };

  // Merge provided options with defaults
  const modalOptions = { ...defaultOptions, ...options };

  // Generate theme-based styles
  const theme = modalOptions.darkMode
    ? {
        background: "rgba(23, 25, 35, 0.85)",
        border: "rgba(255, 255, 255, 0.08)",
        shadow: "rgba(0, 0, 0, 0.4)",
        highlight: "rgba(255, 255, 255, 0.05)",
        text: "#ffffff",
        textSecondary: "rgba(255, 255, 255, 0.7)",
      }
    : {
        background: "rgba(255, 255, 255, 0.85)",
        border: "rgba(0, 0, 0, 0.06)",
        shadow: "rgba(0, 0, 0, 0.1)",
        highlight: "rgba(255, 255, 255, 0.8)",
        text: "#1A1D2C",
        textSecondary: "rgba(26, 29, 44, 0.7)",
      };

  // Check if modal already exists, if so, remove it first
  const existingModal = document.getElementById("flowbar-hover-modal");
  if (existingModal) {
    existingModal.remove();
  }

  // Create the modal element with modern structure
  const modal = document.createElement("div");
  modal.id = "flowbar-hover-modal";

  // Create inner container for glassmorphism effect
  const innerContainer = document.createElement("div");
  innerContainer.className = "flowbar-modal-inner";
  innerContainer.innerHTML = modalContent;

  // Add accent bar at top
  const accentBar = document.createElement("div");
  accentBar.className = "flowbar-modal-accent";

  // Add close button
  const closeButton = document.createElement("button");
  closeButton.className = "flowbar-modal-close";
  closeButton.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M13 1L1 13M1 1L13 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  closeButton.setAttribute("aria-label", "Close");

  // Append elements
  modal.appendChild(accentBar);
  modal.appendChild(closeButton);
  modal.appendChild(innerContainer);
 // max-height: ${modalOptions.height}px;
  // Apply modern glassmorphism styles to modal
  modal.style.cssText = `
    position: fixed;
    top: 50px;
    left: 16px;
    width: ${modalOptions.width}px;
   
    color: ${theme.text};
    border-radius: 16px;
    z-index: 2147483646;
    overflow: hidden;
    font-family: 'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif;
    display: none;
    opacity: 0;
    transform: translateY(-10px) scale(0.98);
    transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 8px 32px ${theme.shadow}, 0 0 0 1px ${theme.border};
    background: ${theme.background};
  `;
  // zsxmax-height: calc(${modalOptions.height}px - 40px);
  // Style inner container
  // max-height: 50px;
  innerContainer.style.cssText = `
    padding: 20px;
    overflow-y: auto;
    font-size: 14px;
    line-height: 1.6;
    letter-spacing: -0.01em;
    color: ${theme.text};
  `;

  // Style accent bar
  accentBar.style.cssText = `
    height: 4px;
    width: 100%;
    background: linear-gradient(90deg, ${
      modalOptions.accentColor
    }, ${adjustColor(modalOptions.accentColor, 40)});
  `;

  // Style close button
  closeButton.style.cssText = `
    position: absolute;
    top: 12px;
    right: 12px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: ${theme.highlight};
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${theme.textSecondary};
    cursor: pointer;
    opacity: 0.8;
    transition: all 0.2s ease;
    z-index: 1;
    padding: 0;
  `;

  // Add the modal to the document body
  document.body.appendChild(modal);

  // Add event listener to close button
  closeButton.addEventListener("click", () => {
    hideModal();
  });

  // Function to show modal with animation
  function showModal() {
    modal.style.display = "block";
    // Trigger reflow
    modal.offsetHeight;
    modal.style.opacity = "1";
    modal.style.transform = "translateY(0) scale(1)";
  }

  // Function to hide modal with animation
  function hideModal() {
    modal.style.opacity = "0";
    modal.style.transform = "translateY(-10px) scale(0.98)";
    setTimeout(() => {
      modal.style.display = "none";
    }, 300);
  }

  // Make modal visible on hover of the flowbar score icon
  const scoreIcon = document.getElementById("flowbar-score-icon");
  if (scoreIcon) {
    // Position the modal near the icon
    scoreIcon.addEventListener("mouseenter", () => {
      showModal();
    });

    scoreIcon.addEventListener("mouseleave", () => {
      // Add a slight delay to allow moving to the modal
      setTimeout(() => {
        if (!modal.matches(":hover")) {
          hideModal();
        }
      }, 200);
    });

    // Also handle mouse events on the modal itself
    modal.addEventListener("mouseenter", () => {
      showModal();
    });

    modal.addEventListener("mouseleave", () => {
      hideModal();
    });

    // Add keyboard accessibility
    scoreIcon.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        showModal();
      }
    });

    // Close modal on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.style.display === "block") {
        hideModal();
      }
    });
  }

  // Helper function to adjust color brightness
  function adjustColor(color, amount) {
    // Convert hex to RGB
    let r, g, b;
    if (color.startsWith("#")) {
      const hex = color.slice(1);
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else if (color.startsWith("rgb")) {
      const rgbValues = color.match(/\d+/g);
      r = parseInt(rgbValues[0]);
      g = parseInt(rgbValues[1]);
      b = parseInt(rgbValues[2]);
    } else {
      return color; // Return original if format not recognized
    }

    // Adjust brightness
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));

    // Convert back to hex
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  return {
    modal,
    show: showModal,
    hide: hideModal,
    updateContent: (newContent) => {
      innerContainer.innerHTML = newContent;
    },
  };
}

/**
 * Adds a subtle pulse animation to the flow score icon
 * @param {number} score - The flow score to determine animation intensity
 */
function animateFlowScoreIcon(score) {
  const icon = document.getElementById("flowbar-score-icon");
  if (!icon) return;

  // Create keyframes for the pulse animation
  const pulseAnimation = `
    @keyframes flowbar-pulse {
      0% { transform: scale(1); }
      50% { transform: scale(${score >= 60 ? "1.08" : "1.05"}); }
      100% { transform: scale(1); }
    }
  `;

  // Create and append style element
  const styleElement = document.createElement("style");
  styleElement.id = "flowbar-animation-style";
  styleElement.textContent = pulseAnimation;
  document.head.appendChild(styleElement);

  // Apply animation to icon
  icon.style.animation = `flowbar-pulse ${
    score >= 80 ? "2s" : score >= 60 ? "3s" : "4s"
  } ease-in-out infinite`;
}

/**
 * Detects system color scheme and applies appropriate styles
 * @returns {boolean} - Whether dark mode is active
 */
function detectColorScheme() {
  const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

  // Add listener for scheme changes
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      const newDarkMode = e.matches;
      // Update any visible modals
      const modal = document.getElementById("flowbar-hover-modal");
      if (modal) {
        // Recreate modal with new theme
        const content = modal.querySelector(".flowbar-modal-inner").innerHTML;
        createHoverModal(content, { darkMode: newDarkMode });
      }
    });

  return isDarkMode;
}

/**
 * Updates the theme of the hover modal based on extension theme
 * @param {string} theme - The theme to apply ('light' or 'dark')
 */
function updateModalTheme(theme) {
  const modal = document.getElementById("flowbar-hover-modal");
  if (!modal) return;
  
  // Determine theme values
  const isDark = theme === 'dark';
  const themeValues = isDark 
    ? {
        background: "rgba(23, 25, 35, 0.85)",
        border: "rgba(255, 255, 255, 0.08)",
        shadow: "rgba(0, 0, 0, 0.4)",
        highlight: "rgba(255, 255, 255, 0.05)",
        text: "#ffffff",
        textSecondary: "rgba(255, 255, 255, 0.7)",
      }
    : {
        background: "rgba(255, 255, 255, 0.85)",
        border: "rgba(0, 0, 0, 0.06)",
        shadow: "rgba(0, 0, 0, 0.1)",
        highlight: "rgba(255, 255, 255, 0.8)",
        text: "#1A1D2C",
        textSecondary: "rgba(26, 29, 44, 0.7)",
      };
      
  // Update modal styles
  modal.style.background = themeValues.background;
  modal.style.boxShadow = `0 8px 32px ${themeValues.shadow}, 0 0 0 1px ${themeValues.border}`;
  
  // Update inner container text color
  const innerContainer = modal.querySelector(".flowbar-modal-inner");
  if (innerContainer) {
    innerContainer.style.color = themeValues.text;
  }
  
  // Update close button
  const closeButton = modal.querySelector(".flowbar-modal-close");
  if (closeButton) {
    closeButton.style.background = themeValues.highlight;
    closeButton.style.color = themeValues.textSecondary;
  }
}

// Export functions for use in other parts of the extension
// For content scripts, we'll attach to the window object
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    prependIconToTitle,
    createFlowScoreIcon,
    createHoverModal,
    animateFlowScoreIcon,
    detectColorScheme,
    updateModalTheme,
  };
} else {
  // For browser environment, attach to window
  window.flowbarTitleModifier = {
    prependIconToTitle,
    createFlowScoreIcon,
    createHoverModal,
    animateFlowScoreIcon,
    detectColorScheme,
    updateModalTheme,
  };
}
