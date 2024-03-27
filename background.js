let isRunning = false;
let timer;
let defaultTime = 25 * 60; // Default to 25 minutes
let timeLeft = defaultTime; // Initialize timeLeft with the default time.

// Helper function to update timeLeft from storage or default
function updateTimeLeft(callback) {
  chrome.storage.local.get(["customTime"], function(result) {
    timeLeft = result.customTime || defaultTime;
    if (callback) callback();
  });
}

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
      updateTimeLeft(() => {
        stopTimer();
        sendResponse({ isRunning, timeLeft });
      });
      return true; // indicates we will send a response asynchronously
    case "setTime":
      if (!isRunning) { // Only allow time set if the timer isn't running.
        let newTime = parseInt(request.time);
        timeLeft = newTime;
        chrome.storage.local.set({ customTime: newTime }, function() {
          console.log('Custom time saved: ' + newTime);
        });
      }
      break;
    case "updateDisplay":
      sendResponse({ isRunning, timeLeft: request.timeLeft });
      break;
    case "getStatus":
      sendResponse({ isRunning, timeLeft });
      return true; // async response, return immediately
  }
  sendResponse({ isRunning, timeLeft });
  return false; // if synchronous
});

function startTimer() {
  isRunning = true;
  timer = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
    }
    if (timeLeft <= 0) {
      clearInterval(timer);
      isRunning = false;
      // Update the time display to 0 when the timer finishes.
      chrome.runtime.sendMessage({command: "updateDisplay", timeLeft: 0});

      // send a notification to the user that the timer has finished.
      chrome.notifications.create({
        type: "basic",
        iconUrl: "images/timer48.jpg", // Ensure this is the correct path to your icon
        title: "Time's up!",
        message: "Your timer has finished.",
        priority: 2
      }, function(notificationId) {
          // Open and focus a new tab after the notification.
          chrome.tabs.create({url: 'https://www.example.com', active: true});
      });

      // Here we reset timeLeft to the default or custom time
      updateTimeLeft(); 
    }
  }, 1000);
}



function stopTimer() {
  clearInterval(timer);
  isRunning = false;
}
