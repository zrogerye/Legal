document.addEventListener('DOMContentLoaded', () => {
  // Load the saved settings
  loadSettings();

  document.getElementById('set-timer-btn').addEventListener('click', () => {
    const minutes = parseInt(document.getElementById('minutes').value) || 0;
    const seconds = parseInt(document.getElementById('seconds').value) || 0;
    const totalSeconds = (minutes * 60) + seconds;
    chrome.storage.local.set({ customTime: totalSeconds });
    chrome.runtime.sendMessage({ command: "setTime", time: totalSeconds }, () => {
      window.location.href = "popup.html";
    });
  });

  const siteToggles = document.getElementsByClassName('site-block-toggle');

  for (let toggle of siteToggles) {
    toggle.addEventListener('change', (event) => {
      const siteToBlock = event.target.getAttribute('data-site');
      const shouldBlock = event.target.checked;
      chrome.storage.local.get({ blockedSites: [] }, function(data) {
        const updatedBlockedSites = shouldBlock
          ? data.blockedSites.concat(siteToBlock)
          : data.blockedSites.filter(site => site !== siteToBlock);
        chrome.storage.local.set({ blockedSites: updatedBlockedSites });
        chrome.runtime.sendMessage({
          command: "blockSite",
          block: shouldBlock,
          site: siteToBlock
        });
      });
    });
  }
});

function loadSettings() {
  // Load timer settings
  chrome.storage.local.get(['customTime'], function(data) {
    if (data.customTime) {
      const minutes = Math.floor(data.customTime / 60);
      const seconds = data.customTime % 60;
      document.getElementById('minutes').value = minutes;
      document.getElementById('seconds').value = seconds;
    }
  });

  // Load site-blocking settings
  chrome.storage.local.get(['blockedSites'], function(data) {
    const blockedSites = data.blockedSites || [];
    const siteToggles = document.getElementsByClassName('site-block-toggle');
    for (let toggle of siteToggles) {
      const site = toggle.getAttribute('data-site');
      toggle.checked = blockedSites.includes(site);
    }
  });
}

document.getElementById('back-btn').addEventListener('click', () => {
  window.location.href = "popup.html"; // Navigate back to the popup
});
