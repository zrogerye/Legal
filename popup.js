let timerRunning = false;
let pause = false;

document.addEventListener("DOMContentLoaded", function() {
  const timerDisplay = document.getElementById('timer-display');
  const timerBtn = document.getElementById('timer-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const settingsContainer = document.getElementById('settings-container');

  settingsBtn.addEventListener('click', function() {
    // Open the settings page
    settingsContainer.classList.toggle('hidden');
  });

  timerBtn.addEventListener('click', function() {
    if (!timerRunning) {
      // Start the timer logic
      timerRunning = true;
      timerBtn.textContent = "PAUSE";
    } else if (!pause) {
      // Pause the timer logic
      pause = true;
      timerBtn.textContent = "RESUME";
    } else {
      // Resume the timer logic
      pause = false;
      timerBtn.textContent = "PAUSE";
    }
  });
});

function updateTimerDisplay() {
  // Logic to update the timer display goes here
}

function updatePieChart() {
  // Logic to update the pie chart goes here
}

// You need to implement functions to start, pause, resume, and reset the timer
// These will interact with the background script using chrome.runtime.sendMessage
