// Controla Leaflet: puntos de muestreo, rios GeoJSON y resaltado de seleccion.
import { DEFAULT_CENTER, RIVER_GEOJSON_BASE_PATH, RIVER_GEOJSON_FILES } from "./config.js?v=35";
import { getCoordinates } from "./data-service.js?v=35";
import { state } from "./state.js?v=35";
import { t } from "./i18n-service.js?v=36";

let map;
let selectedMarker;
let selectedHalo;
let markersLayer;
let riverLayer;
let riverRequestId = 0;
const riverGeoJsonCache = new Map();

// Funcion initMap: crea el mapa base de Leaflet.
export function initMap() {
  map = L.map("map", {
    scrollWheelZoom: true
  }).setView(DEFAULT_CENTER, 7);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  riverLayer = L.layerGroup().addTo(map);
  markersLayer = L.layerGroup().addTo(map);
}

// Funcion renderMapPoints: dibuja los puntos de muestreo visibles.
export function renderMapPoints(data, onSelect) {
  if (!map || !markersLayer || !riverLayer) return;
  markersLayer.clearLayers();
  renderRiverLayer(getActiveRiver(data));

  const bounds = [];

  data.forEach((record) => {
    const coordinates = getCoordinates(record);
    if (!coordinates) return;

    const marker = L.circleMarker(coordinates, {
      radius: 7,
      color: "#0f766e",
      weight: 2,
      fillColor: "#14b8a6",
      fillOpacity: 0.72
    });

    marker.bindPopup(createPopup(record));
    marker.on("click", () => onSelect(record));
    marker.addTo(markersLayer);
    bounds.push(coordinates);
  });

  if (bounds.length > 1) map.fitBounds(bounds, { padding: [24, 24] });
}

// Funcion focusRecord: centra y resalta el registro seleccionado.
export function focusRecord(record) {
  if (!map) return;
  const coordinates = getCoordinates(record);
  if (!coordinates) return;

  if (selectedMarker) {
    selectedMarker.setLatLng(coordinates).setPopupContent(createPopup(record));
    selectedHalo.setLatLng(coordinates);
  } else {
    selectedHalo = L.circleMarker(coordinates, {
      radius: 17,
      color: "#facc15",
      weight: 3,
      opacity: 0.95,
      fillColor: "#fef08a",
      fillOpacity: 0.24,
      className: "sampling-point-halo"
    }).addTo(map);

    selectedMarker = L.circleMarker(coordinates, {
      radius: 9,
      color: "#ffffff",
      weight: 3,
      opacity: 1,
      fillColor: "#ef4444",
      fillOpacity: 0.96,
      className: "sampling-point-selected"
    }).addTo(map);
  }

  selectedHalo.bringToFront();
  selectedMarker.bringToFront();
  selectedMarker.openPopup();
  renderRiverLayer(record.RIO, [coordinates]);
  map.setView(coordinates, 13);
}

// Funcion invalidateMap: recalcula el tamano del mapa tras cambios de layout.
export function invalidateMap() {
  if (map) window.setTimeout(() => map.invalidateSize(), 100);
}

// Funcion createPopup: construye el contenido del marcador del mapa.
function createPopup(record) {
  const base = `
    <strong>${record.RIO || t("river")}</strong><br>
    ${t("point")}: ${record.PUNTO || "--"}<br>
    ${t("date")}: ${record.FECHA || "--"}
  `;

  if (state.dataset === "fisicoquimicos") {
    return `
      ${base}<br>
      ${t("nsfQuality")}: ${record["CALIDAD AGUA NSF"] || "--"}<br>
      ${t("classification")}: ${record.Clasificacion || "--"}
    `;
  }

  return `
    ${base}<br>
    ${t("shannonDiversity")}: ${record["DIVERSIDAD SEGUN SHANNON"] || "--"}<br>
    ${t("fieldBmwp")}: ${record["INDICE BMWP/Col"] || "--"}<br>
    ${t("absoluteRichness")}: ${record["RIQUEZA ABSOLUTA"] || "--"}
  `;
}

// Funcion renderRiverLayer: carga y dibuja el GeoJSON del rio activo.
async function renderRiverLayer(riverName, pointBounds = []) {
  if (!map || !riverLayer) return;

  const requestId = ++riverRequestId;
  riverLayer.clearLayers();

  const path = getRiverGeoJsonPath(riverName);
  if (!path) return;

  try {
    const geojson = await loadRiverGeoJson(path);
    if (requestId !== riverRequestId) return;

    const layer = L.geoJSON(geojson, {
      style: {
        color: "#2563eb",
        weight: 5,
        opacity: 0.84,
        lineCap: "round",
        lineJoin: "round"
      }
    }).bindPopup(`<strong>${riverName}</strong>`);

    layer.addTo(riverLayer);
    fitMapToLayers(layer, pointBounds);
  } catch (error) {
    console.warn(`No se pudo cargar el GeoJSON para ${riverName}`, error);
  }
}

// Funcion loadRiverGeoJson: obtiene y cachea el archivo GeoJSON del rio.
async function loadRiverGeoJson(path) {
  if (riverGeoJsonCache.has(path)) return riverGeoJsonCache.get(path);

  const response = await fetch(encodeURI(path));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const geojson = await response.json();
  riverGeoJsonCache.set(path, geojson);
  return geojson;
}

// Funcion getActiveRiver: deduce el rio que debe mostrarse en el mapa.
function getActiveRiver(data) {
  if (state.selectedRecord?.RIO) return state.selectedRecord.RIO;
  if (state.filters.river) return state.filters.river;

  const rivers = [...new Set(data.map((record) => record.RIO).filter(Boolean))];
  return rivers.length === 1 ? rivers[0] : "";
}

// Funcion getRiverGeoJsonPath: resuelve la ruta GeoJSON asociada al nombre del rio.
function getRiverGeoJsonPath(riverName) {
  const file = RIVER_GEOJSON_FILES[normalizeRiverName(riverName)];
  return file ? `${RIVER_GEOJSON_BASE_PATH}/${file}` : "";
}

// Funcion normalizeRiverName: normaliza nombres de rios para compararlos sin tildes.
function normalizeRiverName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

// Funcion fitMapToLayers: ajusta la vista del mapa a rio y puntos.
function fitMapToLayers(layer, pointBounds) {
  const bounds = layer.getBounds();
  pointBounds.forEach((coordinates) => bounds.extend(coordinates));
  if (bounds.isValid()) map.fitBounds(bounds, { padding: [28, 28] });
}
