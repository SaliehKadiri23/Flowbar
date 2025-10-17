// Flowbar Options Page Logic

document.addEventListener('DOMContentLoaded', async () => {
  await checkFirstInstall();
  await loadSettings();
  setupEventListeners();
});

/** 
 * Checks if this is the first install and shows welcome message if needed
 */
async function checkFirstInstall() {
  try {
    const result = await chrome.storage.local.get(['firstInstall']);
    
    // Get the welcome message element
    const welcomeMessage = document.getElementById('welcomeMessage');
    
    if (result.firstInstall) {
      // Show the welcome message for first-time visitors
      welcomeMessage.style.display = 'block';
      // Update the heading to be more welcoming
      document.querySelector('h1').textContent = 'Welcome to Flowbar';
      
      // Remove the firstInstall flag so it doesn't show again
      await chrome.storage.local.remove(['firstInstall']);
    } else {
      // Hide the welcome message for returning visitors
      welcomeMessage.style.display = 'none';
    }
  } catch (error) {
    console.error("Flowbar options.js error checking first install:", error);
  }
}

/** 
 * Loads the saved settings from storage
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get({
      focusDuration: 25 * 60, // default 25 minutes in seconds
      breakDuration: 5 * 60,   // default 5 minutes in seconds
      distractionSites: '',    // default empty string
      focusSites: ''           // default empty string
    });
    
    // Convert seconds to minutes for display
    document.getElementById('focusDuration').value = Math.floor(result.focusDuration / 60);
    document.getElementById('breakDuration').value = Math.floor(result.breakDuration / 60);
    document.getElementById('distractionSites').value = result.distractionSites;
    document.getElementById('focusSites').value = result.focusSites;
  } catch (error) {
    console.error("Flowbar options.js error loading settings:", error);
  }
}

/**
 * Sets up event listeners for the options page
 */
function setupEventListeners() {
  document.getElementById('saveButton').addEventListener('click', saveSettings);
}

/** 
 * Saves the current settings to storage
 */
async function saveSettings() {
  try {
    const focusMins = parseInt(document.getElementById('focusDuration').value) || 25;
    const breakMins = parseInt(document.getElementById('breakDuration').value) || 5;
    const distractionSites = document.getElementById('distractionSites').value;
    const focusSites = document.getElementById('focusSites').value;
    
    // Convert minutes to seconds for storage
    await chrome.storage.sync.set({
      focusDuration: focusMins * 60,
      breakDuration: breakMins * 60,
      distractionSites: distractionSites,
      focusSites: focusSites
    });
    
    // Show status message
    const status = document.getElementById('status');
    status.textContent = 'Settings saved!';
    status.className = 'status success';
    
    // Clear status after 2 seconds
    setTimeout(() => {
      status.textContent = '';
      status.className = 'status';
    }, 2000);
  } catch (error) {
    console.error("Flowbar options.js error saving settings:", error);
    
    // Show error status
    const status = document.getElementById('status');
    status.textContent = 'Error saving settings!';
    status.className = 'status error';
    
    // Clear status after 2 seconds
    setTimeout(() => {
      status.textContent = '';
      status.className = 'status';
    }, 2000);
  }
}