// Flowbar Sanctuary Page Script - External JS to avoid CSP issues

// Wait for the DOM to be fully loaded before executing
document.addEventListener('DOMContentLoaded', function() {
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
  
  if (currentSite) {
    document.getElementById('currentSite').textContent = currentSite;
    console.log('Current site set to:', currentSite);
  } else {
    console.log('No site parameter found in URL');
  }

  // Update timer display
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
          document.getElementById('timerDisplay').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          console.log('Timer updated:', `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        } else {
          console.log('No response or timeLeft undefined:', response);
        }
      } else {
        console.error('Chrome runtime API not available');
        document.getElementById('timerDisplay').textContent = 'API error';
      }
    } catch (error) {
      console.error('Flowbar sanctuary.js error getting timer info:', error);
      document.getElementById('timerDisplay').textContent = 'Error';
    }
  }

  // Update timer every second
  updateTimer(); // Run immediately
  setInterval(updateTimer, 1000);

  // Event listeners for buttons
  document.getElementById('returnToWork').addEventListener('click', () => {
    console.log('Return to Work button clicked');
    window.close(); // Close the sanctuary tab
  });

    document.getElementById('proceedFor60s').addEventListener('click', async () => {
    console.log('Proceed for 60s button clicked');
    console.log('originalUrl:', originalUrl, 'currentSite:', currentSite);
    
    // Show the redirect overlay
    const redirectMessage = document.getElementById('redirectMessage');
    const redirectOverlay = document.getElementById('redirectOverlay');
    
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
    
    // Hide main content and show redirect overlay
    document.getElementById('mainContent').style.display = 'none';
    redirectOverlay.style.display = 'flex';
    
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      try {
        // First, tell the background script to allow access to this site for 60 seconds
        await chrome.runtime.sendMessage({
          action: 'allowDistractionFor60s',
          site: currentSite
        });
        
        // Then, redirect back to the original site that triggered the sanctuary
        // Use the original URL if available and not undefined/null, otherwise construct from the site parameter
        let redirectUrl;
        if (originalUrl && originalUrl !== 'undefined') {
          redirectUrl = originalUrl;
        } else {
          redirectUrl = `https://${currentSite}`;
        }
        console.log('Redirecting to:', redirectUrl);
        window.location.href = redirectUrl;
      } catch (error) {
        console.error('Flowbar sanctuary.js error allowing distraction:', error);
        // If there's an error, still try to redirect to the original site
        let redirectUrl;
        if (originalUrl && originalUrl !== 'undefined') {
          redirectUrl = originalUrl;
        } else {
          redirectUrl = `https://${currentSite}`;
        }
        console.log('Redirecting to:', redirectUrl);
        window.location.href = redirectUrl;
      }
    } else {
      console.error('Chrome runtime API not available for proceed action');
      // If chrome API is not available, try to redirect to the original site based on URL params
      let redirectUrl;
      if (originalUrl && originalUrl !== 'undefined') {
        redirectUrl = originalUrl;
      } else {
        redirectUrl = `https://${currentSite}`;
      }
      console.log('Redirecting to:', redirectUrl);
      window.location.href = redirectUrl;
    }
  });
});