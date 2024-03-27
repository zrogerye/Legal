let updateInterval;

document.addEventListener("DOMContentLoaded", () => {
  checkTimerStatus();
  if (updateInterval) clearInterval(updateInterval);
  updateInterval = setInterval(checkTimerStatus, 1000);

  document.getElementById('start-stop-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({command: "getStatus"}, response => {
      if (response.isRunning) {
        chrome.runtime.sendMessage({command: "stop"}, () => checkTimerStatus());
      } else {
        chrome.runtime.sendMessage({command: "start"}, () => checkTimerStatus());
      }
    });
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({command: "reset"}, () => {
      checkTimerStatus();
    });
  });

  document.getElementById('settings-btn').addEventListener('click', () => {
    window.location.href = "settings.html";
  });
});

// Listen for an updateDisplay command to update the timer display
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "updateDisplay") {
    updateDisplay(request.isRunning, request.timeLeft);
  }
});

function checkTimerStatus() {
  chrome.runtime.sendMessage({command: "getStatus"}, response => {
    updateDisplay(response.isRunning, response.timeLeft);
  });
}

function updateDisplay(isRunning, timeLeft) {
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  document.getElementById('timer-display').textContent =
    `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  document.getElementById('start-stop-btn').textContent = isRunning ? 'Stop' : 'Start';
}

window.onunload = function() {
  if (updateInterval) clearInterval(updateInterval);
};
