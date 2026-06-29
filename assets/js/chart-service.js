import { DATASETS, FISICO_REFERENCES } from "./config.js?v=35";
import { parseNumber } from "./data-service.js?v=35";
import { state } from "./state.js?v=35";
import { t, translateField } from "./i18n-service.js?v=35";

const chartsGridId = "chartsGrid";
const chartRenderers = new Map();
const parameterColors = { Temperatura:["#ef4444","#f97316"], Ph:["#2563eb","#22c55e","#f59e0b"], "Oxigeno disuelto":["#06b6d4","#0f766e"], Solidos_Totales:["#64748b","#94a3b8"], Nitratos:["#84cc16","#15803d"], Fosfatos:["#a855f7","#7c3aed"], Turbiedad:["#d97706","#92400e"], DBO5:["#dc2626","#991b1b"], "Coliformes fecales":["#be123c","#7f1d1d"], "CALIDAD AGUA NSF":["#0f766e","#22c55e"], Clasificacion:["#0f766e","#2563eb","#f59e0b","#dc2626","#111827"], "RIQUEZA ABSOLUTA":["#0f766e","#14b8a6"], "DIVERSIDAD SEGUN SHANNON":["#2563eb","#60a5fa"], "INDICE BMWP/Col":["#7c3aed","#a855f7"] };
const levelColors = { "Nivel 10":"#2563eb", "Nivel 9":"#2563eb", "Nivel 8":"#16a34a", "Nivel 7":"#16a34a", "Nivel 6":"#eab308", "Nivel 5":"#eab308", "Nivel 4":"#f97316", "Nivel 3":"#f97316", "Nivel 2":"#dc2626", "Nivel 1":"#dc2626" };
const syntheticCharts = { levelPie:"__BIO_LEVEL_PIE__", bioSummary:"__BIO_SUMMARY__", fisicoClassEvolution:"__FISICO_CLASS_EVOLUTION__", shannonQualityEvolution:"__BIO_SHANNON_QUALITY_EVOLUTION__", bmwpQualityEvolution:"__BIO_BMWP_QUALITY_EVOLUTION__" };

export function loadCharts() {
  return new Promise((resolve) => {
    if (!window.google?.charts) { resolve(false); return; }
    google.charts.load("current", { packages: ["corechart", "gauge"] });
    google.charts.setOnLoadCallback(() => { state.chartsReady = true; resolve(true); });
  });
}

export function drawOverviewCharts(dataset, data) {
  if (!state.chartsReady) return;
  const fields = getRenderableFields(dataset, data, null);
  prepareChartsGrid(fields);
  dataset === "fisicoquimicos" ? drawFisicoCharts(data, null, fields) : drawBioCharts(data, null, fields);
}

export function drawRecordCharts(dataset, record) {
  if (!state.chartsReady || !record) return;
  const fields = getRenderableFields(dataset, [record], record);
  prepareChartsGrid(fields);
  dataset === "fisicoquimicos" ? drawFisicoCharts([record], record, fields) : drawBioCharts([record], record, fields);
}

function prepareChartsGrid(fields) {
  const grid = document.getElementById(chartsGridId);
  chartRenderers.clear();
  if (!fields.length) { grid.innerHTML = ""; return; }
  grid.innerHTML = fields.map((field, index) =>
    '<div class="chart-box" id="chart-' + index + '">' +
      '<button class="chart-expand-button" type="button" data-chart-index="' + index + '" aria-label="' + t("expandChart") + '"><i class="bi bi-arrows-fullscreen"></i></button>' +
      '<div class="chart-visual" id="chart-visual-' + index + '"><div class="empty-state"><i class="bi bi-bar-chart"></i><p>' + escapeHtml(displayChartName(field)) + '</p></div></div>' +
    '</div>'
  ).join("");
}

