let isRunning = false;
let timer;
let defaultTime = 25 * 60; // Default to 25 minutes
let timeLeft = defaultTime; // Initialize timeLeft with the default time.
let blockedSites = [];
let pingInterval;

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
        //chrome.alarms.create("myAlarm", { delayInMinutes: 1 });
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
  }
  sendResponse({ isRunning, timeLeft });
  return false; // if synchronous
});

function startTimer() {
  chrome.alarms.create("myAlarm", { delayInMinutes: 0.1, periodInMinutes: 0.1 });
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
        // Open and focus a new tabs after the notification.
        chrome.tabs.create({url: 'https://zrogerye.github.io/PomodoroTimerExtensionSite/', active: true});
        //removing tab
        // chrome.tabs.remove({url: 'https://zrogerye.github.io/PomodoroTimerExtensionSite/', active: true});
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

//alive v2
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "myAlarm") {
    console.log("Alarm triggered!");
  }
});

export { updateBlockedSites };