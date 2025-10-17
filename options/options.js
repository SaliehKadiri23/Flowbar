// Flowbar Options Page Logic

document.addEventListener('DOMContentLoaded', async () => {
  await checkFirstInstall();
  await loadSettings();
  setupEventListeners();
  setupSliders();
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
  
  // Sync number inputs with sliders
  document.getElementById('focusDurationSlider').addEventListener('input', (e) => {
    document.getElementById('focusDuration').value = e.target.value;
  });
  
  document.getElementById('breakDurationSlider').addEventListener('input', (e) => {
    document.getElementById('breakDuration').value = e.target.value;
  });
  
  document.getElementById('focusDuration').addEventListener('input', (e) => {
    document.getElementById('focusDurationSlider').value = e.target.value;
  });
  
  document.getElementById('breakDuration').addEventListener('input', (e) => {
    document.getElementById('breakDurationSlider').value = e.target.value;
  });
  
  // Custom increment/decrement buttons for focus duration
  document.getElementById('focusDurationIncrease').addEventListener('click', () => {
    const input = document.getElementById('focusDuration');
    const currentValue = parseInt(input.value) || 0;
    const newValue = Math.min(currentValue + 1, parseInt(input.max));
    input.value = newValue;
    document.getElementById('focusDurationSlider').value = newValue;
  });
  
  document.getElementById('focusDurationDecrease').addEventListener('click', () => {
    const input = document.getElementById('focusDuration');
    const currentValue = parseInt(input.value) || 0;
    const newValue = Math.max(currentValue - 1, parseInt(input.min));
    input.value = newValue;
    document.getElementById('focusDurationSlider').value = newValue;
  });
  
  // Custom increment/decrement buttons for break duration
  document.getElementById('breakDurationIncrease').addEventListener('click', () => {
    const input = document.getElementById('breakDuration');
    const currentValue = parseInt(input.value) || 0;
    const newValue = Math.min(currentValue + 1, parseInt(input.max));
    input.value = newValue;
    document.getElementById('breakDurationSlider').value = newValue;
  });
  
  document.getElementById('breakDurationDecrease').addEventListener('click', () => {
    const input = document.getElementById('breakDuration');
    const currentValue = parseInt(input.value) || 0;
    const newValue = Math.max(currentValue - 1, parseInt(input.min));
    input.value = newValue;
    document.getElementById('breakDurationSlider').value = newValue;
  });
}

/**
 * Sets up the sliders with the current values
 */
function setupSliders() {
  // Initialize sliders with current values
  const focusDuration = document.getElementById('focusDuration').value;
  const breakDuration = document.getElementById('breakDuration').value;
  
  document.getElementById('focusDurationSlider').value = focusDuration;
  document.getElementById('breakDurationSlider').value = breakDuration;
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
    
    // Show status message with icon
    const status = document.getElementById('status');
    status.innerHTML = '<span class="icon">✅</span> Settings saved successfully!';
    status.className = 'status success';
    
    // Add a subtle animation effect
    document.getElementById('saveButton').classList.add('saved');
    
    // Clear status after 2.5 seconds
    setTimeout(() => {
      status.textContent = '';
      status.className = 'status';
      document.getElementById('saveButton').classList.remove('saved');
    }, 2500);
  } catch (error) {
    console.error("Flowbar options.js error saving settings:", error);
    
    // Show error status with icon
    const status = document.getElementById('status');
    status.innerHTML = '<span class="icon">❌</span> Error saving settings!';
    status.className = 'status error';
    
    // Clear status after 3.5 seconds
    setTimeout(() => {
      status.textContent = '';
      status.className = 'status';
    }, 3500);
    
    // Original timeout code - commented out to avoid duplicate
    /*setTimeout(() => {
      status.textContent = '';
      status.className = 'status';
    }, 2000);*/
  }
}