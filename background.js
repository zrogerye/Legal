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
        studyTime = parseInt(request.time);
        breakTime = studyTime * 0.2; // Update the break time
        timeLeft = studyTime; // Set the timer to the new study time
        chrome.storage.local.set({ customTime: studyTime, breakTime: breakTime });
        sendResponse({ timeLeft: timeLeft, mode: mode });
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
  }
  sendResponse({ isRunning, timeLeft });
  return false; // if synchronous
});

function startTimer() {
  isRunning = true;
  timer = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
    } else {
      clearInterval(timer);
      isRunning = false;
      chrome.runtime.sendMessage({ command: "updateDisplay", timeLeft: 0, mode: mode });

      if (mode === "study") {
        mode = "break";
        timeLeft = studyTime * 0.2; // Set break time to 20% of study time
        chrome.tabs.create({ url: 'https://www.example.com', active: true }); // Replace with your desired URL
        startTimer(); // Start the break timer immediately
      } else {
        mode = "study";
        timeLeft = studyTime; // Reset to original study time
        // Optionally, update the display or notify the user that the break is over
        chrome.runtime.sendMessage({ command: "updateMode", mode: mode });
      }
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
