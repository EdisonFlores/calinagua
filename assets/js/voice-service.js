// Asistente de voz: lee textos por hover, foco o toque segun el dispositivo.
import { state } from "./state.js?v=35";
import { t } from "./i18n-service.js?v=36";

const STORAGE_KEY = "calinagua-voice-assistant";
const MAX_TEXT_LENGTH = 180;

let button;
let lastElement;
let lastText = "";
let hoverTimer;
let lastSpokenAt = 0;

// Funcion initVoiceAssistant: inicia el asistente de voz.
export function initVoiceAssistant() {
  button = document.getElementById("voiceAssistantToggle");
  if (!button) return;

  if (!supportsSpeech()) {
    button.disabled = true;
    button.classList.add("is-disabled");
    button.setAttribute("title", t("voiceAssistantNotSupported"));
    button.setAttribute("aria-label", t("voiceAssistantNotSupported"));
    return;
  }

  state.voiceAssistant = localStorage.getItem(STORAGE_KEY) === "1";
  updateButton();

  button.addEventListener("click", () => {
    state.voiceAssistant = !state.voiceAssistant;
    localStorage.setItem(STORAGE_KEY, state.voiceAssistant ? "1" : "0");
    updateButton();
    speak(state.voiceAssistant ? t("voiceAssistantEnabled") : t("voiceAssistantDisabled"), true);
  });

  document.addEventListener("pointerover", handlePointerOver, true);
  document.addEventListener("pointerdown", handlePointerDown, true);
  document.addEventListener("focusin", handleFocusIn, true);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) window.speechSynthesis.cancel();
  });
}

// Funcion handlePointerOver: lee elementos al pasar el mouse en escritorio.
function handlePointerOver(event) {
  if (!state.voiceAssistant || event.pointerType === "touch") return;
  queueRead(event.target, 220);
}

// Funcion handlePointerDown: lee elementos al tocar en pantallas tactiles.
function handlePointerDown(event) {
  if (!state.voiceAssistant) return;
  if (event.pointerType !== "touch" && !window.matchMedia("(pointer: coarse)").matches) return;

  queueRead(event.target, 0, true);
}

// Funcion handleFocusIn: lee controles cuando reciben foco.
function handleFocusIn(event) {
  if (!state.voiceAssistant) return;
  queueRead(event.target, 0, true);
}

// Funcion queueRead: programa una lectura evitando repeticiones.
function queueRead(target, delay = 0, allowSameElement = false) {
  const element = findReadableElement(target);
  if (!element || (!allowSameElement && element === lastElement)) return;

  const text = getReadableText(element);
  if (!text) return;

  const now = Date.now();
  if (text === lastText && now - lastSpokenAt < 900) return;

  window.clearTimeout(hoverTimer);
  hoverTimer = window.setTimeout(() => {
    lastElement = element;
    lastText = text;
    lastSpokenAt = Date.now();
    speak(text);
  }, delay);
}

// Funcion findReadableElement: busca el elemento mas apropiado para leer.
function findReadableElement(target) {
  let element = target instanceof Element ? target : target?.parentElement;

  while (element && element !== document.body) {
    if (element.matches("script, style, svg, path, .leaflet-tile, .leaflet-pane")) return null;
    if (isReadableElement(element)) return element;
    element = element.parentElement;
  }

  return null;
}

// Funcion isReadableElement: determina si un elemento tiene contenido legible.
function isReadableElement(element) {
  return (
    element.hasAttribute("aria-label") ||
    element.hasAttribute("title") ||
    element.hasAttribute("data-i18n") ||
    element.matches(
      "button, a, label, select, option, input, th, td, .metric-card, .panel-heading, .info-card, .summary-item, .status-pill, .quality-badge"
    )
  );
}

// Funcion getReadableText: extrae el texto accesible de un elemento.
function getReadableText(element) {
  const parts = [
    element.getAttribute("aria-label"),
    element.getAttribute("title"),
    element.dataset.i18n ? t(element.dataset.i18n) : "",
    element instanceof HTMLImageElement ? element.alt : "",
    elementText(element)
  ];

  return normalizeText(parts.find(Boolean) || "");
}

// Funcion elementText: obtiene texto de inputs, selects u otros nodos.
function elementText(element) {
  if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement) {
    const label = document.querySelector(`label[for="${element.id}"]`)?.textContent || "";
    const value = element instanceof HTMLSelectElement ? element.selectedOptions[0]?.textContent : element.value;
    return `${label} ${value || ""}`;
  }

  return element.textContent || "";
}

// Funcion normalizeText: limpia y limita el texto que se va a leer.
function normalizeText(value) {
  return String(value)
    .replace(/\s+/g, " ")
    .replace(/[â–¶â—€]/g, "")
    .trim()
    .slice(0, MAX_TEXT_LENGTH);
}

// Funcion speak: envia el texto al sintetizador de voz.
function speak(text, force = false) {
  if (!supportsSpeech() || (!force && !state.voiceAssistant)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = state.language === "en" ? "en-US" : "es-EC";
  utterance.rate = 0.94;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

// Funcion updateButton: actualiza estado visual del boton de voz.
function updateButton() {
  if (!button) return;

  button.classList.toggle("is-active", state.voiceAssistant);
  button.setAttribute("aria-pressed", String(state.voiceAssistant));
  button.innerHTML = `<i class="bi ${state.voiceAssistant ? "bi-volume-up-fill" : "bi-volume-up"}"></i>`;
}

// Funcion supportsSpeech: verifica soporte del navegador para voz.
function supportsSpeech() {
  return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}
