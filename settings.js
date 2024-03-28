document.getElementById('back-btn').addEventListener('click', () => {
  window.location.href = "popup.html";
});

document.getElementById('set-timer-btn').addEventListener('click', () => {
  const minutes = parseInt(document.getElementById('minutes').value) || 0;
  const seconds = parseInt(document.getElementById('seconds').value) || 0;
  const totalSeconds = (minutes * 60) + seconds;
  chrome.runtime.sendMessage({ command: "setTime", time: totalSeconds }, () => {
    window.location.href = "popup.html";
  });
});

const siteToggles = document.getElementsByClassName('site-block-toggle');

for (let toggle of siteToggles) {
  toggle.addEventListener('change', (event) => {
    const siteToBlock = event.target.getAttribute('data-site');
    const shouldBlock = event.target.checked;
    chrome.runtime.sendMessage({
      command: "blockSite",
      block: shouldBlock,
      site: siteToBlock
    });
  });
}
