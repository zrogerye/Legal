document.getElementById('back-btn').addEventListener('click', () => {
  window.location.href = "popup.html";
});

document.getElementById('set-timer-btn').addEventListener('click', () => {
  const hours = parseInt(document.getElementById('hours').value) || 0;
  const minutes = parseInt(document.getElementById('minutes').value) || 0;
  const seconds = parseInt(document.getElementById('seconds').value) || 0;
  const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
  chrome.runtime.sendMessage({command: "setTime", time: totalSeconds}, () => {
    window.location.href = "popup.html"; // Optionally, navigate back to popup.html
  });
});
