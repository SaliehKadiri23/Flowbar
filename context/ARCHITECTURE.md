# Flowbar: System Architecture (v0.1)

## 1. Core Philosophy

Flowbar is a "Calm Engine." Every technical decision must serve the goal of creating a gentle, non-intrusive, and reliable user experience. We prioritize simplicity and psychological comfort over feature density.

## 2. Component Breakdown

### a. Background Script (`background/background.js`)

- **Responsibility:** The persistent "brain" of the extension. Manages the core timer state (`stopped`, `focus`, `break`), end times, and all alarms. It is the single source of truth for the timer's status.
- **Key Technologies:** `chrome.storage.sync` for state persistence, `chrome.alarms` for timer events.

### b. Popup (`popup/`)

- **Responsibility:** The user's "cockpit." Provides the primary UI for starting/stopping focus sessions and viewing the current timer status. It is a simple view that reflects the state stored by the background script.
- **Key Technologies:** Standard HTML/CSS/JS. Does not hold its own state.

### c. Content Script (`content/content.js`)

- **Responsibility:** The "visualizer." This script is injected into active web pages to create and manage the ambient border. It is purely presentational and is controlled by the background script.
- **Key Technologies:** DOM manipulation.

### d. Options Page (`options/`)

- **Responsibility:** The "configuration panel." Allows users to set their preferred focus/break durations and define their "distraction sites."
- **Key Technologies:** Standard HTML/CSS/JS, `chrome.storage.sync` for saving settings.

## 3. Data Flow & Communication

- **State Storage:** All persistent state (timer status, settings) is stored in `chrome.storage.sync`.
- **Popup -> Background:** The popup sends messages (e.g., "startTimer", "stopTimer") to the background script using `chrome.runtime.sendMessage`.
- **Background -> Content Script:** The background script injects and executes the content script on active tabs using `chrome.scripting.executeScript` to change the border color.
- **State Synchronization:** The popup and options pages listen for state changes using `chrome.storage.onChanged` to keep their UI in sync with the core state.

## 4. Technology Stack (v0.1)

- **Manifest Version:** 3
- **Languages:** JavaScript (ES6+), HTML5, CSS3
- **Core APIs:** `chrome.storage`, `chrome.alarms`, `chrome.scripting`, `chrome.runtime`
- **Linting/Formatting:** ESLint, Prettier