function getRenderableFields(dataset, data, selectedRecord) {
  const fields = DATASETS[dataset].chartFields.filter((field) => {
    if (dataset === "biologicos" && state.activeView === "principal" && field.startsWith("Nivel")) return false;
    if (dataset === "biologicos" && state.activeView === "principal" && field === "RIQUEZA ABSOLUTA") return false;
    if (field === "Clasificacion") return data.some((record) => Boolean(record[field]));
    if (dataset === "biologicos" && field.startsWith("Nivel")) return data.some((record) => parseNumber(record[field]) > 0);
    if (selectedRecord) return parseNumber(selectedRecord[field]) !== null || Boolean(selectedRecord[field]);
    return data.some((record) => parseNumber(record[field]) !== null);
  });
  if (dataset === "biologicos" && state.activeView === "principal" && hasLevelData(data)) fields.push(syntheticCharts.levelPie);
  if (dataset === "biologicos" && state.activeView !== "principal") fields.push(syntheticCharts.bioSummary);
  if (dataset === "fisicoquimicos" && state.activeView !== "principal" && hasCategoryData(data, "Clasificacion")) fields.push(syntheticCharts.fisicoClassEvolution);
  if (dataset === "biologicos" && state.activeView !== "principal" && hasCategoryData(data, "CALIDAD DEL AGUA SEGUN SHANNON")) fields.push(syntheticCharts.shannonQualityEvolution);
  if (dataset === "biologicos" && state.activeView !== "principal" && hasCategoryData(data, "INDICE BMWP/Col.1")) fields.push(syntheticCharts.bmwpQualityEvolution);
  return fields;
}

function drawFisicoCharts(data, selectedRecord, fields) {
  fields.forEach((field, index) => {
    const element = document.getElementById("chart-" + index);
    if (field === "Clasificacion") { selectedRecord ? drawSingleCategory(element, field, selectedRecord[field]) : drawDistribution(element, data, field, t("fisicoClassDistribution")); return; }
    if (field === syntheticCharts.fisicoClassEvolution) { drawCategoryEvolution(element, data, "Clasificacion", t("fisicoClassEvolution"), index); return; }
    if (selectedRecord || state.activeView === "principal") { drawFisicoComparison(element, field, data, selectedRecord, index); return; }
    drawTimeSeries(element, data, field, t("inTime", { field: displayChartName(field) }), index);
  });
}

function drawBioCharts(data, selectedRecord, fields) {
  fields.forEach((field, index) => {
    const element = document.getElementById("chart-" + index);
    if (field === syntheticCharts.levelPie) { drawLevelPie(element, data, selectedRecord); return; }
    if (field === syntheticCharts.bioSummary) { drawBiologicalSummary(element, data); return; }
    if (field === syntheticCharts.shannonQualityEvolution) { drawCategoryEvolution(element, data, "CALIDAD DEL AGUA SEGUN SHANNON", t("shannonQualityEvolution"), index); return; }
    if (field === syntheticCharts.bmwpQualityEvolution) { drawCategoryEvolution(element, data, "INDICE BMWP/Col.1", t("bmwpQualityEvolution"), index); return; }
    if (selectedRecord || state.activeView === "principal") { drawBiologicalMetric(element, field, data, selectedRecord, index); return; }
    drawTimeSeries(element, data, field, t("inTime", { field: displayChartName(field) }), index);
  });
}

function drawFisicoComparison(element, field, data, selectedRecord, index) {
  const reference = FISICO_REFERENCES[field] || { label: t("reference"), value: null };
  const obtained = selectedRecord ? parseNumber(selectedRecord[field]) : average(data.map((record) => parseNumber(record[field])));
  if (obtained === null) { element.remove(); return; }
  renderGoogleChart(element, index, (target) => {
    const table = createTypedTable([t("type"), t("complies"), t("noComplies"), t("informative"), t("reference")], buildFisicoComparisonRows(field, obtained, reference));
    createComparisonChart(target, index).draw(table, { ...baseOptions(field, ["#16a34a", "#dc2626", "#2563eb", "#16a34a"]), legend: { position: "bottom" }, isStacked: false });
  });
  addChartInfo(element, buildFisicoInfo(field, obtained, reference));
}

function drawBiologicalMetric(element, field, data, selectedRecord, index) {
  if (field === "DIVERSIDAD SEGUN SHANNON") { drawBiologicalComparison(element, field, [[t("valueObtained"), getMetricValue(field, data, selectedRecord)], [t("optimal"), 3]], index); return; }
  if (field === "INDICE BMWP/Col") { drawBiologicalComparison(element, field, [[t("valueObtained"), getMetricValue(field, data, selectedRecord)], [t("minimumAcceptable"), 85], [t("maximum"), 100]], index); return; }
  drawSingleMetric(element, field, data, selectedRecord, index);
}

