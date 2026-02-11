// ─── State ────────────────────────────────────
let isConnected = false;
let isAutoImporting = false;
let sessionStats = { found: 0, imported: 0, remaining: 150 };

// ─── DOM ─────────────────────────────────────
const $ = (id) => document.getElementById(id);

// ─── Init ────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  // Load saved settings
  const data = await chrome.storage.local.get(["apiUrl", "apiToken", "ngoName", "sessionStats"]);

  if (data.apiUrl) $("apiUrl").value = data.apiUrl;
  if (data.apiToken) $("apiToken").value = data.apiToken;
  if (data.sessionStats) sessionStats = data.sessionStats;

  if (data.apiToken && data.apiUrl) {
    await testConnection(data.apiUrl, data.apiToken);
  }

  updateStats();

  // Event listeners
  $("btn-save-settings").addEventListener("click", saveSettings);
  $("btn-import").addEventListener("click", importVisible);
  $("btn-auto").addEventListener("click", startAutoImport);
  $("btn-stop").addEventListener("click", stopAutoImport);
  $("btn-settings-toggle").addEventListener("click", toggleSettings);
  $("open-dashboard").addEventListener("click", (e) => {
    e.preventDefault();
    const url = $("apiUrl").value || "https://ong-production.up.railway.app";
    chrome.tabs.create({ url: `${url}/dashboard/retea` });
  });
});

// ─── Save Settings ───────────────────────────
async function saveSettings() {
  const apiUrl = $("apiUrl").value.trim().replace(/\/$/, "");
  const apiToken = $("apiToken").value.trim();

  if (!apiUrl || !apiToken) {
    addLog("Completeaza URL-ul si tokenul.", "error");
    return;
  }

  await chrome.storage.local.set({ apiUrl, apiToken });
  addLog("Setari salvate. Se testeaza conexiunea...", "info");

  await testConnection(apiUrl, apiToken);
}

