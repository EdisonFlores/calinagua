import { DATASETS } from "./config.js?v=35";
import {
  filterAndSortData,
  getAvailableCriteria,
  parseNumber,
  summarizeFisicoquimicos,
  uniqueValues,
  uniqueYears
} from "./data-service.js?v=35";
import { focusRecord, invalidateMap, renderMapPoints } from "./map-service.js?v=35";
import { drawOverviewCharts, drawRecordCharts } from "./chart-service.js?v=35";
import { state } from "./state.js?v=35";
import { t, translateField } from "./i18n-service.js?v=35";

const viewTitleKeys = {
  principal: "principal",
  fisicoquimicos: "physicochemical",
  biologicos: "biological"
};

export function initUi() {
  bindNavigation();
  bindFilters();
}

export function renderApp() {
  syncDatasetWithView();
  renderNavigation();
  renderFilters();
  renderDashboard();
  invalidateMap();
}

function bindNavigation() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.view !== state.activeView) {
        window.location.href = `${button.dataset.view}/`;
        return;
      }

      state.activeView = button.dataset.view;
      state.selectedRecord = null;
      renderApp();
    });
  });

  document.getElementById("sidebarToggle").addEventListener("click", () => {
    document.querySelector(".app-shell").classList.toggle("sidebar-collapsed");
    invalidateMap();
  });
}

function bindFilters() {
  document.getElementById("datasetSelect").addEventListener("change", (event) => {
    state.dataset = event.target.value;
    state.filters.river = "";
    state.filters.point = "";
    state.filters.year = "";
    state.filters.sortBy = "";
    state.selectedRecord = null;
    renderApp();
  });

  document.getElementById("riverSelect").addEventListener("change", (event) => {
    state.filters.river = event.target.value;
    state.filters.point = "";
    state.filters.year = "";
    state.selectedRecord = null;
    renderFilters();
    renderDashboard();
  });

  document.getElementById("pointSelect").addEventListener("change", (event) => {
    state.filters.point = event.target.value;
    state.filters.year = "";
    state.selectedRecord = null;
    renderFilters();
    renderDashboard();
  });

  document.getElementById("yearSelect").addEventListener("change", (event) => {
    state.filters.year = event.target.value;
    state.selectedRecord = null;
    renderDashboard();
  });

  document.getElementById("sortSelect").addEventListener("change", (event) => {
    state.filters.sortBy = event.target.value;
    renderDashboard();
  });

  document.getElementById("orderSelect").addEventListener("change", (event) => {
    state.filters.order = event.target.value;
    renderDashboard();
  });

  document.getElementById("resetFilters").addEventListener("click", () => {
    state.filters.river = "";
    state.filters.point = "";
    state.filters.year = "";
    state.filters.sortBy = "";
    state.filters.order = "asc";
    state.selectedRecord = null;
    renderApp();
  });

  window.addEventListener("resize", () => {
    renderCurrentCharts();
    invalidateMap();
  });
}

function syncDatasetWithView() {
  if (state.activeView === "fisicoquimicos") state.dataset = "fisicoquimicos";
  if (state.activeView === "biologicos") state.dataset = "biologicos";
  document.getElementById("datasetSelect").value = state.dataset;

  const datasetField = document.getElementById("datasetSelect").closest(".form-label");
  if (datasetField) {
    datasetField.style.display = state.activeView === "principal" ? "" : "none";
  }
}

function renderNavigation() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.activeView);
  });

  document.getElementById("viewTitle").textContent = t(viewTitleKeys[state.activeView]);
}

function renderFilters() {
  const data = state.data[state.dataset];
  const rivers = uniqueValues(data, "RIO");
  const riverSelect = document.getElementById("riverSelect");
  riverSelect.innerHTML = `<option value="">${t("allRivers")}</option>${rivers
    .map((river) => `<option value="${escapeHtml(river)}">${escapeHtml(river)}</option>`)
    .join("")}`;
  riverSelect.value = state.filters.river;

  const pointBase = state.filters.river ? data.filter((item) => item.RIO === state.filters.river) : data;
  const points = uniqueValues(pointBase, "PUNTO");
  const pointSelect = document.getElementById("pointSelect");
  const pointField = pointSelect.closest(".form-label");
  pointSelect.innerHTML = `<option value="">${t("allPoints")}</option>${points
    .map((point) => `<option value="${escapeHtml(point)}">${escapeHtml(point)}</option>`)
    .join("")}`;
  pointSelect.value = state.filters.point;
  pointField.classList.toggle(
    "filter-hidden",
    state.activeView === "principal" || (state.activeView !== "principal" && !state.filters.river)
  );

  const yearBase = pointBase.filter((item) => !state.filters.point || item.PUNTO === state.filters.point);
  const years = uniqueYears(yearBase);
  const yearSelect = document.getElementById("yearSelect");
  const yearField = yearSelect.closest(".form-label");
  yearSelect.innerHTML = `<option value="">${t("allYears")}</option>${years
    .map((year) => `<option value="${escapeHtml(year)}">${escapeHtml(year)}</option>`)
    .join("")}`;
  yearSelect.value = state.filters.year;
  yearField.classList.toggle(
    "filter-hidden",
    state.activeView === "principal" || (state.activeView !== "principal" && !state.filters.point)
  );

  const sortSelect = document.getElementById("sortSelect");
  const sortField = sortSelect.closest(".form-label");
  sortSelect.innerHTML = `<option value="">${t("noSpecificOrder")}</option>${DATASETS[state.dataset].sortableFields
    .map((field) => `<option value="${escapeHtml(field)}">${escapeHtml(translateField(field))}</option>`)
    .join("")}`;
  sortSelect.value = state.filters.sortBy;
  document.getElementById("orderSelect").value = state.filters.order;
  sortField.classList.toggle("filter-hidden", state.activeView !== "principal");
  document.getElementById("orderSelect").closest(".form-label").classList.toggle("filter-hidden", state.activeView !== "principal");
}