function drawBiologicalComparison(element, field, rows, index) {
  if (rows[0][1] === null) { element.remove(); return; }
  renderGoogleChart(element, index, (target) => {
    const table = createTypedTable([t("type"), t("complies"), t("noComplies"), t("informative"), t("reference")], buildBiologicalComparisonRows(field, rows));
    createComparisonChart(target, index).draw(table, { ...baseOptions(field, ["#16a34a", "#dc2626", "#2563eb", "#16a34a"]), legend: { position: "bottom" }, isStacked: false });
  });
  addChartInfo(element, buildBiologicalInfo(field, rows[0][1]));
}

function drawSingleMetric(element, field, data, selectedRecord, index) {
  const value = getMetricValue(field, data, selectedRecord);
  if (value === null) { element.remove(); return; }
  renderGoogleChart(element, index, (target) => {
    const table = google.visualization.arrayToDataTable([[t("parameter"), t("value")], [displayChartName(field), value]]);
    createMetricChart(target, index).draw(table, { ...baseOptions(field, colorsFor(field)), legend: { position: "none" } });
  });
  addChartInfo(element, buildMetricInfo(field, value));
}

function drawTimeSeries(element, data, field, title, index) {
  const grouped = aggregateByDate(data, field);
  if (!grouped.length) { element.remove(); return; }
  renderGoogleChart(element, index, (target) => {
    const table = google.visualization.arrayToDataTable([[t("date"), displayChartName(field)], ...grouped]);
    createTimeChart(target, index).draw(table, { ...baseOptions(title, colorsFor(field)), legend: { position: "none" }, curveType: index % 3 === 0 ? "function" : "none", areaOpacity: 0.18 });
  });
  addChartInfo(element, t("timeSeriesInfo", { field: displayChartName(field) }));
}

function drawCategoryEvolution(element, data, field, title, index) {
  const rows = categoryEvolutionRows(data, field);
  if (!rows.length) { element.remove(); return; }
  renderGoogleChart(element, index, (target) => {
    const table = google.visualization.arrayToDataTable([[t("date"), t("category"), { role: "tooltip", type: "string" }], ...rows.map((row) => [row.date, row.score, row.date + "\n" + translateField(field) + ": " + row.category])]);
    const chart = index % 2 === 0 ? new google.visualization.LineChart(target) : new google.visualization.AreaChart(target);
    chart.draw(table, { ...baseOptions(title, ["#7c3aed"]), chartArea: { width: "66%", height: "62%" }, legend: { position: "none" }, curveType: "function", vAxis: { ...baseOptions(title, ["#7c3aed"]).vAxis, ticks: categoryTicks(rows), format: "0" }, tooltip: { trigger: "focus" } });
  });
  addChartInfo(element, t("categoryEvolutionInfo", { title }));
}

function drawDistribution(element, data, field, title) {
  const counts = countValues(data, field);
  if (!counts.length) { element.remove(); return; }
  renderGoogleChart(element, null, (target) => {
    const table = google.visualization.arrayToDataTable([[displayChartName(field), t("registers")], ...counts]);
    new google.visualization.PieChart(target).draw(table, { ...baseOptions(title, colorsFor(field)), pieHole: 0.45 });
  });
  addChartInfo(element, t("distributionInfo", { field: displayChartName(field) }));
}

function drawSingleCategory(element, field, value) {
  if (!value) { element.remove(); return; }
  chartTarget(element).innerHTML = '<div class="chart-note"><span>' + escapeHtml(displayChartName(field)) + '</span><strong>' + escapeHtml(value) + '</strong></div>';
  addChartInfo(element, t("qualitativeValueInfo", { field: displayChartName(field) }));
}

function drawLevelPie(element, data, selectedRecord) {
  const source = selectedRecord ? [selectedRecord] : data;
  const rows = levelFields().map((field) => [field, sum(source.map((record) => parseNumber(record[field]))), levelColors[field]]).filter((row) => row[1] > 0);
  if (!rows.length) { element.remove(); return; }
  renderGoogleChart(element, null, (target) => {
    const table = google.visualization.arrayToDataTable([["Nivel", t("total")], ...rows.map(([field, value]) => [field, value])]);
    new google.visualization.PieChart(target).draw(table, { ...baseOptions(t("fieldLevelPie"), rows.map((row) => row[2])), pieHole: 0.35 });
  });
  addChartInfo(element, t("levelPieInfo", { value: formatNumber(sum(rows.map((row) => row[1]))) }));
}

