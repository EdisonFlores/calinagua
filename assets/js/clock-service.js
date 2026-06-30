// Mantiene actualizada la hora local que se muestra en el encabezado.
// Funcion initClock: inicia el reloj local del encabezado.
export function initClock() {
  const target = document.getElementById("clockValue");
  // Funcion updateClock: refresca el texto de hora local.
  const updateClock = () => {
    target.textContent = new Intl.DateTimeFormat("es-EC", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Guayaquil"
    }).format(new Date());
  };

  updateClock();
  window.setInterval(updateClock, 30000);
}









