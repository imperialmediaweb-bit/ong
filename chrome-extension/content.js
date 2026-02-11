// ─── NGO Hub LinkedIn Content Script ─────────
// Runs on linkedin.com pages

let isAutoImporting = false;
let autoImportTimer = null;

// ─── Listen for messages from popup ──────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "startAutoImport") {
    startAutoScroll();
    sendResponse({ ok: true });
  }
  if (msg.action === "stopAutoImport") {
    stopAutoScroll();
    sendResponse({ ok: true });
  }
  return true;
});

// ─── Auto-scroll and capture ─────────────────
async function startAutoScroll() {
  if (isAutoImporting) return;
  isAutoImporting = true;

  showBanner("Auto-Import activ — se scaneaza pagina...");

  let scrollCount = 0;
  const MAX_SCROLLS = 25; // max pages to scroll
  const seenUrls = new Set();

  async function scrollAndCapture() {
    if (!isAutoImporting) return;

    // Check for CAPTCHA or security warnings
    if (detectCaptcha()) {
      chrome.runtime.sendMessage({ action: "captchaDetected" });
      stopAutoScroll();
      return;
    }

    // Extract current visible prospects
    const prospects = extractVisibleProspects(seenUrls);

    if (prospects.length > 0) {
      chrome.runtime.sendMessage({
        action: "autoImportBatch",
        prospects,
      });
      updateBanner(`Scanat ${scrollCount + 1}/${MAX_SCROLLS} — ${seenUrls.size} prospecte gasite`);
    }

    scrollCount++;
    if (scrollCount >= MAX_SCROLLS) {
      chrome.runtime.sendMessage({ action: "autoImportDone" });
      stopAutoScroll();
      return;
    }

    // Scroll down
    window.scrollBy(0, window.innerHeight * 0.8);

    // Click "Next" button if available (search results pagination)
    const nextBtn = document.querySelector("button.artdeco-pagination__button--next:not([disabled])");
    if (nextBtn && isNearBottom()) {
      await randomDelay(1500, 3000);
      nextBtn.click();
      await randomDelay(3000, 5000);
    }

    // Random delay between scrolls (1.5-4s)
    const delay = randomDelayMs(1500, 4000);
    autoImportTimer = setTimeout(scrollAndCapture, delay);
  }

  scrollAndCapture();
}

function stopAutoScroll() {
  isAutoImporting = false;
  if (autoImportTimer) {
    clearTimeout(autoImportTimer);
    autoImportTimer = null;
  }
  hideBanner();
}

// ─── Extract visible prospects ───────────────
function extractVisibleProspects(seenUrls) {
  const prospects = [];

  const cards = document.querySelectorAll(
    ".reusable-search__result-container, .search-result__wrapper, li.reusable-search-simple-insight"
  );

  cards.forEach((card) => {
    try {
      const linkEl = card.querySelector("a[href*='/in/']");
      if (!linkEl) return;

      const profileUrl = linkEl.href.split("?")[0].replace(/\/$/, "");
      if (seenUrls.has(profileUrl)) return;

      const nameEl = card.querySelector(
        ".entity-result__title-text a span[aria-hidden='true'], .actor-name, .entity-result__title-line span"
      );
      const headlineEl = card.querySelector(
        ".entity-result__primary-subtitle, .entity-result__summary, .subline-level-1"
      );
      const locationEl = card.querySelector(
        ".entity-result__secondary-subtitle, .subline-level-2"
      );
      const imgEl = card.querySelector(
        "img.presence-entity__image, img.EntityPhoto-circle-4"
      );

      const fullName = nameEl?.textContent?.trim() || "";
      if (!fullName || fullName === "LinkedIn Member") return;

      const headline = headlineEl?.textContent?.trim() || "";
      const parts = headline.split(/ at | la | @ | - | chez /);

      seenUrls.add(profileUrl);
      prospects.push({
        fullName,
        headline: parts[0]?.trim() || headline,
        company: parts[1]?.trim() || null,
        location: locationEl?.textContent?.trim() || null,
        profileUrl,
        profileImageUrl: imgEl?.src || null,
      });
    } catch {
      // Skip malformed cards
    }
  });

  return prospects;
}

// ─── CAPTCHA / Warning Detection ─────────────
function detectCaptcha() {
  const body = document.body.textContent || "";
  const indicators = [
    "unusual activity",
    "security verification",
    "captcha",
    "verify you",
    "not a robot",
    "verificare de securitate",
  ];
  return indicators.some((i) => body.toLowerCase().includes(i));
}

// ─── Helpers ─────────────────────────────────
function isNearBottom() {
  return window.innerHeight + window.scrollY >= document.body.offsetHeight - 500;
}

function randomDelayMs(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDelay(min, max) {
  return new Promise((resolve) => setTimeout(resolve, randomDelayMs(min, max)));
}

// ─── Visual Banner ───────────────────────────
let bannerEl = null;

function showBanner(text) {
  if (!bannerEl) {
    bannerEl = document.createElement("div");
    bannerEl.id = "ngo-hub-banner";
    bannerEl.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 999999;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white;
      padding: 10px 20px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 13px;
      font-weight: 600;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      box-shadow: 0 2px 10px rgba(79, 70, 229, 0.5);
    `;
    document.body.prepend(bannerEl);
  }
  bannerEl.textContent = `🎯 NGO Hub: ${text}`;
}

function updateBanner(text) {
  if (bannerEl) bannerEl.textContent = `🎯 NGO Hub: ${text}`;
}

function hideBanner() {
  if (bannerEl) {
    bannerEl.remove();
    bannerEl = null;
  }
}
