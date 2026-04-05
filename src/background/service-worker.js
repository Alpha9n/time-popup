const DEFAULT_PERIODS = {
  1: { start: "09:00", end: "10:30" },
  2: { start: "10:40", end: "12:10" },
  3: { start: "13:00", end: "14:30" },
  4: { start: "14:40", end: "16:10" },
  5: { start: "16:20", end: "17:50" },
  6: { start: "18:00", end: "19:30" },
};

// Initialize default settings on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.storage.sync.set({
      periods: DEFAULT_PERIODS,
      enabledUrls: [],
      isEnabled: true,
    });
  }
});
