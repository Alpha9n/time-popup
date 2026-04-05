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

  const periodsContainer = document.getElementById("periods-container");
  const urlsContainer = document.getElementById("urls-container");
  const statusEl = document.getElementById("status");

  function createPeriodRow(num, start, end) {
    const row = document.createElement("div");
    row.className = "period-row";
    row.innerHTML = `
      <label class="period-label">${num}限</label>
      <input type="time" class="period-start" value="${start}" />
      <span class="period-separator">〜</span>
      <input type="time" class="period-end" value="${end}" />
      <button class="btn btn--icon btn--remove-period" title="削除">&times;</button>
    `;
    row.dataset.period = num;
    row.querySelector(".btn--remove-period").addEventListener("click", () => {
      row.remove();
      renumberPeriods();
    });
    return row;
  }

  function createUrlRow(url) {
    const row = document.createElement("div");
    row.className = "url-row";
    row.innerHTML = `
      <input type="text" class="url-input" value="${url}" placeholder="例: https://example.com/schedule" />
      <button class="btn btn--icon btn--remove-url" title="削除">&times;</button>
    `;
    row.querySelector(".btn--remove-url").addEventListener("click", () => row.remove());
    return row;
  }

  function renumberPeriods() {
    const rows = periodsContainer.querySelectorAll(".period-row");
    rows.forEach((row, i) => {
      const num = i + 1;
      row.dataset.period = num;
      row.querySelector(".period-label").textContent = `${num}限`;
    });
  }

  function loadSettings() {
    chrome.storage.sync.get(
      { periods: DEFAULT_PERIODS, enabledUrls: [] },
      (data) => {
        periodsContainer.innerHTML = "";
        const sortedKeys = Object.keys(data.periods)
          .map(Number)
          .sort((a, b) => a - b);
        for (const key of sortedKeys) {
          const p = data.periods[key];
          periodsContainer.appendChild(createPeriodRow(key, p.start, p.end));
        }

        urlsContainer.innerHTML = "";
        for (const url of data.enabledUrls) {
          urlsContainer.appendChild(createUrlRow(url));
        }
      }
    );
  }

  function collectSettings() {
    const periods = {};
    const rows = periodsContainer.querySelectorAll(".period-row");
    rows.forEach((row, i) => {
      const num = i + 1;
      periods[num] = {
        start: row.querySelector(".period-start").value,
        end: row.querySelector(".period-end").value,
      };
    });

    const enabledUrls = [];
    const urlRows = urlsContainer.querySelectorAll(".url-row");
    urlRows.forEach((row) => {
      const val = row.querySelector(".url-input").value.trim();
      if (val) enabledUrls.push(val);
    });

    return { periods, enabledUrls };
  }

  function showStatus(message) {
    statusEl.textContent = message;
    statusEl.classList.add("status--visible");
    setTimeout(() => {
      statusEl.classList.remove("status--visible");
    }, 2000);
  }

  // Add period
  document.getElementById("add-period").addEventListener("click", () => {
    const rows = periodsContainer.querySelectorAll(".period-row");
    const nextNum = rows.length + 1;
    periodsContainer.appendChild(createPeriodRow(nextNum, "09:00", "10:30"));
  });

  // Add URL
  document.getElementById("add-url").addEventListener("click", () => {
    urlsContainer.appendChild(createUrlRow(""));
  });

  // Save
  document.getElementById("save").addEventListener("click", () => {
    const settings = collectSettings();
    chrome.storage.sync.set(settings, () => {
      showStatus("保存しました");
    });
  });

  // Reset
  document.getElementById("reset").addEventListener("click", () => {
    if (confirm("設定を初期値に戻しますか？")) {
      chrome.storage.sync.set(
        { periods: DEFAULT_PERIODS, enabledUrls: [] },
        () => {
          loadSettings();
          showStatus("初期値に戻しました");
        }
      );
    }
  });

  loadSettings();
})();
