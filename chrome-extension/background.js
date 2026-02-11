// ─── NGO Hub Background Service Worker ──────
// Handles communication between popup and content scripts

chrome.runtime.onInstalled.addListener(() => {
  console.log("NGO Hub LinkedIn Importer installed.");
});

// Reset daily stats at midnight
chrome.alarms.create("resetDailyStats", {
  when: getNextMidnight(),
  periodInMinutes: 24 * 60,
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "resetDailyStats") {
    chrome.storage.local.set({
      sessionStats: { found: 0, imported: 0, remaining: 150 },
    });
  }
});

function getNextMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime();
}
