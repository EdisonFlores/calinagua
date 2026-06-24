import { DEFAULT_CENTER } from "./config.js?v=32";
import { getCoordinates } from "./data-service.js?v=32";
import { state } from "./state.js?v=32";
import { t } from "./i18n-service.js?v=32";

let map;
let selectedMarker;
let markersLayer;

export function initMap() {
  map = L.map("map", {
    scrollWheelZoom: true
  }).setView(DEFAULT_CENTER, 7);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
}

export function renderMapPoints(data, onSelect) {
  if (!map || !markersLayer) return;
  markersLayer.clearLayers();

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

export function focusRecord(record) {
  if (!map) return;
  const coordinates = getCoordinates(record);
  if (!coordinates) return;

  if (selectedMarker) {
    selectedMarker.setLatLng(coordinates).setPopupContent(createPopup(record));
  } else {
    selectedMarker = L.marker(coordinates).addTo(map);
  }

  selectedMarker.openPopup();
  map.setView(coordinates, 13);
}

export function invalidateMap() {
  if (map) window.setTimeout(() => map.invalidateSize(), 100);
}

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