function drawBiologicalSummary(element, data) {
  const rows = [[t("absoluteRichness"), average(data.map((record) => biologicalRichness(record)))], ["Shannon", average(data.map((record) => parseNumber(record["DIVERSIDAD SEGUN SHANNON"])))], ["BMWP/Col", average(data.map((record) => parseNumber(record["INDICE BMWP/Col"])))]].filter((row) => row[1] !== null);
  if (!rows.length) { element.remove(); return; }
  renderGoogleChart(element, null, (target) => {
    const table = google.visualization.arrayToDataTable([[t("indicator"), t("average")], ...rows]);
    new google.visualization.ColumnChart(target).draw(table, { ...baseOptions(t("summaryBioFilter"), ["#0f766e", "#2563eb", "#7c3aed"]), legend: { position: "none" } });
  });
  addChartInfo(element, t("biologicalSummaryInfo"));
}

function createComparisonChart(element, index) { return index % 3 === 1 ? new google.visualization.BarChart(element) : new google.visualization.ColumnChart(element); }
function createMetricChart(element, index) { if (index % 4 === 1) return new google.visualization.BarChart(element); if (index % 4 === 2) return new google.visualization.AreaChart(element); return new google.visualization.ColumnChart(element); }
function createTimeChart(element, index) { if (index % 3 === 0) return new google.visualization.LineChart(element); if (index % 3 === 1) return new google.visualization.AreaChart(element); return new google.visualization.ColumnChart(element); }
function renderGoogleChart(element, index, render) { render(chartTarget(element)); chartRenderers.set(element.id, render); }
function chartTarget(element) { return element.querySelector(".chart-visual") || element; }

