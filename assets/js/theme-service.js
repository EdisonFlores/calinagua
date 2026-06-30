// Administra modo claro/oscuro y persiste la preferencia del usuario.
import { state } from "./state.js?v=35";

const STORAGE_KEY = "calinagua-theme";

// Funcion initTheme: inicia el modo claro u oscuro.
export function initTheme() {
  state.theme = localStorage.getItem(STORAGE_KEY) || "light";
  applyTheme();

  document.getElementById("themeToggle").addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, state.theme);
    applyTheme();
  });
}

// Funcion applyTheme: aplica visualmente el tema seleccionado.
export function applyTheme() {
  document.documentElement.setAttribute("data-bs-theme", state.theme);
  const icon = document.querySelector("#themeToggle i");
  if (icon) {
    icon.className = state.theme === "dark" ? "bi bi-brightness-high" : "bi bi-moon-stars";
  }
}









