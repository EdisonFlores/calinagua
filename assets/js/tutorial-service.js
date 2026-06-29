import { state } from "./state.js?v=35";

let button;
let overlay;
let card;
let activeIndex = 0;
let activeSteps = [];
let highlightedElement;

const content = {
  es: {
    close: "Cerrar",
    next: "Siguiente",
    previous: "Anterior",
    finish: "Finalizar",
    step: "Paso",
    of: "de",
    principal: [
      {
        selector: ".topbar",
        title: "Barra superior",
        text: "Aquí encuentras hora, temperatura, idioma, asistente de voz, tutorial y modo claro u oscuro."
      },
      {
        selector: ".filters-panel",
        title: "Filtros principales",
        text: "En Principal puedes cambiar entre parámetros biológicos y fisicoquímicos, filtrar ríos y ordenar registros."
      },
      {
        selector: ".table-panel",
        title: "Tabla de registros",
        text: "Haz clic en una fila para seleccionar un punto de muestreo. Solo en Principal los registros son interactivos."
      },
      {
        selector: ".map-panel",
        title: "Mapa y río",
        text: "El mapa muestra los puntos de muestreo. Si existe GeoJSON del río, se dibuja su trazado y el punto seleccionado se resalta."
      },
      {
        selector: ".selection-strip",
        title: "Resumen del punto",
        text: "Después de seleccionar un registro, aquí verás los datos clave y criterios del punto elegido."
      },
      {
        selector: ".charts-panel",
        title: "Gráficas comparativas",
        text: "En Principal las gráficas comparan el valor obtenido con referencias o criterios admisibles."
      }
    ],
    fisicoquimicos: [
      {
        selector: ".filters-panel",
        title: "Filtros progresivos",
        text: "Primero selecciona un río. Luego se habilita el punto y después el año disponible para ese punto."
      },
      {
        selector: ".table-panel",
        title: "Tabla filtrada",
        text: "Aquí aparecen los registros filtrados. En apartados secundarios la tabla es de consulta y no se hace clic en sus filas."
      },
      {
        selector: ".map-panel",
        title: "Mapa fisicoquímico",
        text: "El mapa mantiene los puntos visibles y dibuja el trazado del río cuando hay GeoJSON disponible."
      },
      {
        selector: ".charts-panel",
        title: "Evolución temporal",
        text: "Estas gráficas muestran cómo cambian los parámetros fisicoquímicos con el tiempo según los filtros."
      },
      {
        selector: ".info-panel",
        title: "Criterios de interpretación",
        text: "Este bloque resume cómo interpretar pH, oxígeno, nutrientes, turbiedad, DBO5 y coliformes."
      }
    ],
    biologicos: [
      {
        selector: ".filters-panel",
        title: "Filtros biológicos",
        text: "Selecciona río, punto y año para consultar los resultados biológicos disponibles."
      },
      {
        selector: ".table-panel",
        title: "Resultados de la muestra",
        text: "La tabla muestra identificación, río, punto y fecha. En este apartado los registros no son clicables."
      },
      {
        selector: ".map-panel",
        title: "Mapa biológico",
        text: "Los puntos se conservan sobre el mapa y el trazado del río aparece cuando existe GeoJSON."
      },
      {
        selector: ".charts-panel",
        title: "Indicadores biológicos",
        text: "Aquí revisas riqueza absoluta, diversidad de Shannon, BMWP/Col y evolución de la calidad biológica."
      },
      {
        selector: ".info-panel",
        title: "Lectura biológica",
        text: "Los niveles altos se relacionan con aguas limpias y los niveles bajos con mayor contaminación."
      }
    ]
  },
  en: {
    close: "Close",
    next: "Next",
    previous: "Previous",
    finish: "Finish",
    step: "Step",
    of: "of",
    principal: [
      { selector: ".topbar", title: "Top bar", text: "Here you find time, temperature, language, voice assistant, tutorial and light or dark mode." },
      { selector: ".filters-panel", title: "Main filters", text: "On Principal you can switch between biological and physicochemical parameters, filter rivers and sort records." },
      { selector: ".table-panel", title: "Records table", text: "Click a row to select a sampling point. Only the Principal section has interactive table rows." },
      { selector: ".map-panel", title: "Map and river", text: "The map shows sampling points. If a river GeoJSON exists, its line is drawn and the selected point is highlighted." },
      { selector: ".selection-strip", title: "Point summary", text: "After selecting a record, this area shows key data and criteria for the chosen point." },
      { selector: ".charts-panel", title: "Comparative charts", text: "On Principal, charts compare the obtained value against references or admissible criteria." }
    ],
    fisicoquimicos: [
      { selector: ".filters-panel", title: "Progressive filters", text: "Select a river first. Then point and year become available according to the selected records." },
      { selector: ".table-panel", title: "Filtered table", text: "Filtered records appear here. In secondary sections the table is read-only." },
      { selector: ".map-panel", title: "Physicochemical map", text: "The map keeps points visible and draws the river line when GeoJSON is available." },
      { selector: ".charts-panel", title: "Time evolution", text: "These charts show how physicochemical parameters change over time according to the filters." },
      { selector: ".info-panel", title: "Interpretation criteria", text: "This block summarizes how to read pH, oxygen, nutrients, turbidity, BOD5 and coliforms." }
    ],
    biologicos: [
      { selector: ".filters-panel", title: "Biological filters", text: "Select river, point and year to consult available biological results." },
      { selector: ".table-panel", title: "Sample results", text: "The table shows identification, river, point and date. Rows are not clickable in this section." },
      { selector: ".map-panel", title: "Biological map", text: "Points remain visible on the map and the river line appears when GeoJSON exists." },
      { selector: ".charts-panel", title: "Biological indicators", text: "Review absolute richness, Shannon diversity, BMWP/Col and biological quality evolution." },
      { selector: ".info-panel", title: "Biological reading", text: "High levels are related to clean water, while low levels indicate greater contamination." }
    ]
  }
};

