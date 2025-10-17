// Flowbar Sanctuary Page Script - Enhanced for 2025 design trends

// Wait for the DOM to be fully loaded before executing
document.addEventListener('DOMContentLoaded', async function() {
  // Initialize theme first
  await initializeTheme();
  
  console.log('Sanctuary page loaded, DOM ready');
  console.log('Chrome runtime available:', typeof chrome !== 'undefined' && chrome.runtime);
  console.log('Chrome runtime sendMessage available:', typeof chrome !== 'undefined' && chrome.runtime.sendMessage);
  
  // Get current site and original URL from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const currentSite = urlParams.get('site');
  const originalUrlParam = urlParams.get('url'); // Get the full original URL
  console.log('URL params:', window.location.search);
  console.log('currentSite:', currentSite);
  console.log('originalUrlParam:', originalUrlParam);
  
  const originalUrl = originalUrlParam; // For consistency with the rest of the code
  
  // Initialize theme from storage or system preference
  async function initializeTheme() {
    try {
      const result = await chrome.storage.sync.get(['theme']);
      const savedTheme = result.theme;
      
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
      } else {
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.setAttribute('data-theme', 'dark');
          await chrome.storage.sync.set({ theme: 'dark' });
        } else {
          document.documentElement.setAttribute('data-theme', 'light');
          await chrome.storage.sync.set({ theme: 'light' });
        }
      }
      
      // Add theme toggle event listener
      document.getElementById('themeToggle')?.addEventListener('click', async () => {
        try {
          // Toggle theme
          const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
          const newTheme = currentTheme === 'light' ? 'dark' : 'light';
          
          // Update DOM
          document.documentElement.setAttribute('data-theme', newTheme);
          
          // Save to storage
          await chrome.storage.sync.set({ theme: newTheme });
        } catch (error) {
          console.error("Flowbar sanctuary.js error handling theme toggle:", error);
        }
      });
    } catch (error) {
      console.error("Flowbar sanctuary.js error initializing theme:", error);
    }
  }
  
  // Listen for theme changes from other parts of the extension
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.theme) {
      document.documentElement.setAttribute('data-theme', changes.theme.newValue);
    }
  });

  // DOM elements
  const timerDisplay = document.getElementById('timerDisplay');
  const timerProgress = document.getElementById('timerProgress');
  const currentSiteElement = document.getElementById('currentSite');
  const returnToWorkBtn = document.getElementById('returnToWork');
  const proceedFor60sBtn = document.getElementById('proceedFor60s');
  const redirectOverlay = document.getElementById('redirectOverlay');
  const redirectMessage = document.getElementById('redirectMessage');
  const mainContent = document.getElementById('mainContent');
  const breathingAnimation = document.querySelector('.breathing-animation');
  
  // Constants for timer progress ring
  const TIMER_CIRCLE_RADIUS = 70;
  const TIMER_CIRCLE_CIRCUMFERENCE = 2 * Math.PI * TIMER_CIRCLE_RADIUS;
  const DEFAULT_FOCUS_SESSION_DURATION = 25 * 60; // 25 minutes in seconds
  let maxTimeValue = DEFAULT_FOCUS_SESSION_DURATION;
  
  // Initialize site display
  if (currentSite) {
    currentSiteElement.textContent = currentSite;
    console.log('Current site set to:', currentSite);
  } else {
    console.log('No site parameter found in URL');
    currentSiteElement.textContent = 'Unknown site';
  }

  // Add ripple effect to buttons
  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      const x = e.clientX - e.target.getBoundingClientRect().left;
      const y = e.clientY - e.target.getBoundingClientRect().top;
      
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      this.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });

  // Update timer display and progress ring
  async function updateTimer() {
    try {
      console.log('Attempting to get timer info...');
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        // Request timer information from background script
        const response = await chrome.runtime.sendMessage({action: 'getTimerInfo'});
        console.log('Received timer response:', response);
        if (response && response.timeLeft !== undefined) {
          const minutes = Math.floor(response.timeLeft / 60);
          const seconds = response.timeLeft % 60;
          timerDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          console.log('Timer updated:', `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
          
          // Update progress ring
          if (response.totalDuration) {
            maxTimeValue = response.totalDuration;
          }
          
          updateProgressRing(response.timeLeft);
        } else {
          console.log('No response or timeLeft undefined:', response);
        }
      } else {
        console.error('Chrome runtime API not available');
        timerDisplay.textContent = 'API error';
      }
    } catch (error) {
      console.error('Flowbar sanctuary.js error getting timer info:', error);
      timerDisplay.textContent = 'Error';
    }
  }

  // Update the progress ring based on time left
  function updateProgressRing(timeLeft) {
    if (!timerProgress) return;
    
    const progressPercentage = timeLeft / maxTimeValue;
    const dashoffset = TIMER_CIRCLE_CIRCUMFERENCE * (1 - progressPercentage);
    
    timerProgress.style.strokeDasharray = TIMER_CIRCLE_CIRCUMFERENCE;
    timerProgress.style.strokeDashoffset = dashoffset;
  }

  // Update timer every second
  updateTimer(); // Run immediately
  setInterval(updateTimer, 1000);

  // Event listeners for buttons
  returnToWorkBtn.addEventListener('click', () => {
    console.log('Return to Work button clicked');
    animateButtonClick(returnToWorkBtn);
    window.close(); // Close the sanctuary tab
  });

  proceedFor60sBtn.addEventListener('click', async () => {
    console.log('Proceed for 60s button clicked');
    console.log('originalUrl:', originalUrl, 'currentSite:', currentSite);
    
    animateButtonClick(proceedFor60sBtn);
    
    // Show the redirect overlay
    if (originalUrl && originalUrl !== 'undefined') {
      // Extract just the domain for display purposes
      try {
        const urlObj = new URL(originalUrl);
        redirectMessage.innerHTML = `Redirecting to <strong>${urlObj.hostname}</strong>...`;
      } catch (e) {
        redirectMessage.innerHTML = `Redirecting to <strong>${currentSite}</strong>...`;
      }
    } else {
      redirectMessage.innerHTML = `Redirecting to <strong>${currentSite}</strong>...`;
    }
    
    // Hide main content and show redirect overlay with animation
    mainContent.style.opacity = '0';
    mainContent.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
      mainContent.style.display = 'none';
      redirectOverlay.classList.add('show');
      
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        try {
          // First, tell the background script to allow access to this site for 60 seconds
          chrome.runtime.sendMessage({
            action: 'allowDistractionFor60s',
            site: currentSite
          }).then(() => {
            // Then, redirect back to the original site that triggered the sanctuary
            // Use the original URL if available and not undefined/null, otherwise construct from the site parameter
            let redirectUrl;
            if (originalUrl && originalUrl !== 'undefined') {
              redirectUrl = originalUrl;
            } else {
              redirectUrl = `https://${currentSite}`;
            }
            console.log('Redirecting to:', redirectUrl);
            setTimeout(() => {
              window.location.href = redirectUrl;
            }, 1500); // Add a small delay for the animation to complete
          }).catch(handleRedirectError);
        } catch (error) {
          handleRedirectError(error);
        }
      } else {
        console.error('Chrome runtime API not available for proceed action');
        handleRedirectError();
      }
    }, 300);
  });
  
  // Handle redirect errors
  function handleRedirectError(error) {
    if (error) {
      console.error('Flowbar sanctuary.js error allowing distraction:', error);
    }
    
    // If there's an error, still try to redirect to the original site
    let redirectUrl;
    if (originalUrl && originalUrl !== 'undefined') {
      redirectUrl = originalUrl;
    } else {
      redirectUrl = `https://${currentSite}`;
    }
    console.log('Redirecting to:', redirectUrl);
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 1500); // Add a small delay for the animation to complete
  }
  
  // Button click animation
  function animateButtonClick(button) {
    button.classList.add('clicked');
    setTimeout(() => {
      button.classList.remove('clicked');
    }, 300);
  }
  
  // Interactive breathing exercise
  breathingAnimation.addEventListener('click', () => {
    breathingAnimation.classList.toggle('active');
    const breathingText = breathingAnimation.querySelector('.breathing-text');
    
    if (breathingAnimation.classList.contains('active')) {
      breathingText.textContent = 'Breathe out...';
    } else {
      breathingText.textContent = 'Breathe in...';
    }
  });
  
  // Initialize breathing text
  const breathingText = breathingAnimation.querySelector('.breathing-text');
  setInterval(() => {
    if (breathingText.textContent === 'Breathe with me' || 
        breathingText.textContent === 'Breathe in...') {
      breathingText.textContent = 'Breathe out...';
    } else {
      breathingText.textContent = 'Breathe in...';
    }
  }, 4000); // Match the breathing animation cycle
});