function renderDashboard() {
  const data = getVisibleData();
  renderKpis();
  renderParameterInfo();
  renderTable(data);
  renderMapPoints(data, selectRecord);
  renderDetails();
  renderCurrentCharts(data);
  document.getElementById("tableCount").textContent = t("rowCount", { count: data.length });
  document.getElementById("tableTitle").textContent = state.activeView === "principal" ? t("dataFromRiver") : t("filteredTable");
}

function renderParameterInfo() {
  const title = document.getElementById("infoPanelTitle");
  const grid = document.getElementById("parameterInfoGrid");
  if (!title || !grid) return;

  const items = state.dataset === "fisicoquimicos" ? fisicoInfoItems() : bioInfoItems();
  title.textContent = state.dataset === "fisicoquimicos" ? t("physicochemicalCriteria") : t("biologicalReading");

  grid.innerHTML = items
    .map(
      (item) => `
        <article class="info-card ${item.tone}">
          <i class="bi ${item.icon}"></i>
          <div>
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.text)}</p>
          </div>
        </article>
      `
    )
    .join("");
}

function getVisibleData() {
  return filterAndSortData(state.data[state.dataset], state.filters);
}

function renderKpis() {
  const fisico = state.data.fisicoquimicos;
  const rivers = uniqueValues([...state.data.biologicos, ...fisico], "RIO");
  const points = uniqueValues([...state.data.biologicos, ...fisico], "PUNTO");
  const summary = summarizeFisicoquimicos(fisico);

  document.getElementById("kpiRivers").textContent = rivers.length;
  document.getElementById("kpiPoints").textContent = points.length;
  document.getElementById("kpiNsf").textContent = summary.avgNsf ? summary.avgNsf.toFixed(1) : "--";
  document.getElementById("kpiClass").textContent = summary.predominantClass;
}

function renderTable(data) {
  const table = document.getElementById("dataTable");
  const fields = DATASETS[state.dataset].tableFields;

  table.querySelector("thead").innerHTML = `<tr>${fields.map((field) => `<th>${escapeHtml(tableHeader(field))}</th>`).join("")}</tr>`;
  table.querySelector("tbody").innerHTML = data
    .map((record) => {
      const selected = state.selectedRecord?.ID === record.ID && state.selectedRecord?.PUNTO === record.PUNTO;
      return `<tr class="${selected ? "selected-row" : ""}" data-id="${escapeHtml(record.ID)}" data-point="${escapeHtml(record.PUNTO)}">
        ${fields.map((field) => `<td>${formatCell(record, field)}</td>`).join("")}
      </tr>`;
    })
    .join("");

  table.classList.toggle("table-readonly", state.activeView !== "principal");
  if (state.activeView !== "principal") return;

  table.querySelectorAll("tbody tr").forEach((row) => {
    row.addEventListener("click", () => {
      const record = data.find((item) => item.ID === row.dataset.id && item.PUNTO === row.dataset.point);
      if (record) selectRecord(record);
    });
  });
}

function tableHeader(field) {
  if (field === "FECHA") return t("date");
  if (field === "PUNTO") return t("point");
  if (field === "RIO") return t("river");
  return translateField(field);
}

function selectRecord(record) {
  state.selectedRecord = record;
  focusRecord(record);
  renderTable(getVisibleData());
  renderDetails();
  renderCurrentCharts();
}

function renderDetails() {
  const badge = document.getElementById("selectedBadge");
  const title = document.getElementById("detailTitle");
  const content = document.getElementById("detailContent");
  const record = state.selectedRecord;

  if (!record) {
    badge.textContent = t("noSelection");
    title.textContent = t("selectRecord");
    content.className = "detail-content empty-state";
    content.innerHTML = `<i class="bi bi-cursor"></i><p>${escapeHtml(t("selectRecordHint"))}</p>`;
    return;
  }

  badge.textContent = `${record.RIO || "--"} / ${record.PUNTO || "--"}`;
  title.textContent = `${record.RIO || t("river")} - ${record.PUNTO || t("point")}`;
  content.className = "detail-content selected-summary";
  content.innerHTML = state.dataset === "fisicoquimicos" ? renderFisicoDetail(record) : renderBioDetail(record);
}

