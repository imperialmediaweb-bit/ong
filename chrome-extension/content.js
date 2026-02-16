// ─── Binevo LinkedIn Content Script ─────────
// Runs on linkedin.com pages

let isAutoImporting = false;
let autoImportTimer = null;

// ─── Floating UI State ──────────────────────
let panelOpen = false;
let panelConnected = false;
let panelNgoName = "";
let panelStats = { found: 0, imported: 0, remaining: 150 };
let panelAutoImporting = false;

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
  panelAutoImporting = true;
  updatePanelUI();

  showBanner("Auto-Import activ — se scaneaza pagina...");

  let scrollCount = 0;
  const MAX_SCROLLS = 25; // max pages to scroll
  const seenUrls = new Set();

  async function scrollAndCapture() {
    if (!isAutoImporting) return;

    // Check for CAPTCHA or security warnings
    if (detectCaptcha()) {
      chrome.runtime.sendMessage({ action: "captchaDetected" });
      panelAddLog("CAPTCHA detectat! Auto-import oprit.", "error");
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

      // Also send to API from panel if connected
      if (panelConnected) {
        await panelSendProspects(prospects);
      }

      updateBanner(`Scanat ${scrollCount + 1}/${MAX_SCROLLS} — ${seenUrls.size} prospecte gasite`);
    }

    scrollCount++;
    if (scrollCount >= MAX_SCROLLS) {
      chrome.runtime.sendMessage({ action: "autoImportDone" });
      panelAddLog("Auto-import finalizat.", "success");
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
  panelAutoImporting = false;
  if (autoImportTimer) {
    clearTimeout(autoImportTimer);
    autoImportTimer = null;
  }
  hideBanner();
  updatePanelUI();
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
    bannerEl.id = "binevo-banner";
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
  bannerEl.textContent = `Binevo: ${text}`;
}

function updateBanner(text) {
  if (bannerEl) bannerEl.textContent = `Binevo: ${text}`;
}

function hideBanner() {
  if (bannerEl) {
    bannerEl.remove();
    bannerEl = null;
  }
}

// ════════════════════════════════════════════════
//  FLOATING BUTTON & INLINE PANEL
// ════════════════════════════════════════════════

function createFloatingUI() {
  // Don't create twice
  if (document.getElementById("binevo-fab")) return;

  // ─── FAB Button ──────────────────────────
  const fab = document.createElement("button");
  fab.id = "binevo-fab";
  fab.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>`;
  fab.title = "Binevo Importer";
  fab.addEventListener("click", togglePanel);
  document.body.appendChild(fab);

  // ─── Panel ───────────────────────────────
  const panel = document.createElement("div");
  panel.id = "binevo-panel";
  panel.classList.add("binevo-panel--hidden");
  document.body.appendChild(panel);

  // Initialize: load storage and render
  initPanel();
}

async function initPanel() {
  const data = await chrome.storage.local.get(["apiUrl", "apiToken", "ngoName", "sessionStats"]);
  if (data.sessionStats) panelStats = data.sessionStats;
  if (data.ngoName) panelNgoName = data.ngoName;

  // Test connection silently
  if (data.apiUrl && data.apiToken) {
    try {
      const res = await fetch(`${data.apiUrl}/api/prospects/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${data.apiToken}`,
        },
        body: JSON.stringify({ prospects: [] }),
      });
      if (res.ok || res.status === 400) {
        const result = await res.json();
        panelConnected = true;
        panelNgoName = result.ngoName || data.ngoName || "Binevo";
        if (result.dailyRemaining !== undefined) {
          panelStats.remaining = result.dailyRemaining;
        }
      }
    } catch {
      // Silent fail — user can reconnect from panel
    }
  }

  updateFabIndicator();
  renderPanel();
}

function togglePanel() {
  panelOpen = !panelOpen;
  const panel = document.getElementById("binevo-panel");
  const fab = document.getElementById("binevo-fab");
  if (!panel || !fab) return;

  if (panelOpen) {
    panel.classList.remove("binevo-panel--hidden");
    fab.classList.add("binevo-fab--active");
    // Re-render with fresh data
    refreshPanelData();
  } else {
    panel.classList.add("binevo-panel--hidden");
    fab.classList.remove("binevo-fab--active");
  }
}

async function refreshPanelData() {
  const data = await chrome.storage.local.get(["sessionStats"]);
  if (data.sessionStats) panelStats = data.sessionStats;
  renderPanel();
}

function updateFabIndicator() {
  const fab = document.getElementById("binevo-fab");
  if (!fab) return;
  fab.classList.remove("binevo-fab--pulse", "binevo-fab--connected");
  fab.classList.add(panelConnected ? "binevo-fab--connected" : "binevo-fab--pulse");
}

function renderPanel() {
  const panel = document.getElementById("binevo-panel");
  if (!panel) return;

  panel.innerHTML = `
    <div class="binevo-panel__header">
      <div class="binevo-panel__header-left">
        <div class="binevo-panel__logo">B</div>
        <div>
          <div class="binevo-panel__title">Binevo Importer</div>
          <div class="binevo-panel__subtitle">LinkedIn Prospect Capture</div>
        </div>
      </div>
      <button class="binevo-panel__close" id="binevo-panel-close">&times;</button>
    </div>
    <div class="binevo-panel__body">
      ${panelConnected ? renderConnectedView() : renderSetupView()}
      <div class="binevo-panel__log" id="binevo-panel-log">
        <div class="binevo-panel__log-info">Extensia este gata.</div>
      </div>
    </div>
  `;

  // Bind events
  document.getElementById("binevo-panel-close").addEventListener("click", togglePanel);

  if (panelConnected) {
    document.getElementById("binevo-p-import")?.addEventListener("click", panelImportVisible);
    document.getElementById("binevo-p-auto")?.addEventListener("click", panelStartAutoImport);
    document.getElementById("binevo-p-stop")?.addEventListener("click", panelStopAutoImport);
    document.getElementById("binevo-p-dashboard")?.addEventListener("click", panelOpenDashboard);
  } else {
    document.getElementById("binevo-p-save")?.addEventListener("click", panelSaveSettings);
  }
}

function renderConnectedView() {
  const stopBtnStyle = panelAutoImporting ? "" : "display:none;";
  const actionBtnsStyle = panelAutoImporting ? "display:none;" : "";

  return `
    <div class="binevo-panel__status binevo-panel__status--ok">
      <div class="binevo-panel__status-dot binevo-panel__status-dot--green"></div>
      <span>Conectat la <strong>${escapeHtml(panelNgoName)}</strong></span>
    </div>
    <div class="binevo-panel__stats">
      <div class="binevo-panel__stat">
        <div class="binevo-panel__stat-value" id="binevo-p-found">${panelStats.found}</div>
        <div class="binevo-panel__stat-label">Gasite</div>
      </div>
      <div class="binevo-panel__stat">
        <div class="binevo-panel__stat-value" id="binevo-p-imported">${panelStats.imported}</div>
        <div class="binevo-panel__stat-label">Importate</div>
      </div>
      <div class="binevo-panel__stat">
        <div class="binevo-panel__stat-value" id="binevo-p-remaining">${panelStats.remaining}</div>
        <div class="binevo-panel__stat-label">Ramase</div>
      </div>
    </div>
    <div class="binevo-panel__actions" style="${actionBtnsStyle}">
      <button class="binevo-panel__btn binevo-panel__btn--primary" id="binevo-p-import">Import Visible</button>
      <button class="binevo-panel__btn binevo-panel__btn--auto" id="binevo-p-auto">Auto-Import</button>
    </div>
    <div style="${stopBtnStyle}">
      <button class="binevo-panel__btn binevo-panel__btn--stop" id="binevo-p-stop">Stop Auto-Import</button>
    </div>
    <button class="binevo-panel__btn binevo-panel__btn--link" id="binevo-p-dashboard" style="margin-top:8px;">Deschide Dashboard</button>
  `;
}

function renderSetupView() {
  return `
    <div class="binevo-panel__status binevo-panel__status--err">
      <div class="binevo-panel__status-dot binevo-panel__status-dot--red"></div>
      <span>Neconectat — introdu tokenul API</span>
    </div>
    <div class="binevo-panel__setup">
      <div class="binevo-panel__field">
        <label class="binevo-panel__label">URL Platforma</label>
        <input class="binevo-panel__input" type="url" id="binevo-p-url" placeholder="https://ong-production.up.railway.app" />
      </div>
      <div class="binevo-panel__field">
        <label class="binevo-panel__label">Token API</label>
        <input class="binevo-panel__input" type="text" id="binevo-p-token" placeholder="ngo_xxxxxxxxxxxx..." />
      </div>
      <button class="binevo-panel__btn binevo-panel__btn--primary" id="binevo-p-save" style="width:100%;margin-top:4px;">Salveaza &amp; Conecteaza</button>
    </div>
  `;
}

// ─── Panel Actions ──────────────────────────

async function panelSaveSettings() {
  const urlInput = document.getElementById("binevo-p-url");
  const tokenInput = document.getElementById("binevo-p-token");
  if (!urlInput || !tokenInput) return;

  const apiUrl = urlInput.value.trim().replace(/\/$/, "");
  const apiToken = tokenInput.value.trim();

  if (!apiUrl || !apiToken) {
    panelAddLog("Completeaza URL-ul si tokenul.", "error");
    return;
  }

  await chrome.storage.local.set({ apiUrl, apiToken });
  panelAddLog("Se testeaza conexiunea...", "info");

  try {
    const res = await fetch(`${apiUrl}/api/prospects/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiToken}`,
      },
      body: JSON.stringify({ prospects: [] }),
    });

    if (res.status === 401) {
      panelAddLog("Token invalid sau expirat.", "error");
      return;
    }

    const data = await res.json();
    if (res.ok || res.status === 400) {
      panelConnected = true;
      panelNgoName = data.ngoName || "Binevo";
      if (data.dailyRemaining !== undefined) {
        panelStats.remaining = data.dailyRemaining;
      }
      await chrome.storage.local.set({ ngoName: panelNgoName });
      updateFabIndicator();
      renderPanel();
      panelAddLog(`Conectat la ${panelNgoName}!`, "success");
    } else {
      panelAddLog(`Eroare: ${data.error || "Unknown"}`, "error");
    }
  } catch (err) {
    panelAddLog(`Conexiune esuata: ${err.message}`, "error");
  }
}

async function panelImportVisible() {
  if (!panelConnected) return;

  const btn = document.getElementById("binevo-p-import");
  if (btn) btn.disabled = true;
  panelAddLog("Se scaneaza pagina LinkedIn...", "info");

  try {
    const prospects = panelExtractProspects();
    panelStats.found += prospects.length;

    if (prospects.length === 0) {
      panelAddLog("Niciun prospect gasit pe aceasta pagina.", "error");
      if (btn) btn.disabled = false;
      updatePanelStats();
      return;
    }

    panelAddLog(`${prospects.length} prospecte gasite. Se trimit...`, "info");
    await panelSendProspects(prospects);
  } catch (err) {
    panelAddLog(`Eroare: ${err.message}`, "error");
  }

  if (btn) btn.disabled = false;
  updatePanelStats();
  await chrome.storage.local.set({ sessionStats: panelStats });
}

function panelExtractProspects() {
  const prospects = [];
  const seen = new Set();

  // Search results
  const searchCards = document.querySelectorAll(
    ".reusable-search__result-container, .search-result__wrapper, li.reusable-search-simple-insight"
  );
  searchCards.forEach((card) => {
    try {
      const linkEl = card.querySelector("a.app-aware-link[href*='/in/'], a[href*='/in/']");
      if (!linkEl) return;
      const profileUrl = linkEl.href.split("?")[0].replace(/\/$/, "");
      if (seen.has(profileUrl)) return;

      const nameEl = card.querySelector(".entity-result__title-text a span[aria-hidden='true'], .actor-name, .entity-result__title-line span");
      const headlineEl = card.querySelector(".entity-result__primary-subtitle, .entity-result__summary, .subline-level-1");
      const locationEl = card.querySelector(".entity-result__secondary-subtitle, .subline-level-2");
      const imgEl = card.querySelector("img.presence-entity__image, img.EntityPhoto-circle-4, img[data-delayed-url]");

      const fullName = nameEl?.textContent?.trim() || "";
      if (!fullName || fullName === "LinkedIn Member") return;

      const headline = headlineEl?.textContent?.trim() || "";
      const parts = headline.split(/ at | la | @ | - | chez /);

      seen.add(profileUrl);
      prospects.push({
        fullName,
        headline: parts[0]?.trim() || headline,
        company: parts[1]?.trim() || null,
        location: locationEl?.textContent?.trim() || null,
        profileUrl,
        profileImageUrl: imgEl?.src || null,
      });
    } catch { /* skip */ }
  });

  // Suggestions
  const suggestionCards = document.querySelectorAll(".pv-browsemap-section__member-container, .artdeco-card li");
  suggestionCards.forEach((card) => {
    try {
      const linkEl = card.querySelector("a[href*='/in/']");
      if (!linkEl) return;
      const profileUrl = linkEl.href.split("?")[0].replace(/\/$/, "");
      if (seen.has(profileUrl)) return;

      const nameEl = card.querySelector(".artdeco-entity-lockup__title, .name, h3");
      const subtitleEl = card.querySelector(".artdeco-entity-lockup__subtitle, .headline");
      const fullName = nameEl?.textContent?.trim() || "";
      if (!fullName || fullName === "LinkedIn Member") return;

      seen.add(profileUrl);
      prospects.push({
        fullName,
        headline: subtitleEl?.textContent?.trim() || null,
        company: null,
        location: null,
        profileUrl,
        profileImageUrl: null,
      });
    } catch { /* skip */ }
  });

  // Single profile page
  if (window.location.pathname.match(/^\/in\//)) {
    try {
      const profileUrl = window.location.href.split("?")[0].replace(/\/$/, "");
      if (!seen.has(profileUrl)) {
        const nameEl = document.querySelector("h1.text-heading-xlarge, h1.pv-text-details--left-aligned");
        const headlineEl = document.querySelector(".text-body-medium.break-words");
        const locationEl = document.querySelector(".text-body-small.inline.t-black--light.break-words");
        const imgEl = document.querySelector("img.pv-top-card-profile-picture__image");

        const fullName = nameEl?.textContent?.trim() || "";
        if (fullName) {
          prospects.push({
            fullName,
            headline: headlineEl?.textContent?.trim() || null,
            company: null,
            location: locationEl?.textContent?.trim() || null,
            profileUrl,
            profileImageUrl: imgEl?.src || null,
          });
        }
      }
    } catch { /* skip */ }
  }

  return prospects;
}

async function panelSendProspects(prospects) {
  const data = await chrome.storage.local.get(["apiUrl", "apiToken"]);
  try {
    const res = await fetch(`${data.apiUrl}/api/prospects/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${data.apiToken}`,
      },
      body: JSON.stringify({ prospects }),
    });

    const result = await res.json();
    if (res.ok) {
      panelStats.imported += result.imported;
      panelStats.remaining = result.dailyRemaining;
      panelAddLog(`+${result.imported} importate, ${result.duplicates} duplicate`, "success");
    } else {
      panelAddLog(`Eroare: ${result.error}`, "error");
      if (res.status === 429) {
        panelAddLog("Rate limit atins. Opreste auto-importul.", "error");
        if (panelAutoImporting) panelStopAutoImport();
      }
    }
  } catch (err) {
    panelAddLog(`Eroare retea: ${err.message}`, "error");
  }

  updatePanelStats();
  await chrome.storage.local.set({ sessionStats: panelStats });
}

function panelStartAutoImport() {
  if (!panelConnected || panelAutoImporting) return;
  panelAutoImporting = true;
  panelAddLog("Auto-import pornit...", "info");
  startAutoScroll();
  updatePanelUI();
}

function panelStopAutoImport() {
  panelAddLog("Auto-import oprit.", "info");
  stopAutoScroll();
}

async function panelOpenDashboard() {
  const data = await chrome.storage.local.get(["apiUrl"]);
  const url = data.apiUrl || "https://ong-production.up.railway.app";
  window.open(`${url}/dashboard/retea`, "_blank");
}

// ─── Panel UI Updates ───────────────────────

function updatePanelUI() {
  // Re-render the action buttons area based on auto-import state
  const panel = document.getElementById("binevo-panel");
  if (!panel || panel.classList.contains("binevo-panel--hidden")) return;
  renderPanel();
}

function updatePanelStats() {
  const found = document.getElementById("binevo-p-found");
  const imported = document.getElementById("binevo-p-imported");
  const remaining = document.getElementById("binevo-p-remaining");
  if (found) found.textContent = panelStats.found;
  if (imported) imported.textContent = panelStats.imported;
  if (remaining) remaining.textContent = panelStats.remaining;
}

function panelAddLog(text, type = "info") {
  const log = document.getElementById("binevo-panel-log");
  if (!log) return;
  const div = document.createElement("div");
  div.className = `binevo-panel__log-${type}`;
  const time = new Date().toLocaleTimeString("ro-RO");
  div.textContent = `[${time}] ${text}`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ─── Initialize Floating UI on page load ────
createFloatingUI();
