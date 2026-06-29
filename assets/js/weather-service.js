import { WEATHER_LOCATION } from "./config.js?v=35";

export async function initWeather() {
  const target = document.getElementById("weatherValue");
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", WEATHER_LOCATION.latitude);
  url.searchParams.set("longitude", WEATHER_LOCATION.longitude);
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,wind_speed_10m");
  url.searchParams.set("timezone", "auto");

  try {
    const response = await fetch(url);
    const data = await response.json();
    const temperature = data.current?.temperature_2m;
    const unit = data.current_units?.temperature_2m || "C";
    target.textContent = Number.isFinite(temperature) ? `${Math.round(temperature)} ${unit}` : "-- C";
    target.title = WEATHER_LOCATION.label;
  } catch (error) {
    target.textContent = "-- C";
  }
}









