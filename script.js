const appsData = [
        {
                name: "Workout",
                icon: "https://github.com/its-ash/workout/blob/master/public/icon.svg?raw=true",
                link: "https://its-ash.github.io/workout/"
        },
        {
                name: "Time Track",
                icon: "https://github.com/its-ash/time-track/blob/main/public/favicon.png?raw=true",
                link: "https://its-ash.github.io/time-track/"
        },
        {
                name: "Bulk Uninstaller",
                icon: "https://github.com/its-ash/bulk-uninstaller/blob/main/logo.png?raw=true",
                link: "https://github.com/its-ash/bulk-uninstaller/releases/download/build-3-e552b0bf2782d6b4a6a18e4baff8fa05d0d66031/app-release.apk"
        },
];

const elements = {
        searchInput: document.getElementById("searchInput"),
        appsContainer: document.getElementById("appsContainer"),
        detailModal: document.getElementById("detailModal"),
        closeBtn: document.querySelector(".close-btn"),
        installBtn: document.getElementById("installBtn"),
        shareBtn: document.getElementById("shareBtn")
};

let filteredApps = [];
let activeApp = null;

function getInitials(name) {
        return (name || "APP")
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((word) => word[0].toUpperCase())
                .join("") || "APP";
}

function isIconUrl(icon) {
        return typeof icon === "string" && /^(https?:\/\/|data:image\/)/i.test(icon);
}

function renderIconMarkup(app) {
        const fallbackText = getInitials(app.name);
        if (!isIconUrl(app.icon)) {
                return app.icon || fallbackText;
        }

        return `<img src="${app.icon}" alt="${app.name} icon" loading="lazy" onerror="this.remove(); this.parentElement.textContent='${fallbackText}';" />`;
}

function normalizeApps(data) {
        return data.map((app, index) => ({
                id: index,
                name: app.name,
                icon: app.icon || "APP",
                link: app.link,
                developer: app.developer || "Ash Store",
                rating: app.rating || 4.5,
                downloads: app.downloads || 0,
                description: app.description || "Install this Android app from Ash Store."
        }));
}

const allApps = normalizeApps(appsData);

function renderApps(apps) {
        if (!apps.length) {
                elements.appsContainer.innerHTML = '<p class="placeholder">No apps available.</p>';
                return;
        }

        elements.appsContainer.innerHTML = apps
                .map(
                        (app) => `
      <article class="app-card" data-app-id="${app.id}">
                                <div class="app-icon">${renderIconMarkup(app)}</div>
                                <div class="app-meta">
                                        <h3>${app.name}</h3>
                                        <p>${app.developer}</p>
                                        <div class="app-rating">${Number(app.rating).toFixed(1)} ★</div>
                                </div>
                                <button class="btn-primary install-btn" data-app-id="${app.id}" type="button"><span>Install</span></button>
      </article>
    `
                )
                .join("");
}

function openModal(app) {
        activeApp = app;
        document.getElementById("modalTitle").textContent = app.name;
        document.getElementById("modalIcon").innerHTML = renderIconMarkup(app);
        document.getElementById("modalVersion").textContent = app.developer;
        document.getElementById("modalRating").textContent = `⭐ ${Number(app.rating).toFixed(1)}`;
        document.getElementById("modalDownloads").textContent = `${Number(app.downloads).toLocaleString()} downloads`;
        document.getElementById("modalDescription").textContent = app.description;
        document.getElementById("modalDetails").innerHTML = `
    <div class="detail-item"><strong>Store</strong><span>Ash Store</span></div>
    <div class="detail-item"><strong>Developer</strong><span>${app.developer}</span></div>
    <div class="detail-item"><strong>Link</strong><span>GitHub/Direct APK</span></div>
  `;
        elements.detailModal.classList.add("show");
}

function closeModal() {
        elements.detailModal.classList.remove("show");
}

function installAppById(appId) {
        const app = allApps.find((item) => item.id === Number(appId));
        if (!app || !app.link) {
                return;
        }
        window.open(app.link, "_blank", "noopener");
}

function shareActiveApp() {
        if (!activeApp) {
                return;
        }
        const text = `${activeApp.name} on Ash Store: ${activeApp.link}`;
        if (navigator.share) {
                navigator.share({ title: activeApp.name, text, url: activeApp.link });
                return;
        }
        navigator.clipboard.writeText(text);
        alert("App link copied to clipboard");
}

function filterAndRender() {
        const query = (elements.searchInput?.value || "").trim().toLowerCase();
        filteredApps = allApps.filter(
                (app) => app.name.toLowerCase().includes(query) || app.developer.toLowerCase().includes(query)
        );
        renderApps(filteredApps);
}

function bindEvents() {
        if (elements.searchInput) {
                elements.searchInput.addEventListener("input", filterAndRender);
        }
        elements.closeBtn.addEventListener("click", closeModal);
        elements.installBtn.addEventListener("click", () => {
                if (activeApp) {
                        installAppById(activeApp.id);
                }
        });
        elements.shareBtn.addEventListener("click", shareActiveApp);

        window.addEventListener("click", (event) => {
                if (event.target === elements.detailModal) {
                        closeModal();
                        return;
                }

                const card = event.target.closest("[data-app-id]");
                if (!card) {
                        return;
                }

                const appId = card.getAttribute("data-app-id");
                const app = allApps.find((item) => item.id === Number(appId));
                if (!app) {
                        return;
                }

                if (event.target.classList.contains("install-btn")) {
                        installAppById(appId);
                        return;
                }

                openModal(app);
        });
}

function init() {
        filteredApps = [...allApps];
        renderApps(filteredApps);
        bindEvents();
}

init();