// ─── Test Connection ─────────────────────────
async function testConnection(apiUrl, token) {
  try {
    const res = await fetch(`${apiUrl}/api/prospects/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ prospects: [] }),
    });

    if (res.status === 401) {
      setConnected(false);
      addLog("Token invalid sau expirat.", "error");
      return;
    }

    const data = await res.json();
    // Even a 400 (no prospects) means the token works
    if (res.ok || res.status === 400) {
      setConnected(true, data.ngoName);
      if (data.dailyRemaining !== undefined) {
        sessionStats.remaining = data.dailyRemaining;
        updateStats();
      }
      addLog(`Conectat la ${data.ngoName || "Binevo"}!`, "success");
    } else {
      setConnected(false);
      addLog(`Eroare: ${data.error || "Unknown"}`, "error");
    }
  } catch (err) {
    setConnected(false);
    addLog(`Conexiune esuata: ${err.message}`, "error");
  }
}

// ─── Set Connected State ─────────────────────
function setConnected(connected, ngoName) {
  isConnected = connected;
  $("status-connected").classList.toggle("hidden", !connected);
  $("status-disconnected").classList.toggle("hidden", connected);
  $("stats-section").classList.toggle("hidden", !connected);

  if (connected) {
    $("ngo-name").textContent = ngoName || "Binevo";
    $("settings-section").classList.add("hidden");
    chrome.storage.local.set({ ngoName });
  } else {
    $("settings-section").classList.remove("hidden");
  }
}

// ─── Toggle Settings ─────────────────────────
function toggleSettings() {
  $("settings-section").classList.toggle("hidden");
}

// ─── Import Visible Prospects ────────────────
async function importVisible() {
  if (!isConnected) {
    addLog("Nu esti conectat. Salveaza setarile.", "error");
    return;
  }

  $("btn-import").disabled = true;
  addLog("Se scaneaza pagina LinkedIn...", "info");

  try {
    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.url?.includes("linkedin.com")) {
      addLog("Navigheaza pe LinkedIn pentru a importa prospecte.", "error");
      $("btn-import").disabled = false;
      return;
    }

    // Inject content script and extract prospects
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractLinkedInProspects,
    });

    const prospects = results?.[0]?.result || [];
    sessionStats.found += prospects.length;

    if (prospects.length === 0) {
      addLog("Niciun prospect gasit pe aceasta pagina.", "error");
      $("btn-import").disabled = false;
      updateStats();
      return;
    }

    addLog(`${prospects.length} prospecte gasite. Se trimit...`, "info");

    // Send to API
    const data = await chrome.storage.local.get(["apiUrl", "apiToken"]);
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
      sessionStats.imported += result.imported;
      sessionStats.remaining = result.dailyRemaining;
      addLog(`✓ ${result.imported} importate, ${result.duplicates} duplicate`, "success");
    } else {
      addLog(`Eroare: ${result.error}`, "error");
    }
  } catch (err) {
    addLog(`Eroare: ${err.message}`, "error");
  }

  $("btn-import").disabled = false;
  updateStats();
  await chrome.storage.local.set({ sessionStats });
}

// ─── Auto Import (scroll + capture) ─────────
async function startAutoImport() {
  if (!isConnected || isAutoImporting) return;

  isAutoImporting = true;
  $("btn-auto").classList.add("hidden");
  $("btn-import").classList.add("hidden");
  $("btn-stop").classList.remove("hidden");

  addLog("Auto-import pornit. Se scaneaza pagina...", "info");

  // Send message to content script to start auto-scrolling
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.url?.includes("linkedin.com")) {
    addLog("Navigheaza pe LinkedIn.", "error");
    stopAutoImport();
    return;
  }

  chrome.tabs.sendMessage(tab.id, { action: "startAutoImport" });

  // Listen for results from content script
  chrome.runtime.onMessage.addListener(autoImportListener);
}

function stopAutoImport() {
  isAutoImporting = false;
  $("btn-auto").classList.remove("hidden");
  $("btn-import").classList.remove("hidden");
  $("btn-stop").classList.add("hidden");

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { action: "stopAutoImport" });
    }
  });

  chrome.runtime.onMessage.removeListener(autoImportListener);
  addLog("Auto-import oprit.", "info");
}

async function autoImportListener(msg) {
  if (msg.action === "autoImportBatch") {
    const prospects = msg.prospects || [];
    sessionStats.found += prospects.length;

    if (prospects.length > 0) {
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
          sessionStats.imported += result.imported;
          sessionStats.remaining = result.dailyRemaining;
          addLog(`✓ Batch: +${result.imported} importate (${result.duplicates} dup)`, "success");
        } else {
          addLog(`Eroare batch: ${result.error}`, "error");
          if (res.status === 429) stopAutoImport();
        }
      } catch (err) {
        addLog(`Eroare retea: ${err.message}`, "error");
      }
    }

    updateStats();
    await chrome.storage.local.set({ sessionStats });
  }

  if (msg.action === "autoImportDone" || msg.action === "captchaDetected") {
    if (msg.action === "captchaDetected") {
      addLog("⚠ CAPTCHA detectat! Auto-import oprit.", "error");
    } else {
      addLog("Auto-import finalizat.", "success");
    }
    stopAutoImport();
  }
}

// ─── Update Stats Display ────────────────────
function updateStats() {
  $("stat-found").textContent = sessionStats.found;
  $("stat-imported").textContent = sessionStats.imported;
  $("stat-remaining").textContent = sessionStats.remaining;
}

// ─── Add Log Entry ───────────────────────────
function addLog(text, type = "info") {
  const log = $("log");
  const div = document.createElement("div");
  div.className = `log-${type}`;
  div.textContent = `[${new Date().toLocaleTimeString("ro-RO")}] ${text}`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

// ─── LinkedIn DOM Extraction Function ────────
// This runs in the context of the LinkedIn page
function extractLinkedInProspects() {
  const prospects = [];
  const seen = new Set();

  // Search results page
  const searchCards = document.querySelectorAll(".reusable-search__result-container, .search-result__wrapper, li.reusable-search-simple-insight");
  searchCards.forEach((card) => {
    const data = extractFromSearchCard(card);
    if (data && !seen.has(data.profileUrl)) {
      seen.add(data.profileUrl);
      prospects.push(data);
    }
  });

  // People also viewed / suggestions
  const suggestionCards = document.querySelectorAll(".pv-browsemap-section__member-container, .artdeco-card li");
  suggestionCards.forEach((card) => {
    const data = extractFromSuggestionCard(card);
    if (data && !seen.has(data.profileUrl)) {
      seen.add(data.profileUrl);
      prospects.push(data);
    }
  });

  // Single profile page
  if (window.location.pathname.match(/^\/in\//)) {
    const data = extractFromProfilePage();
    if (data && !seen.has(data.profileUrl)) {
      prospects.push(data);
    }
  }

  return prospects;

  function extractFromSearchCard(card) {
    try {
      const linkEl = card.querySelector("a.app-aware-link[href*='/in/'], a[href*='/in/']");
      if (!linkEl) return null;

      const profileUrl = linkEl.href.split("?")[0].replace(/\/$/, "");
      const nameEl = card.querySelector(".entity-result__title-text a span[aria-hidden='true'], .actor-name, .entity-result__title-line span");
      const headlineEl = card.querySelector(".entity-result__primary-subtitle, .entity-result__summary, .subline-level-1");
      const locationEl = card.querySelector(".entity-result__secondary-subtitle, .subline-level-2");
      const imgEl = card.querySelector("img.presence-entity__image, img.EntityPhoto-circle-4, img[data-delayed-url]");

      const fullName = nameEl?.textContent?.trim() || "";
      if (!fullName || fullName === "LinkedIn Member") return null;

      const headline = headlineEl?.textContent?.trim() || "";
      const parts = headline.split(" at | la | @ | - | chez ");
      const title = parts[0]?.trim() || headline;
      const company = parts[1]?.trim() || "";

      return {
        fullName,
        headline: title,
        company: company || null,
        location: locationEl?.textContent?.trim() || null,
        profileUrl,
        profileImageUrl: imgEl?.src || null,
      };
    } catch { return null; }
  }

  function extractFromSuggestionCard(card) {
    try {
      const linkEl = card.querySelector("a[href*='/in/']");
      if (!linkEl) return null;

      const profileUrl = linkEl.href.split("?")[0].replace(/\/$/, "");
      const nameEl = card.querySelector(".artdeco-entity-lockup__title, .name, h3");
      const subtitleEl = card.querySelector(".artdeco-entity-lockup__subtitle, .headline");

      const fullName = nameEl?.textContent?.trim() || "";
      if (!fullName || fullName === "LinkedIn Member") return null;

      return {
        fullName,
        headline: subtitleEl?.textContent?.trim() || null,
        company: null,
        location: null,
        profileUrl,
        profileImageUrl: null,
      };
    } catch { return null; }
  }

  function extractFromProfilePage() {
    try {
      const profileUrl = window.location.href.split("?")[0].replace(/\/$/, "");
      const nameEl = document.querySelector("h1.text-heading-xlarge, h1.pv-text-details--left-aligned, .pv-top-card--list li:first-child");
      const headlineEl = document.querySelector(".text-body-medium.break-words, .pv-top-card--list-bullet .text-body-small");
      const locationEl = document.querySelector(".text-body-small.inline.t-black--light.break-words, span.distance-badge");
      const imgEl = document.querySelector("img.pv-top-card-profile-picture__image, img.profile-photo-edit__preview");

      const fullName = nameEl?.textContent?.trim() || "";
      if (!fullName) return null;

      return {
        fullName,
        headline: headlineEl?.textContent?.trim() || null,
        company: null,
        location: locationEl?.textContent?.trim() || null,
        profileUrl,
        profileImageUrl: imgEl?.src || null,
      };
    } catch { return null; }
  }
}
