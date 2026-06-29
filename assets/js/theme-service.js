import { state } from "./state.js?v=35";

const STORAGE_KEY = "calinagua-theme";

export function initTheme() {
  state.theme = localStorage.getItem(STORAGE_KEY) || "light";
  applyTheme();

  document.getElementById("themeToggle").addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, state.theme);
    applyTheme();
  });
}

export function applyTheme() {
  document.documentElement.setAttribute("data-bs-theme", state.theme);
  const icon = document.querySelector("#themeToggle i");
  if (icon) {
    icon.className = state.theme === "dark" ? "bi bi-brightness-high" : "bi bi-moon-stars";
  }
}









