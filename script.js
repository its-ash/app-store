const APP_REPOS = [
  "https://github.com/its-ash/authenticator",
  "https://github.com/its-ash/sms-clear"
];

const CATEGORY_KEYWORDS = {
  "CLI Tools": ["cli", "terminal", "shell", "command", "script", "automation"],
  "Web Apps": ["web", "dashboard", "frontend", "ui", "browser", "pwa"],
  "Productivity": ["productivity", "notes", "tasks", "todo", "kanban", "tracker", "time"],
  "AI & ML": ["ai", "ml", "machine-learning", "llm", "prompt", "vector", "embedding", "model"],
  "Dev Tools": ["dev", "developer", "lint", "schema", "api", "debug", "testing", "ci"],
  "Utilities": ["utility", "clipboard", "manager", "tool", "launcher", "uninstaller"],
  "Health & Fitness": ["workout", "fitness", "health", "exercise", "gym"],
};

const LANGUAGE_FALLBACK = {
  Go: "Go", Rust: "Rust", Python: "Python", TypeScript: "TypeScript",
  JavaScript: "JavaScript", Swift: "Swift", Kotlin: "Kotlin", "C++": "C++",
  C: "C", Java: "Java", Dart: "Dart", HTML: "HTML", CSS: "CSS", Shell: "Shell",
};

const STAR_SVG = '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z"/></svg>';
const FALLBACK_ICONS = ["$_", "λ", "#!", "{}", "::", "~/", "◯", "◇", "▦", "▷"];

const elements = {
  searchInput: document.getElementById("searchInput"),
  appsContainer: document.getElementById("appsContainer"),
  categoryBar: document.getElementById("categoryBar"),
  detailModal: document.getElementById("detailModal"),
  closeBtn: document.querySelector(".close-btn"),
  installBtn: document.getElementById("installBtn"),
  shareBtn: document.getElementById("shareBtn"),
  repoLink: document.getElementById("repoLink"),
};

let allApps = [];
let filteredApps = [];
let activeApp = null;
let activeCategory = "All";
let activeSort = "updated";
let activeView = "grid";

function getInitials(name) {
  return (name || "APP")
    .split(/[\s-_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "APP";
}

function isIconUrl(icon) {
  return typeof icon === "string" && /^(https?:\/\/|data:image\/)/i.test(icon);
}

function renderIconMarkup(app, fallbackIndex = 0) {
  const fallback = isIconUrl(app.icon) ? getInitials(app.name) : (app.icon || FALLBACK_ICONS[fallbackIndex % FALLBACK_ICONS.length]);
  if (!isIconUrl(app.icon)) {
    return fallback;
  }
  return `<img src="${app.icon}" alt="${app.name} icon" loading="lazy" onerror="this.remove(); this.parentElement.textContent='${fallback}';" />`;
}

function inferCategory(topics, language, repoName) {
  const haystack = [...(topics || []), repoName || ""].join(" ").toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => haystack.includes(kw))) {
      return category;
    }
  }
  if (language) {
    const lang = language.toLowerCase();
    if (lang === "go" || lang === "rust" || lang === "shell") return "CLI Tools";
    if (lang === "typescript" || lang === "javascript" || lang === "html") return "Web Apps";
    if (lang === "swift" || lang === "kotlin") return "Utilities";
    if (lang === "python") return "AI & ML";
  }
  return "Dev Tools";
}

