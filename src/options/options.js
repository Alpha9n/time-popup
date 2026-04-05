(function () {
  "use strict";

  const DEFAULT_PERIODS = {
    1: { start: "09:00", end: "10:30" },
    2: { start: "10:40", end: "12:10" },
    3: { start: "13:00", end: "14:30" },
    4: { start: "14:40", end: "16:10" },
    5: { start: "16:20", end: "17:50" },
    6: { start: "18:00", end: "19:30" },
  };
  const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

  const periodsContainer = document.getElementById("periods-container");
  const urlsContainer = document.getElementById("urls-container");
  const statusEl = document.getElementById("status");
  let statusTimeoutId = null;

  function normalizeTimeValue(value, fallback) {
    if (typeof value !== "string") return fallback;
    if (TIME_PATTERN.test(value)) return value;

    const match = value.match(/^(\d{1,2}):(\d{1,2})$/);
    if (!match) return fallback;

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return fallback;
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return fallback;

    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  function sanitizePeriods(rawPeriods) {
    const source = rawPeriods && typeof rawPeriods === "object"
      ? rawPeriods
      : DEFAULT_PERIODS;
    const sanitized = {};
    const sortedKeys = Object.keys(source)
      .map(Number)
      .filter(Number.isInteger)
      .sort((a, b) => a - b);

    if (sortedKeys.length === 0) {
      return DEFAULT_PERIODS;
    }

    for (const key of sortedKeys) {
      const period = source[key] || {};
      const defaultPeriod = DEFAULT_PERIODS[key] || DEFAULT_PERIODS[1];
      sanitized[key] = {
        start: normalizeTimeValue(period.start, defaultPeriod.start),
        end: normalizeTimeValue(period.end, defaultPeriod.end),
      };
    }

    return sanitized;
  }

  function timeToMinutes(timeValue) {
    const [hour, minute] = timeValue.split(":").map(Number);
    return (hour * 60) + minute;
  }

  function clearValidationState() {
    document.querySelectorAll(".input--invalid").forEach((el) => {
      el.classList.remove("input--invalid");
    });
  }

  function validatePeriodInputs() {
    const rows = periodsContainer.querySelectorAll(".period-row");

    for (let i = 0; i < rows.length; i += 1) {
      const periodNum = i + 1;
      const row = rows[i];
      const startInput = row.querySelector(".period-start");
      const endInput = row.querySelector(".period-end");
      const startValue = startInput.value;
      const endValue = endInput.value;

      if (!TIME_PATTERN.test(startValue)) {
        startInput.classList.add("input--invalid");
        return `${periodNum}限の開始時刻は HH:mm 形式で入力してください`;
      }

      if (!TIME_PATTERN.test(endValue)) {
        endInput.classList.add("input--invalid");
        return `${periodNum}限の終了時刻は HH:mm 形式で入力してください`;
      }

      if (timeToMinutes(startValue) >= timeToMinutes(endValue)) {
        startInput.classList.add("input--invalid");
        endInput.classList.add("input--invalid");
        return `${periodNum}限は開始時刻より後の終了時刻を設定してください`;
      }
    }

    return null;
  }

  function validateUrlInputs() {
    const rows = urlsContainer.querySelectorAll(".url-row");
    const seen = new Set();

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const urlInput = row.querySelector(".url-input");
      const value = urlInput.value.trim();
      urlInput.value = value;

      if (!value) continue;

      if (value.length > 512) {
        urlInput.classList.add("input--invalid");
        return "URLパターンは512文字以内で入力してください";
      }

      if (/[\r\n\t]/.test(value)) {
        urlInput.classList.add("input--invalid");
        return "URLパターンに改行やタブは使えません";
      }

      if (seen.has(value)) {
        urlInput.classList.add("input--invalid");
        return "URLパターンが重複しています";
      }

      seen.add(value);
    }

    return null;
  }

  function createPeriodRow(num, start, end) {
    const row = document.createElement("div");
    row.className = "period-row";
    row.innerHTML = `
      <label class="period-label">${num}限</label>
      <input type="time" class="period-start" required />
      <span class="period-separator">〜</span>
      <input type="time" class="period-end" required />
      <button class="btn btn--icon btn--remove-period" title="削除">&times;</button>
    `;
    const startInput = row.querySelector(".period-start");
    const endInput = row.querySelector(".period-end");
    startInput.value = normalizeTimeValue(start, "09:00");
    endInput.value = normalizeTimeValue(end, "10:30");
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
      <input type="text" class="url-input" placeholder="例: https://example.com/schedule" />
      <button class="btn btn--icon btn--remove-url" title="削除">&times;</button>
    `;
    row.querySelector(".url-input").value = typeof url === "string" ? url : "";
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
        const sanitizedPeriods = sanitizePeriods(data.periods);
        const hasPeriodChanges = JSON.stringify(sanitizedPeriods) !== JSON.stringify(data.periods);

        periodsContainer.innerHTML = "";
        const sortedKeys = Object.keys(sanitizedPeriods)
          .map(Number)
          .sort((a, b) => a - b);
        for (const key of sortedKeys) {
          const p = sanitizedPeriods[key];
          periodsContainer.appendChild(createPeriodRow(key, p.start, p.end));
        }

        urlsContainer.innerHTML = "";
        const enabledUrls = Array.isArray(data.enabledUrls) ? data.enabledUrls : [];
        for (const url of enabledUrls) {
          urlsContainer.appendChild(createUrlRow(url));
        }

        // Auto-fix legacy stored values such as "9:00" -> "09:00"
        if (hasPeriodChanges) {
          chrome.storage.sync.set({ periods: sanitizedPeriods });
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

  function showStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.classList.add("status--visible");
    statusEl.classList.toggle("status--error", isError);

    if (statusTimeoutId) {
      clearTimeout(statusTimeoutId);
    }

    statusTimeoutId = setTimeout(() => {
      statusEl.classList.remove("status--visible");
      statusEl.classList.remove("status--error");
    }, isError ? 4000 : 2000);
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
    clearValidationState();
    const validationMessage = validatePeriodInputs();
    if (validationMessage) {
      showStatus(validationMessage, true);
      return;
    }

    const urlValidationMessage = validateUrlInputs();
    if (urlValidationMessage) {
      showStatus(urlValidationMessage, true);
      return;
    }

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
