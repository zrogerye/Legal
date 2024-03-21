let isRunning = false;
let timer;
let timeLeft = 25 * 60; // Default to 25 minutes, but this will be overridden by user input.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.command) {
    case "start":
      if (!isRunning) {
        startTimer();
      }
      break;
    case "stop":
      stopTimer();
      break;
    case "reset":
      stopTimer(); // Ensure timer is stopped before resetting.
      timeLeft = 25 * 60; // Optionally reset to a default value.
      break;
    case "setTime":
      if (!isRunning) { // Only allow time set if the timer isn't running.
        timeLeft = parseInt(request.time);
      }
      break;
    case "getStatus":
      sendResponse({isRunning, timeLeft});
      return; // async response, return immediately
  }
  sendResponse({isRunning, timeLeft});
});

function startTimer() {
  isRunning = true;
  timer = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(timer);
      isRunning = false;
      timeLeft = 0; // Reset to 0 to avoid negative values.
      // Optionally, send a notification to the user that the timer has finished.
      chrome.notifications.create({
        type: "basic",
        iconUrl: "images/timer48.png",
        title: "Time's up!",
        message: "Your timer has finished.",
        priority: 2,
      });
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
  isRunning = false;
}

