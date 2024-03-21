let isRunning = false;
let pause = false;
let timer;
let timeLeft = 1259; // Represents 20 minutes and 59 seconds as total seconds.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "start" && !isRunning && !pause) {
    startTimer();
  } else if (request.command === "pause") {
    pauseTimer();
  } else if (request.command === "resume") {
    resumeTimer();
  } else if (request.command === "reset") {
    resetTimer();
  } else if (request.command === "getTimeLeft") {
    sendResponse({ timeLeft });
  }
});

function startTimer() {
  isRunning = true;
  timer = setInterval(() => {
    timeLeft--;
    updatePieChart(); // This function will need to be defined or handled to update the pie chart
    if (timeLeft <= 0) {
      clearInterval(timer);
      isRunning = false;
      // Notify user that the timer has finished
    }
  }, 1000);
}

function pauseTimer() {
  if (isRunning && !pause) {
    clearInterval(timer);
    pause = true;
  }
}

function resumeTimer() {
  if (pause) {
    startTimer();
    pause = false;
  }
}

function resetTimer() {
  clearInterval(timer);
  timeLeft = 1259; // Reset to the initial time
  isRunning = false;
  pause = false;
}

function updatePieChart() {
  // Logic to update the pie chart based on the current `timeLeft`
  // This will involve sending a message to the popup if it is open
}
