let isRunning = false;
let timer;
let defaultTime = 25 * 60; // Default to 25 minutes
let timeLeft = defaultTime; // Initialize timeLeft with the default time.
let blockedSites = [];
let mode = "study";
let studyTime = defaultTime;
let breakTime = studyTime * 0.2;

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
        chrome.storage.local.set({ customTime: newTime });
      }
      break;
    case "updateDisplay":
      sendResponse({ isRunning, timeLeft: request.timeLeft });
      break;
    case "getStatus":
      sendResponse({ isRunning, timeLeft });
      return true; // async response, return immediately
    case "blockSite":
      updateBlockedSites(request.block, request.site);
      break;
      case "setTime":
        if (!isRunning) {
          let newTime = parseInt(request.time);
          studyTime = newTime; // Update study time
          breakTime = studyTime * 0.2; // Update break time to 20% of study time
          timeLeft = mode === "study" ? studyTime : breakTime; // Update timeLeft based on mode
          chrome.storage.local.set({ customTime: newTime, mode: mode });
        }
        break;
  }
  sendResponse({ isRunning, timeLeft });
  return false; // if synchronous
});

function startTimer() {
  // Adjust the timer setup based on the mode
  isRunning = true;
  timer = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
    }
    if (timeLeft <= 0) {
      clearInterval(timer);
      isRunning = false;
      if (mode === "study") {
        // Open a new tab when the study timer finishes
        chrome.tabs.create({ url: 'https://www.example.com', active: true });
        // Start the break timer immediately
        mode = "break";
        timeLeft = breakTime;
        startTimer();
      } else {
        mode = "study"; // Reset to study mode after the break
        timeLeft = studyTime; // Reset timeLeft to the study duration
      }
      // Send a message to update the popup with the new mode and time
      chrome.runtime.sendMessage({ command: "updateMode", mode: mode, timeLeft: timeLeft });
      updateTimeLeft(); // This will set timeLeft to the custom time or default time
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
  isRunning = false;
}

// Updates the dynamic rules for blocking sites based on the current state of blockedSites
function updateBlockingRules() {
    chrome.declarativeNetRequest.getDynamicRules((rules) => {
        const existingIds = rules.map(rule => rule.id);
        const newRules = blockedSites.map((site, index) => {
            return {
                id: existingIds.length + index + 1, // Start IDs after the existing ones
                priority: 1,
                action: { type: 'block' },
                condition: { urlFilter: `*://*.${site}/*`, resourceTypes: ['main_frame'] }
            };
        });

        // Remove all rules before adding new ones to prevent ID conflicts
        chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: existingIds }, () => {
            chrome.declarativeNetRequest.updateDynamicRules({ addRules: newRules });
        });
    });
}

function updateBlockedSites(block, site) {
  const index = blockedSites.indexOf(site);
  if (block && index === -1) {
    blockedSites.push(site);
  } else if (!block && index !== -1) {
    blockedSites.splice(index, 1);
  }
  updateBlockingRules();
}

chrome.runtime.onStartup.addListener(() => {
  loadSettings();
});

function loadSettings() {
  chrome.storage.local.get(['customTime', 'blockedSites'], function(data) {
    if (data.customTime) {
      timeLeft = data.customTime;
    }
    if (data.blockedSites) {
      blockedSites = data.blockedSites;
      updateBlockingRules();
    }
  });
}
