export const DATASETS = {
  biologicos: {
    label: "Parámetros biológicos",
    path: "data/tabla-biologica.csv",
    keyFields: ["ID", "RIO", "PUNTO", "FECHA"],
    tableFields: ["ID", "RIO", "PUNTO", "FECHA"],
    chartFields: [
      "Nivel 10",
      "Nivel 9",
      "Nivel 8",
      "Nivel 7",
      "Nivel 6",
      "Nivel 5",
      "Nivel 4",
      "Nivel 3",
      "Nivel 2",
      "Nivel 1",
      "RIQUEZA ABSOLUTA",
      "DIVERSIDAD SEGUN SHANNON",
      "INDICE BMWP/Col"
    ],
    sortableFields: [
      "RIO",
      "PUNTO",
      "RIQUEZA ABSOLUTA",
      "DIVERSIDAD SEGUN SHANNON",
      "INDICE BMWP/Col"
    ]
  },
  fisicoquimicos: {
    label: "Parámetros fisicoquímicos",
    path: "data/parametros-fisicoquimicos.csv",
    keyFields: ["ID", "RIO", "PUNTO", "FECHA"],
    tableFields: ["ID", "RIO", "PUNTO", "FECHA"],
    chartFields: [
      "Temperatura",
      "Ph",
      "Oxigeno disuelto",
      "Solidos_Totales",
      "Nitratos",
      "Fosfatos",
      "Turbiedad",
      "DBO5",
      "Coliformes fecales",
      "CALIDAD AGUA NSF",
      "Clasificacion"
    ],
    sortableFields: [
      "RIO",
      "PUNTO",
      "Temperatura",
      "Ph",
      "Oxigeno disuelto",
      "Nitratos",
      "Fosfatos",
      "Turbiedad",
      "DBO5",
      "Coliformes fecales",
      "CALIDAD AGUA NSF"
    ]
  }
};

export const FISICO_REFERENCES = {
  Temperatura: { label: "Referencia local", value: null, note: "Sin criterio en la Tabla 2; se gráfica el valor obtenido." },
  Ph: { label: "Rango recomendado", min: 6, max: 9 },
  "Oxigeno disuelto": { label: "Referencia OD", value: null, direction: "higher", note: "La Tabla 2 expresa el criterio como porcentaje de saturación; en mg/l se interpreta como indicador donde más oxígeno es mejor." },
  Solidos_Totales: { label: "Referencia local", value: null, direction: "lower", note: "Sin criterio directo en la Tabla 2 usada; valores altos pueden indicar contaminación o turbiedad." },
  Nitratos: { label: "Criterio máximo", value: 10 },
  Fosfatos: { label: "Referencia local", value: null, direction: "lower", note: "No debe sobrepasar valores admisibles; en exceso favorece proliferación de algas." },
  Turbiedad: { label: "Criterio máximo", value: 10 },
  DBO5: { label: "Criterio máximo", value: 2, exclusiveMax: true },
  "Coliformes fecales": { label: "Criterio máximo", value: 20 },
  "CALIDAD AGUA NSF": { label: "Referencia excelente", value: 91, direction: "higher" },
  Clasificacion: { label: "Clasificación", value: null, note: "Parámetro cualitativo." }
};

export const CRITERIA_PATH = "data/criterios-fisicoquimicos.csv";

export const DEFAULT_CENTER = [-2.3, -78.1];

export const WEATHER_LOCATION = {
  latitude: -2.305,
  longitude: -78.114,
  label: "Morona Santiago"
};