function formatStars(count) {
  if (count >= 1000) return (count / 1000).toFixed(1) + "k";
  return String(count);
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

async function fetchRepoData(owner, repo) {
  const base = `https://api.github.com/repos/${owner}/${repo}`;
  try {
    const [repoRes, topicsRes] = await Promise.all([
      fetch(base, { headers: { Accept: "application/vnd.github+json" } }),
      fetch(`${base}/topics`, { headers: { Accept: "application/vnd.github.mercy-preview+json" } }),
    ]);

    if (!repoRes.ok) throw new Error(`GitHub API ${repoRes.status}`);
    const repoData = await repoRes.json();
    let topics = [];
    if (topicsRes.ok) {
      const topicsData = await topicsRes.json();
      topics = topicsData.names || [];
    }

    let icon = null;
    for (const candidate of [
      `https://raw.githubusercontent.com/${owner}/${repo}/${repoData.default_branch}/public/icon.svg`,
      `https://raw.githubusercontent.com/${owner}/${repo}/${repoData.default_branch}/public/favicon.png`,
      `https://raw.githubusercontent.com/${owner}/${repo}/${repoData.default_branch}/icon.svg`,
      `https://raw.githubusercontent.com/${owner}/${repo}/${repoData.default_branch}/logo.png`,
      `https://raw.githubusercontent.com/${owner}/${repo}/${repoData.default_branch}/assets/icon.png`,
    ]) {
      try {
        const probe = await fetch(candidate, { method: "HEAD" });
        if (probe.ok) { icon = candidate; break; }
      } catch {}
    }

    return {
      name: repoData.name || repo,
      description: repoData.description || "No description available.",
      language: LANGUAGE_FALLBACK[repoData.language] || repoData.language || "—",
      stars: repoData.stargazers_count || 0,
      updated: repoData.updated_at,
      topics,
      htmlUrl: repoData.html_url,
      owner: repoData.owner?.login || owner,
      icon,
    };
  } catch (err) {
    console.warn(`Failed to fetch ${owner}/${repo}:`, err.message);
    return {
      name: repo,
      description: "Unable to fetch metadata from GitHub.",
      language: "—",
      stars: 0,
      updated: null,
      topics: [],
      htmlUrl: `https://github.com/${owner}/${repo}`,
      owner,
      icon: null,
    };
  }
}

function parseRepoEntry(entry) {
  if (typeof entry === "string") {
    const m = entry.match(/^https?:\/\/github\.com\/([^/]+)\/([^/?#]+)/i);
    if (!m) return null;
    return { owner: m[1], repo: m[2], link: null };
  }
  return { owner: entry.owner, repo: entry.repo, link: entry.link || null };
}

function guessInstallLink(owner, repo, repoData) {
  const pagesUrl = `https://${owner}.github.io/${repo}/`;
  return pagesUrl;
}

async function loadApps() {
  elements.appsContainer.innerHTML = '<div class="loading">Fetching repo data from GitHub...</div>';
  const entries = APP_REPOS.map(parseRepoEntry).filter(Boolean);
  const results = await Promise.all(
    entries.map((entry, i) =>
      fetchRepoData(entry.owner, entry.repo).then((data) => ({
        ...data,
        id: i,
        link: entry.link || guessInstallLink(entry.owner, entry.repo, data),
        category: inferCategory(data.topics, data.language, data.name),
      }))
    )
  );
  allApps = results;
  buildCategoryBar();
  filterAndRender();
}

function buildCategoryBar() {
  const counts = { All: allApps.length };
  allApps.forEach((app) => {
    counts[app.category] = (counts[app.category] || 0) + 1;
  });
  const categories = Object.keys(counts).sort((a, b) =>
    a === "All" ? -1 : b === "All" ? 1 : a.localeCompare(b)
  );
  elements.categoryBar.innerHTML = categories
    .map(
      (cat) =>
        `<button class="cat-pill ${cat === activeCategory ? "active" : ""}" data-category="${cat}" type="button">${cat} <span class="cat-count">(${counts[cat]})</span></button>`
    )
    .join("");
  elements.categoryBar.querySelectorAll(".cat-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      activeCategory = pill.dataset.category;
      elements.categoryBar.querySelectorAll(".cat-pill").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      filterAndRender();
    });
  });
}

function sortApps(apps) {
  const sorted = [...apps];
  if (activeSort === "stars") sorted.sort((a, b) => b.stars - a.stars);
  else if (activeSort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
  else sorted.sort((a, b) => new Date(b.updated || 0) - new Date(a.updated || 0));
  return sorted;
}

function renderApps(apps) {
  if (!apps.length) {
    elements.appsContainer.innerHTML = '<div class="placeholder">No apps match your filter.</div>';
    return;
  }
  elements.appsContainer.innerHTML = apps
    .map(
      (app, i) => `
      <article class="app-card" data-app-id="${app.id}">
        <div class="app-card-top">
          <div class="app-icon">${renderIconMarkup(app, i)}</div>
          <span class="app-category">${app.category}</span>
        </div>
        <div class="app-info">
          <h3 class="app-name">${app.name}</h3>
          <p class="app-desc">${app.description}</p>
        </div>
        <div class="app-footer">
          <span class="app-star">${STAR_SVG} ${formatStars(app.stars)}</span>
          <span>${app.language}</span>
          <span>${timeAgo(app.updated)}</span>
        </div>
        <a href="${app.htmlUrl}" class="app-link" target="_blank" rel="noopener">View on GitHub</a>
      </article>
    `
    )
    .join("");
}

function filterAndRender() {
  const query = (elements.searchInput?.value || "").trim().toLowerCase();
  filteredApps = allApps.filter((app) => {
    const matchesCategory = activeCategory === "All" || app.category === activeCategory;
    const matchesQuery = !query ||
      app.name.toLowerCase().includes(query) ||
      app.description.toLowerCase().includes(query) ||
      app.language.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });
  renderApps(sortApps(filteredApps));
}

function openModal(app) {
  activeApp = app;
  document.getElementById("modalTitle").textContent = app.name;
  document.getElementById("modalIcon").innerHTML = renderIconMarkup(app);
  document.getElementById("modalVersion").textContent = app.owner;
  document.getElementById("modalRating").textContent = `⭐ ${formatStars(app.stars)} stars`;
  document.getElementById("modalDownloads").textContent = app.language;
  document.getElementById("modalLanguage").textContent = `Updated ${timeAgo(app.updated)}`;
  document.getElementById("modalDescription").textContent = app.description;
  document.getElementById("modalDetails").innerHTML = `
    <div class="detail-item"><strong>Repository</strong><span>${app.owner}/${app.name}</span></div>
    <div class="detail-item"><strong>Language</strong><span>${app.language}</span></div>
    <div class="detail-item"><strong>Stars</strong><span>${app.stars.toLocaleString()}</span></div>
    <div class="detail-item"><strong>Topics</strong><span>${app.topics.length ? app.topics.join(", ") : "—"}</span></div>
    <div class="detail-item"><strong>Category</strong><span>${app.category}</span></div>
  `;
  elements.repoLink.href = `${app.htmlUrl}/releases/latest`;
  elements.detailModal.classList.add("show");
}

function closeModal() {
  elements.detailModal.classList.remove("show");
  activeApp = null;
}

function installAppById(appId) {
  const app = allApps.find((item) => item.id === Number(appId));
  if (!app || !app.link) return;
  window.open(app.link, "_blank", "noopener");
}

function shareActiveApp() {
  if (!activeApp) return;
  const text = `${activeApp.name} on Ash App Store: ${activeApp.htmlUrl}`;
  if (navigator.share) {
    navigator.share({ title: activeApp.name, text, url: activeApp.htmlUrl });
    return;
  }
  navigator.clipboard.writeText(text);
  alert("App link copied to clipboard");
}

function bindEvents() {
  if (elements.searchInput) {
    elements.searchInput.addEventListener("input", filterAndRender);
  }
  elements.closeBtn.addEventListener("click", closeModal);
  elements.installBtn.addEventListener("click", () => {
    if (activeApp) installAppById(activeApp.id);
  });
  elements.shareBtn.addEventListener("click", shareActiveApp);

  document.querySelectorAll(".sort-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeSort = btn.dataset.sort;
      document.querySelectorAll(".sort-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      filterAndRender();
    });
  });

  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeView = btn.dataset.view;
      document.querySelectorAll(".view-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      elements.appsContainer.classList.toggle("list-view", activeView === "list");
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && elements.detailModal.classList.contains("show")) closeModal();
    if (e.key === "/" && document.activeElement !== elements.searchInput) {
      e.preventDefault();
      elements.searchInput?.focus();
    }
  });

  window.addEventListener("click", (e) => {
    if (e.target === elements.detailModal) {
      closeModal();
      return;
    }
    const card = e.target.closest("[data-app-id]");
    if (!card) return;
    const appId = card.getAttribute("data-app-id");
    const app = allApps.find((item) => item.id === Number(appId));
    if (!app) return;
    if (e.target.classList.contains("app-link")) return;
    openModal(app);
  });
}

function init() {
  bindEvents();
  loadApps();
}

init();