function renderFisicoDetail(record) {
  const criteria = getAvailableCriteria(state.criteria, record);
  const rows = criteria
    .map((criterion) => {
      const value = parseNumber(record[criterion.campo_csv]);
      const status = evaluateCriterion(value, criterion);
      return `<div class="criteria-row">
        <div>
          <strong>${escapeHtml(translateField(criterion.campo_csv))}</strong>
          <small class="d-block">${t("registered")}: ${escapeHtml(record[criterion.campo_csv] || "--")} ${escapeHtml(criterion.unidad || "")} | ${t("criterion")}: ${escapeHtml(criterion.criterio)}</small>
        </div>
        <span class="quality-badge ${status.className}">${status.label}</span>
      </div>`;
    })
    .join("");

  return `
    <div class="summary-grid">
      ${summaryItem(t("classification"), record.Clasificacion || "--")}
      ${summaryItem("NSF", record["CALIDAD AGUA NSF"] || "--")}
      ${summaryItem(t("date"), record.FECHA || "--")}
      ${summaryItem(t("point"), record.PUNTO || "--")}
    </div>
    <div>
      <h3 class="h6 fw-bold mb-2">${t("availablePhysicochemicalCriteria")}</h3>
      <div class="criteria-list">${rows}</div>
    </div>
  `;
}

function renderBioDetail(record) {
  return `
    <div class="summary-grid">
      ${summaryItem(t("qualityShannon"), record["CALIDAD DEL AGUA SEGUN SHANNON"] || "--")}
      ${summaryItem("BMWP/Col", record["INDICE BMWP/Col"] || "--")}
      ${summaryItem(t("absoluteRichness"), record["RIQUEZA ABSOLUTA"] || "--")}
      ${summaryItem(t("shannonDiversity"), record["DIVERSIDAD SEGUN SHANNON"] || "--")}
      ${summaryItem(t("date"), record.FECHA || "--")}
      ${summaryItem(t("point"), record.PUNTO || "--")}
    </div>
  `;
}

function renderCurrentCharts(data = getVisibleData()) {
  document.getElementById("chartPanelTitle").textContent =
    state.dataset === "fisicoquimicos" ? t("physicochemicalCharts") : t("biologicalCharts");

  if (state.selectedRecord) {
    drawRecordCharts(state.dataset, state.selectedRecord);
    return;
  }

  drawOverviewCharts(state.dataset, data);
}

function evaluateCriterion(value, criterion) {
  if (value === null) return { label: t("noDataShort"), className: "quality-warn" };
  const min = parseNumber(criterion.limite_min);
  const max = parseNumber(criterion.limite_max);

  if (criterion.tipo === "rango") {
    return value >= min && value <= max
      ? { label: t("complies"), className: "quality-ok" }
      : { label: t("review"), className: "quality-bad" };
  }

  if (criterion.tipo === "mínimo") {
    return value >= min ? { label: t("complies"), className: "quality-ok" } : { label: t("review"), className: "quality-bad" };
  }

  if (criterion.tipo === "máximo") {
    return value <= max ? { label: t("complies"), className: "quality-ok" } : { label: t("review"), className: "quality-bad" };
  }

  return { label: t("see"), className: "quality-warn" };
}

function formatCell(record, field) {
  const value = record[field] ?? "";
  if (field === "Clasificacion" || field.includes("CALIDAD")) {
    return `<span class="quality-badge quality-warn">${escapeHtml(value)}</span>`;
  }
  return escapeHtml(value);
}

function summaryItem(label, value) {
  return `<div class="summary-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function fisicoInfoItems() {
  return [
    {
      title: "pH",
      icon: "bi-activity",
      tone: "info-neutral",
      text: t("phInfo")
    },
    {
      title: t("fieldOxigeno"),
      icon: "bi-droplet",
      tone: "info-good",
      text: t("dissolvedOxygenInfo")
    },
    {
      title: t("nutrientsInfoTitle"),
      icon: "bi-exclamation-triangle",
      tone: "info-warn",
      text: t("nutrientsInfo")
    },
    {
      title: t("limitsInfoTitle"),
      icon: "bi-shield-exclamation",
      tone: "info-bad",
      text: t("limitsInfo")
    }
  ];
}

function bioInfoItems() {
  return [
    {
      title: t("cleanLevels"),
      icon: "bi-check-circle",
      tone: "info-good",
      text: t("cleanLevelsInfo")
    },
    {
      title: t("pollutedLevels"),
      icon: "bi-exclamation-octagon",
      tone: "info-bad",
      text: t("pollutedLevelsInfo")
    },
    {
      title: "Shannon",
      icon: "bi-bar-chart-line",
      tone: "info-neutral",
      text: t("shannonInfo")
    },
    {
      title: "BMWP/Col",
      icon: "bi-pie-chart",
      tone: "info-good",
      text: t("bmwpRichnessInfo")
    }
  ];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

