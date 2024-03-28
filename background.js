let isRunning = false;
let timer;
let defaultTime = 25 * 60; // Default to 25 minutes
let timeLeft = defaultTime; // Initialize timeLeft with the default time.
let blockedSites = [];

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
      if (!isRunning) {
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
    case "blockSite":
      toggleSiteBlocking(request.block);
      break;
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
      chrome.runtime.sendMessage({command: "updateDisplay", timeLeft: 0});
      chrome.notifications.create({
        type: "basic",
        iconUrl: "images/timer48.png",
        title: "Time's up!",
        message: "Your timer has finished.",
        priority: 2
      }, function(notificationId) {
        chrome.tabs.create({url: 'https://www.example.com', active: true});
      });
      updateTimeLeft(); 
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
  isRunning = false;
}

// Function to toggle site blocking
function toggleSiteBlocking(shouldBlock) {
  let rule = {
    id: 1,
    priority: 1,
    action: { type: 'block' },
    condition: { urlFilter: '*://*.instagram.com/*', resourceTypes: ['main_frame'] }
  };

  if (shouldBlock) {
    chrome.declarativeNetRequest.updateDynamicRules({addRules: [rule], removeRuleIds: [1]});
  } else {
    chrome.declarativeNetRequest.updateDynamicRules({removeRuleIds: [1]});
  }
}

chrome.runtime.onStartup.addListener(() => {
  // Load the settings when the browser starts
  loadSettings();
});

function loadSettings() {
  chrome.storage.local.get(['customTime', 'blockedSites'], function(data) {
    if (data.customTime) {
      timeLeft = data.customTime;
    }
    if (data.blockedSites) {
      blockedSites = data.blockedSites;
      updateBlockedSites();
    }
  });
}

