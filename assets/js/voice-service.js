import { state } from "./state.js?v=35";
import { t } from "./i18n-service.js?v=35";

const STORAGE_KEY = "calinagua-voice-assistant";
const MAX_TEXT_LENGTH = 180;

let button;
let lastElement;
let lastText = "";
let hoverTimer;

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
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) window.speechSynthesis.cancel();
  });
}

function handlePointerOver(event) {
  if (!state.voiceAssistant || event.pointerType === "touch") return;

  const element = findReadableElement(event.target);
  if (!element || element === lastElement) return;

  const text = getReadableText(element);
  if (!text || text === lastText) return;

  window.clearTimeout(hoverTimer);
  hoverTimer = window.setTimeout(() => {
    lastElement = element;
    lastText = text;
    speak(text);
  }, 220);
}

function findReadableElement(target) {
  let element = target instanceof Element ? target : target?.parentElement;

  while (element && element !== document.body) {
    if (element.matches("script, style, svg, path, .leaflet-tile, .leaflet-pane")) return null;
    if (isReadableElement(element)) return element;
    element = element.parentElement;
  }

  return null;
}

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

function elementText(element) {
  if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement) {
    const label = document.querySelector(`label[for="${element.id}"]`)?.textContent || "";
    const value = element instanceof HTMLSelectElement ? element.selectedOptions[0]?.textContent : element.value;
    return `${label} ${value || ""}`;
  }

  return element.textContent || "";
}

function normalizeText(value) {
  return String(value)
    .replace(/\s+/g, " ")
    .replace(/[▶◀]/g, "")
    .trim()
    .slice(0, MAX_TEXT_LENGTH);
}

function speak(text, force = false) {
  if (!supportsSpeech() || (!force && !state.voiceAssistant)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = state.language === "en" ? "en-US" : "es-EC";
  utterance.rate = 0.94;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function updateButton() {
  if (!button) return;

  button.classList.toggle("is-active", state.voiceAssistant);
  button.setAttribute("aria-pressed", String(state.voiceAssistant));
  button.innerHTML = `<i class="bi ${state.voiceAssistant ? "bi-volume-up-fill" : "bi-volume-up"}"></i>`;
}

function supportsSpeech() {
  return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}
