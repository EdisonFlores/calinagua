import { CRITERIA_PATH, DATASETS } from "./config.js?v=32";

export function normalizeKey(key) {
  return fixEncoding(key)
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function fixEncoding(value) {
  const text = String(value || "");
  if (!/[\u00c3\u00c2]/.test(text)) return text;

  try {
    return decodeURIComponent(escape(text));
  } catch {
    return text;
  }
}

export function parseNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const normalized = String(value).replace(",", ".").replace(/[^\d.-]/g, "");
  const number = Number.parseFloat(normalized);
  return Number.isFinite(number) ? number : null;
}

export async function loadCsv(path) {
  const response = await fetch(path);
  const text = await response.text();
  return parseCsv(text).map(normalizeRecord);
}

export async function loadAllData() {
  const [biologicos, fisicoquimicos, criteria] = await Promise.all([
    loadCsv(DATASETS.biologicos.path),
    loadCsv(DATASETS.fisicoquimicos.path),
    loadCsv(CRITERIA_PATH)
  ]);

  return { biologicos, fisicoquimicos, criteria };
}

export function normalizeRecord(record) {
  return Object.entries(record).reduce((current, [key, value]) => {
    const cleanKey = normalizeKey(key);
    if (!cleanKey) return current;
    const cleanValue = typeof value === "string" ? fixEncoding(value).trim() : value;
    current[cleanKey] = cleanValue;
    return current;
  }, {});
}

export function uniqueValues(data, field) {
  return [...new Set(data.map((item) => item[field]).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function uniqueYears(data) {
  return [...new Set(data.map((item) => getYear(item.FECHA)).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function getYear(value) {
  const text = String(value || "").trim();
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : "";
}

export function filterAndSortData(data, filters) {
  const filtered = data.filter((item) => {
    if (filters.river && item.RIO !== filters.river) return false;
    if (filters.point && item.PUNTO !== filters.point) return false;
    if (filters.year && getYear(item.FECHA) !== filters.year) return false;
    return true;
  });
  const sortBy = filters.sortBy;

  if (!sortBy) return filtered;

  return filtered.sort((a, b) => {
    const aNumber = parseNumber(a[sortBy]);
    const bNumber = parseNumber(b[sortBy]);
    const direction = filters.order === "desc" ? -1 : 1;

    if (aNumber !== null && bNumber !== null) return (aNumber - bNumber) * direction;
    return String(a[sortBy] || "").localeCompare(String(b[sortBy] || "")) * direction;
  });
}

export function getCoordinates(record) {
  const latitude = parseNumber(record["COORD- X"]);
  const longitude = parseNumber(record["COORD- Y"]);

  if (latitude === null || longitude === null) return null;
  return [latitude, longitude];
}

export function summarizeFisicoquimicos(data) {
  const nsfValues = data.map((item) => parseNumber(item["CALIDAD AGUA NSF"])).filter((value) => value !== null);
  const avgNsf = nsfValues.length ? nsfValues.reduce((sum, value) => sum + value, 0) / nsfValues.length : null;
  const classes = data.map((item) => item.Clasificacion).filter(Boolean);
  const predominantClass = getMode(classes);

  return {
    avgNsf,
    predominantClass
  };
}

export function getMode(values) {
  const counts = values.reduce((current, value) => {
    current[value] = (current[value] || 0) + 1;
    return current;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "--";
}

export function getAvailableCriteria(criteria, record) {
  return criteria.filter((criterion) => Object.prototype.hasOwnProperty.call(record, criterion.campo_csv));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && insideQuotes && next === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);

  const headers = rows.shift() || [];
  return rows.map((cells) =>
    headers.reduce((record, header, index) => {
      record[header] = cells[index] || "";
      return record;
    }, {})
  );
}









