// Estado global minimo que comparten filtros, mapa, graficas, tema e idioma.
export const state = {
  activeView: "principal",
  dataset: "biologicos",
  data: {
    biologicos: [],
    fisicoquimicos: []
  },
  criteria: [],
  filters: {
    river: "",
    point: "",
    year: "",
    sortBy: "",
    order: "asc"
  },
  selectedRecord: null,
  chartsReady: false,
  language: "es",
  theme: "light",
  voiceAssistant: false
};









