(function () {
  "use strict";

  const DEFAULT_PERIODS = {
    1: { start: "9:00", end: "10:30" },
    2: { start: "10:40", end: "12:10" },
    3: { start: "13:00", end: "14:30" },
    4: { start: "14:40", end: "16:10" },
    5: { start: "16:20", end: "17:50" },
    6: { start: "18:00", end: "19:30" },
  };

  function renderSchedule(periods) {
    const container = document.getElementById("schedule");
    container.innerHTML = "";

    const sortedKeys = Object.keys(periods)
      .map(Number)
      .sort((a, b) => a - b);

    for (const key of sortedKeys) {
      const p = periods[key];
      const row = document.createElement("div");
      row.className = "schedule-row";

      const label = document.createElement("span");
      label.className = "schedule-label";
      label.textContent = `${key}限`;

      const time = document.createElement("span");
      time.className = "schedule-time";
      time.textContent = `${p.start} 〜 ${p.end}`;

      row.appendChild(label);
      row.appendChild(time);
      container.appendChild(row);
    }
  }

  function loadAndRender() {
    chrome.storage.sync.get(
      { periods: DEFAULT_PERIODS, isEnabled: true },
      (data) => {
        renderSchedule(data.periods);
        document.getElementById("toggle-enabled").checked = data.isEnabled;
      }
    );
  }

  // Toggle enable/disable
  document.getElementById("toggle-enabled").addEventListener("change", (e) => {
    chrome.storage.sync.set({ isEnabled: e.target.checked });
  });

  // Open options page
  document.getElementById("open-options").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  loadAndRender();
})();
