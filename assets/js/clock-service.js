export function initClock() {
  const target = document.getElementById("clockValue");
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