export function initTutorial() {
  button = document.getElementById("tutorialToggle");
  if (!button) return;

  button.addEventListener("click", startTutorial);
  window.addEventListener("resize", () => {
    if (card) positionCard();
  });
  document.addEventListener("keydown", (event) => {
    if (!card) return;
    if (event.key === "Escape") closeTutorial();
    if (event.key === "ArrowRight") nextStep();
    if (event.key === "ArrowLeft") previousStep();
  });
}

function startTutorial() {
  activeSteps = stepsForCurrentView();
  activeIndex = 0;
  ensureElements();
  renderStep();
}

function stepsForCurrentView() {
  const lang = state.language === "en" ? "en" : "es";
  return content[lang][state.activeView] || content[lang].principal;
}

function ensureElements() {
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "tutorial-overlay";
    overlay.addEventListener("click", closeTutorial);
    document.body.appendChild(overlay);
  }

  if (!card) {
    card = document.createElement("section");
    card.className = "tutorial-card";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    document.body.appendChild(card);
  }
}

function renderStep() {
  const labels = labelsForCurrentLanguage();
  const step = activeSteps[activeIndex];
  const target = document.querySelector(step.selector);

  highlightedElement?.classList.remove("tutorial-highlight");
  highlightedElement = target;
  highlightedElement?.classList.add("tutorial-highlight");
  highlightedElement?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

  overlay.classList.add("is-visible");
  card.classList.add("is-visible");
  card.innerHTML = `
    <button class="tutorial-close" type="button" aria-label="${labels.close}">
      <i class="bi bi-x-lg"></i>
    </button>
    <span class="tutorial-step">${labels.step} ${activeIndex + 1} ${labels.of} ${activeSteps.length}</span>
    <h2>${escapeHtml(step.title)}</h2>
    <p>${escapeHtml(step.text)}</p>
    <div class="tutorial-progress" aria-hidden="true">
      ${activeSteps.map((_, index) => `<span class="${index === activeIndex ? "active" : ""}"></span>`).join("")}
    </div>
    <div class="tutorial-actions">
      <button class="btn btn-sm btn-outline-secondary" type="button" data-tour-prev ${activeIndex === 0 ? "disabled" : ""}>${labels.previous}</button>
      <button class="btn btn-sm btn-primary" type="button" data-tour-next>${activeIndex === activeSteps.length - 1 ? labels.finish : labels.next}</button>
    </div>
  `;

  card.querySelector(".tutorial-close").addEventListener("click", closeTutorial);
  card.querySelector("[data-tour-prev]").addEventListener("click", previousStep);
  card.querySelector("[data-tour-next]").addEventListener("click", nextStep);
  window.setTimeout(positionCard, 240);
}

function nextStep() {
  if (activeIndex >= activeSteps.length - 1) {
    closeTutorial();
    return;
  }

  activeIndex += 1;
  renderStep();
}

function previousStep() {
  if (activeIndex === 0) return;
  activeIndex -= 1;
  renderStep();
}

function closeTutorial() {
  highlightedElement?.classList.remove("tutorial-highlight");
  highlightedElement = null;
  overlay?.classList.remove("is-visible");
  card?.classList.remove("is-visible");
}

function positionCard() {
  if (!card || !highlightedElement) return;

  const rect = highlightedElement.getBoundingClientRect();
  const margin = 16;
  const cardRect = card.getBoundingClientRect();
  const isNarrow = window.innerWidth < 720;

  if (isNarrow) {
    card.style.left = `${margin}px`;
    card.style.right = `${margin}px`;
    card.style.top = "auto";
    card.style.bottom = `${margin}px`;
    return;
  }

  card.style.right = "auto";
  card.style.bottom = "auto";

  const preferRight = rect.right + cardRect.width + margin < window.innerWidth;
  const preferLeft = rect.left - cardRect.width - margin > 0;
  const left = preferRight ? rect.right + margin : preferLeft ? rect.left - cardRect.width - margin : margin;
  const top = Math.min(Math.max(rect.top, margin), window.innerHeight - cardRect.height - margin);

  card.style.left = `${left}px`;
  card.style.top = `${top}px`;
}

function labelsForCurrentLanguage() {
  const lang = state.language === "en" ? "en" : "es";
  return content[lang];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
