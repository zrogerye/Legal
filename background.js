//throttle response
var audio = new Audio('https://download.samplelib.com/mp3/sample-9s.mp3');
audio.loop = true;
audio.volume = 0.1;
audio.play();

let isRunning = false;
let defaultTime = 25 * 60; // Default to 25 minutes
let timeLeft = defaultTime; // Initialize timeLeft with the default time.
let blockedSites = [];

chrome.runtime.onStartup.addListener(() => {
  loadSettings();
});

function updateTimeLeft(callback) {
  chrome.storage.local.get(["customTime"], function(result) {
    timeLeft = result.customTime || defaultTime;
    if (callback) callback();
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ customTime: defaultTime, isRunning: false, blockedSites: [] });
});

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
      break;
    case "setTime":
      if (!isRunning) {
        let newTime = parseInt(request.time);
        timeLeft = newTime;
        chrome.storage.local.set({ customTime: newTime });
      }
      break;
    case "getStatus":
      sendResponse({ isRunning, timeLeft });
      return true; // async response
    case "blockSite":
      updateBlockedSites(request.block, request.site);
      break;
  }
  sendResponse({ isRunning, timeLeft });
  return false; // if synchronous
});

function startTimer() {
  isRunning = true;
  let endTime = Date.now() + timeLeft * 1000; // Calculate end time in milliseconds
  chrome.alarms.create('timer', { when: endTime });
  chrome.storage.local.set({ timerEnd: endTime, isRunning: true });
}

function stopTimer() {
  chrome.alarms.clear('timer');
  isRunning = false;
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'timer') {
    isRunning = false;
    timeLeft = defaultTime;
    chrome.storage.local.set({ isRunning: false, customTime: defaultTime });
    
    // Notify user the timer has ended
    chrome.notifications.create({
      type: "basic",
      iconUrl: "images/timer48.png",
      title: "Time's up!",
      message: "Your timer has finished.",
      priority: 2
    }, function(notificationId) {
      // Open and focus a new tab after the notification.
      chrome.tabs.create({url: 'https://zrogerye.github.io/PomodoroTimerExtensionSite/', active: true});
    });
  }
});

function updateBlockingRules() {
  chrome.declarativeNetRequest.getDynamicRules((rules) => {
    const existingIds = rules.map(rule => rule.id);
    const newRules = blockedSites.map((site, index) => {
      return {
        id: existingIds.length + index + 1,
        priority: 1,
        action: { type: 'block' },
        condition: { urlFilter: `*://*.${site}/*`, resourceTypes: ['main_frame'] }
      };
    });

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

function loadSettings() {
  chrome.storage.local.get(['customTime', 'blockedSites', 'isRunning', 'timerEnd'], function(data) {
    if (data.customTime) {
      timeLeft = data.customTime;
    }
    if (data.blockedSites) {
      blockedSites = data.blockedSites;
      updateBlockingRules();
    }
    if (data.isRunning && data.timerEnd) {
      let currentTime = Date.now();
      let remainingTime = data.timerEnd - currentTime;
      if (remainingTime > 0) {
        startTimer();
      } else {
        // Timer has already finished, reset isRunning to false
        isRunning = false;
        chrome.storage.local.set({ isRunning: false });
      }
    }
  });
}