function categoryEvolutionRows(data, field) {
  const categories = uniqueCategoryValues(data, field);
  const scoreMap = new Map(categories.map((category, index) => [category, index + 1]));
  const groups = new Map();
  data.forEach((record) => {
    const category = record[field];
    const score = scoreMap.get(category);
    if (!category || !score) return;
    const date = record.FECHA || t("noDate");
    const current = groups.get(date) || { sum: 0, count: 0, categories: new Map() };
    current.sum += score; current.count += 1; current.categories.set(category, (current.categories.get(category) || 0) + 1); groups.set(date, current);
  });
  return [...groups.entries()].map(([date, current]) => {
    const predominant = [...current.categories.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
    return { date, score: Number((current.sum / current.count).toFixed(2)), category: predominant };
  }).sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

function categoryTicks(rows) { const ticks = new Map(); rows.forEach((row) => { const value = Math.round(row.score); if (!ticks.has(value)) ticks.set(value, row.category || t("category") + " " + value); }); return [...ticks.entries()].sort((a, b) => a[0] - b[0]).map(([value, label]) => ({ v: value, f: label })); }
function uniqueCategoryValues(data, field) { return [...new Set(data.map((record) => record[field]).filter(Boolean))].sort((a, b) => a.localeCompare(b)); }
function hasCategoryData(data, field) { return data.some((record) => Boolean(record[field])); }
function createTypedTable(columns, rows) { const table = new google.visualization.DataTable(); table.addColumn("string", columns[0]); columns.slice(1).forEach((column) => table.addColumn("number", column)); table.addRows(rows); return table; }
function aggregateByDate(data, field) { const groups = new Map(); data.forEach((record) => { const date = record.FECHA || t("noDate"); const value = parseNumber(record[field]); if (value === null) return; const current = groups.get(date) || { sum: 0, count: 0 }; current.sum += value; current.count += 1; groups.set(date, current); }); return [...groups.entries()].map(([date, current]) => [date, Number((current.sum / current.count).toFixed(2))]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))); }
function countValues(data, field) { const counts = new Map(); data.forEach((record) => { const value = record[field]; if (!value) return; counts.set(value, (counts.get(value) || 0) + 1); }); return [...counts.entries()].sort((a, b) => b[1] - a[1]); }
function average(values) { const valid = values.filter((value) => value !== null); if (!valid.length) return null; return Number((valid.reduce((acc, value) => acc + value, 0) / valid.length).toFixed(2)); }
function sum(values) { return values.filter((value) => value !== null).reduce((total, value) => total + value, 0); }
function getMetricValue(field, data, selectedRecord) { if (field === "RIQUEZA ABSOLUTA") return selectedRecord ? biologicalRichness(selectedRecord) : average(data.map((record) => biologicalRichness(record))); return selectedRecord ? parseNumber(selectedRecord[field]) : average(data.map((record) => parseNumber(record[field]))); }
function levelFields() { return ["Nivel 10", "Nivel 9", "Nivel 8", "Nivel 7", "Nivel 6", "Nivel 5", "Nivel 4", "Nivel 3", "Nivel 2", "Nivel 1"]; }
function hasLevelData(data) { return levelFields().some((field) => data.some((record) => parseNumber(record[field]) > 0)); }
function biologicalRichness(record) { const total = sum(levelFields().map((field) => parseNumber(record[field]))); return total > 0 ? total : parseNumber(record["RIQUEZA ABSOLUTA"]); }
function buildFisicoComparisonRows(field, obtained, reference) { const rows = [comparisonRow(t("valueObtained"), obtained, fisicoComplianceType(field, obtained, reference))]; if (typeof reference.min === "number") rows.push(comparisonRow(t("minAllowed"), reference.min, "reference")); if (typeof reference.max === "number") rows.push(comparisonRow(t("maxAllowed"), reference.max, "reference")); if (typeof reference.value === "number") rows.push(comparisonRow(referenceLabel(reference), reference.value, "reference")); return rows; }
function buildBiologicalComparisonRows(field, rows) { return rows.map((row, index) => comparisonRow(row[0], row[1], index === 0 ? biologicalComplianceType(field, row[1]) : "reference")); }
function comparisonRow(label, value, type) { return [label, type === "ok" ? value : null, type === "bad" ? value : null, type === "info" ? value : null, type === "reference" ? value : null]; }
function fisicoComplianceType(field, value, reference) { if (value === null) return "info"; if (field === "CALIDAD AGUA NSF") return value >= (reference.value ?? 91) ? "ok" : "bad"; if (typeof reference.min === "number" && typeof reference.max === "number") return value >= reference.min && value <= reference.max ? "ok" : "bad"; if (typeof reference.value === "number") { if (reference.direction === "higher") return value >= reference.value ? "ok" : "bad"; if (reference.exclusiveMax) return value < reference.value ? "ok" : "bad"; return value <= reference.value ? "ok" : "bad"; } return "info"; }
function biologicalComplianceType(field, value) { if (value === null) return "info"; if (field === "DIVERSIDAD SEGUN SHANNON") return value >= 3 ? "ok" : "bad"; if (field === "INDICE BMWP/Col") return value >= 85 ? "ok" : "bad"; return "info"; }
function addChartInfo(element, message) { if (!message) return; element.querySelector(".chart-info-button")?.remove(); const button = document.createElement("button"); button.type = "button"; button.className = "chart-info-button"; button.setAttribute("aria-label", t("chartInfo")); button.innerHTML = '<i class="bi bi-info-lg"></i>'; if (window.bootstrap?.Popover) { button.setAttribute("data-bs-toggle", "popover"); button.setAttribute("data-bs-trigger", "focus"); button.setAttribute("data-bs-placement", "left"); button.setAttribute("data-bs-title", t("information")); button.setAttribute("data-bs-content", message); } else { button.setAttribute("title", message); } element.appendChild(button); window.bootstrap?.Popover?.getOrCreateInstance(button); }
document.addEventListener("click", (event) => { const button = event.target.closest(".chart-expand-button"); if (!button) return; const box = button.closest(".chart-box"); const render = box ? chartRenderers.get(box.id) : null; if (!box || !render) return; openChartModal(render); });
function openChartModal(render) { let modal = document.getElementById("chartExpandModal"); if (!modal) { modal = document.createElement("div"); modal.className = "modal fade"; modal.id = "chartExpandModal"; modal.tabIndex = -1; modal.innerHTML = '<div class="modal-dialog modal-xl modal-dialog-centered"><div class="modal-content chart-modal-content"><div class="modal-header"><h2 class="modal-title h6">' + t("expandedChart") + '</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="' + t("close") + '"></button></div><div class="modal-body"><div class="chart-modal-visual"></div></div></div></div>'; document.body.appendChild(modal); } const target = modal.querySelector(".chart-modal-visual"); target.innerHTML = ""; const instance = window.bootstrap?.Modal.getOrCreateInstance(modal); modal.addEventListener("shown.bs.modal", () => { target.innerHTML = ""; render(target); }, { once: true }); instance?.show(); }
function buildFisicoInfo(field, obtained, reference) { const formatted = formatNumber(obtained); if (typeof reference.min === "number" && typeof reference.max === "number") { const status = obtained >= reference.min && obtained <= reference.max ? t("statusComplies") : t("statusNoComplies"); return t("fisicoRangeInfo", { field: displayChartName(field), value: formatted, min: reference.min, max: reference.max, status }); } if (typeof reference.value === "number") { const higher = reference.direction === "higher"; const status = higher ? (obtained >= reference.value ? t("statusCompliesOrExceeds") : t("statusBelow")) : reference.exclusiveMax ? (obtained < reference.value ? t("statusComplies") : t("statusReachesOrExceeds")) : (obtained <= reference.value ? t("statusComplies") : t("statusExceeds")); return t("fisicoReferenceInfo", { field: displayChartName(field), value: formatted, limitText: higher ? t("minimumReference") : t("maximumCriterion"), reference: reference.exclusiveMax ? '< ' + reference.value : reference.value, status }); } return t("noDirectCriterionInfo", { field: displayChartName(field), value: formatted, note: referenceNote(field, reference) }); }
function buildBiologicalInfo(field, obtained) { const formatted = formatNumber(obtained); if (field === "DIVERSIDAD SEGUN SHANNON") return t("shannonMetricInfo", { value: formatted, status: obtained >= 3 ? t("statusOptimal") : t("statusBelowOptimal") }); if (field === "INDICE BMWP/Col") return t("bmwpMetricInfo", { value: formatted, status: obtained >= 85 ? t("statusMinimum") : t("statusBelowMinimum") }); return buildMetricInfo(field, obtained); }
function buildMetricInfo(field, value) { const formatted = formatNumber(value); if (field.startsWith("Nivel")) return t("levelMetricInfo", { field, value: formatted }); if (field === "RIQUEZA ABSOLUTA") return t("richnessMetricInfo", { value: formatted }); return t("genericMetricInfo", { field: displayChartName(field), value: formatted }); }
function formatNumber(value) { return value === null || value === undefined ? t("noData") : Number(value).toLocaleString(state.language === "en" ? "en-US" : "es-EC", { maximumFractionDigits: 2 }); }
function colorsFor(field) { if (field.startsWith("Nivel")) return [levelColors[field], levelColors[field]]; return parameterColors[field] || ["#0f766e", "#2563eb", "#d97706"]; }
function displayChartName(field) { if (field === syntheticCharts.levelPie) return t("fieldLevelPie"); if (field === syntheticCharts.bioSummary) return t("fieldBioSummary"); return translateField(field); }
function referenceLabel(reference) { if (state.language === "es") return reference.label || t("reference"); const labels = { "Referencia local": "Local reference", "Rango recomendado": "Recommended range", "Referencia OD": "DO reference", "Criterio máximo": "Maximum criterion", "Referencia excelente": "Excellent reference", "Clasificación": "Classification" }; return labels[reference.label] || reference.label || t("reference"); }
function referenceNote(field, reference) { if (state.language === "es") return reference.note || t("noDirectCriterionNote"); const notes = { Temperatura: "No criterion is available in Table 2; the obtained value is charted.", "Oxigeno disuelto": "Table 2 expresses this criterion as saturation percentage; in mg/l it is interpreted as an indicator where more oxygen is better.", Solidos_Totales: "No direct criterion is available in the table used; high values can indicate pollution or turbidity.", Fosfatos: "It should not exceed admissible values; excess phosphate favors algal growth.", Clasificacion: "Qualitative parameter." }; return notes[field] || t("noDirectCriterionNote"); }
function baseOptions(title, colors) { const isDark = state.theme === "dark"; const textColor = isDark ? "#dbe4f0" : "#1f2937"; const gridColor = isDark ? "#263244" : "#e5e7eb"; return { title: displayChartName(title), legend: { position: "bottom", textStyle: { color: textColor } }, backgroundColor: "transparent", colors, chartArea: { width: "76%", height: "64%" }, titleTextStyle: { color: textColor, bold: true }, hAxis: { textStyle: { color: textColor }, gridlines: { color: gridColor } }, vAxis: { textStyle: { color: textColor }, gridlines: { color: gridColor } } }; }
function escapeHtml(value) { return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }

