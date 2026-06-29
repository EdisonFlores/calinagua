import { loadAllData } from "./data-service.js?v=35";
import { initMap } from "./map-service.js?v=35";
import { loadCharts } from "./chart-service.js?v=35";
import { initClock } from "./clock-service.js?v=35";
import { initWeather } from "./weather-service.js?v=35";
import { initTheme } from "./theme-service.js?v=35";
import { initI18n } from "./i18n-service.js?v=35";
import { initTutorial } from "./tutorial-service.js?v=35";
import { initVoiceAssistant } from "./voice-service.js?v=35";
import { state } from "./state.js?v=35";
import { initUi, renderApp } from "./ui-service.js?v=35";
import { t } from "./i18n-service.js?v=35";

async function bootstrap() {
  configurePageMode();
  initTheme();
  initClock();
  initI18n(() => {
    renderApp();
    updateConnectivityStatus();
  });
  initTutorial();
  initVoiceAssistant();
  initConnectivityStatus();
  initMap();
  initUi();

  const [{ biologicos, fisicoquimicos, criteria }] = await Promise.all([loadAllData(), initWeather()]);

  state.data.biologicos = biologicos;
  state.data.fisicoquimicos = fisicoquimicos;
  state.criteria = criteria;

  renderApp();
  loadCharts().then(() => renderApp());
  registerServiceWorker();
}

function configurePageMode() {
  const page = document.body.dataset.page || "principal";
  state.activeView = page;

  if (page === "fisicoquimicos") {
    state.dataset = "fisicoquimicos";
  }

  if (page === "biologicos") {
    state.dataset = "biologicos";
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
}

function initConnectivityStatus() {
  const banner = document.createElement("div");
  banner.className = "connectivity-banner";
  banner.setAttribute("role", "status");
  banner.setAttribute("aria-live", "polite");
  document.body.appendChild(banner);

  window.addEventListener("online", updateConnectivityStatus);
  window.addEventListener("offline", updateConnectivityStatus);
  updateConnectivityStatus();
}

function updateConnectivityStatus() {
  const banner = document.querySelector(".connectivity-banner");
  if (!banner) return;

  const isOnline = navigator.onLine;
  banner.classList.toggle("is-offline", !isOnline);
  banner.classList.toggle("is-online", isOnline);
  banner.innerHTML = `
    <i class="bi ${isOnline ? "bi-wifi" : "bi-wifi-off"}"></i>
    <span>${isOnline ? t("onlineStatus") : t("offlineStatus")}</span>
  `;
}

bootstrap().catch((error) => {
  console.error(error);
  document.querySelector(".content-grid").innerHTML = `
    <section class="panel">
      <div class="empty-state">
        <i class="bi bi-exclamation-triangle"></i>
        <p>${t("loadError")}</p>
      </div>
    </section>
  `;
});









