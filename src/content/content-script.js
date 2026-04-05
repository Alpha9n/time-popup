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

  // Maps full-width digits and kanji numerals to half-width
  const DIGIT_MAP = {
    "０": "0", "１": "1", "２": "2", "３": "3", "４": "4",
    "５": "5", "６": "6", "７": "7", "８": "8", "９": "9",
    "一": "1", "二": "2", "三": "3", "四": "4", "五": "5",
    "六": "6", "七": "7", "八": "8", "九": "9", "十": "10",
  };

  // Regex to match "n限" or "n限目" with half-width, full-width, or kanji digits
  const PERIOD_REGEX = /([0-9０-９一二三四五六七八九十]+)\s*限(?:目)?/g;

  let periods = DEFAULT_PERIODS;
  let enabledUrls = []; // empty = all URLs
  let isEnabled = true;

  function normalizeDigit(str) {
    let result = "";
    for (const ch of str) {
      result += DIGIT_MAP[ch] || ch;
    }
    return parseInt(result, 10);
  }

  function loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        { periods: DEFAULT_PERIODS, enabledUrls: [], isEnabled: true },
        (data) => {
          periods = data.periods;
          enabledUrls = data.enabledUrls;
          isEnabled = data.isEnabled;
          resolve();
        }
      );
    });
  }

  function shouldRunOnCurrentPage() {
    if (!isEnabled) return false;
    if (enabledUrls.length === 0) return true;
    const currentUrl = window.location.href;
    return enabledUrls.some((pattern) => {
      try {
        const regex = new RegExp(pattern);
        return regex.test(currentUrl);
      } catch {
        return currentUrl.includes(pattern);
      }
    });
  }

  function createTooltip() {
    const tooltip = document.createElement("div");
    tooltip.id = "jigen-popup-tooltip";
    tooltip.setAttribute("role", "tooltip");
    document.body.appendChild(tooltip);
    return tooltip;
  }

  function showTooltip(element, periodNum) {
    const info = periods[periodNum];
    if (!info) return;

    let tooltip = document.getElementById("jigen-popup-tooltip");
    if (!tooltip) {
      tooltip = createTooltip();
    }

    tooltip.textContent = `${periodNum}限: ${info.start} 〜 ${info.end}`;
    tooltip.classList.add("jigen-popup-tooltip--visible");

    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let top = rect.top - tooltipRect.height - 8;
    let left = rect.left + (rect.width - tooltipRect.width) / 2;

    // If tooltip goes above viewport, show below
    if (top < 0) {
      top = rect.bottom + 8;
    }
    // Clamp horizontally
    left = Math.max(4, Math.min(left, window.innerWidth - tooltipRect.width - 4));

    tooltip.style.top = `${top + window.scrollY}px`;
    tooltip.style.left = `${left + window.scrollX}px`;
  }

  function hideTooltip() {
    const tooltip = document.getElementById("jigen-popup-tooltip");
    if (tooltip) {
      tooltip.classList.remove("jigen-popup-tooltip--visible");
    }
  }

  function processTextNode(textNode) {
    const text = textNode.nodeValue;
    if (!PERIOD_REGEX.test(text)) return;
    PERIOD_REGEX.lastIndex = 0;

    const parent = textNode.parentNode;
    if (!parent) return;
    // Skip if already processed
    if (parent.classList && parent.classList.contains("jigen-popup-highlight")) return;
    // Skip script/style/input elements
    const tag = parent.tagName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA" || tag === "INPUT") return;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match;

    PERIOD_REGEX.lastIndex = 0;
    while ((match = PERIOD_REGEX.exec(text)) !== null) {
      const periodNum = normalizeDigit(match[1]);
      if (!periods[periodNum]) continue;

      // Add text before match
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }

      // Create highlighted span
      const span = document.createElement("span");
      span.className = "jigen-popup-highlight";
      span.dataset.period = periodNum;
      span.textContent = match[0];
      span.addEventListener("mouseenter", () => showTooltip(span, periodNum));
      span.addEventListener("mouseleave", hideTooltip);
      fragment.appendChild(span);

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    if (lastIndex > 0) {
      parent.replaceChild(fragment, textNode);
    }
  }

  function scanDocument() {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentNode;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName;
          if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA" || tag === "INPUT") {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.classList && parent.classList.contains("jigen-popup-highlight")) {
            return NodeFilter.FILTER_REJECT;
          }
          if (PERIOD_REGEX.test(node.nodeValue)) {
            PERIOD_REGEX.lastIndex = 0;
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_REJECT;
        },
      }
    );

    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    textNodes.forEach(processTextNode);
  }

  function observeMutations() {
    const observer = new MutationObserver((mutations) => {
      let shouldRescan = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldRescan = true;
          break;
        }
      }
      if (shouldRescan) {
        scanDocument();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Listen for settings changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.periods) {
      periods = changes.periods.newValue;
    }
    if (changes.enabledUrls) {
      enabledUrls = changes.enabledUrls.newValue;
    }
    if (changes.isEnabled) {
      isEnabled = changes.isEnabled.newValue;
    }
  });

  // Initialize
  loadSettings().then(() => {
    if (!shouldRunOnCurrentPage()) return;
    scanDocument();
    observeMutations();
  });
})();
