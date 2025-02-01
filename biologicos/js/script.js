let datosCSV = [];
let datosBiologicos = [];
let rios = ["RIO HUASAGA", "RIO CHAPIZA", "RIO ZAMORA", "RIO UPANO", "RIO JURUMBAINO",
  "RIO KALAGLAS", "RIO YUQUIPA", "RIO PAN DE AZÚCAR",
  "RIO BLANCO", 
  "RIO TUTANANGOZA", "RIO INDANZA", "RIO MIRIUMI ",
  "RIO YUNGANZA", "RIO CUYES", "RIO ZAMORA", "RIO EL IDEAL", "RIO MORONA",
  "RIO MUCHINKIN", "RIO NAMANGOZA", "RIO SANTIAGO", "RIO PASTAZA", "RIO CHIWIAS",
  "RIO TUNA CHIGUAZA", "RÍO PALORA", "RIO LUSHIN", "RIO NAMANGOZA",
  "RIO PAUTE", "RIO YAAPI", "RIO HUAMBIAZ", "RIO TZURIN", "RIO MANGOSIZA", "RIO PUCHIMI",
   "RIO MACUMA", "RIO PANGUIETZA", "RIO PASTAZA", "RIO PALORA", "RIO TUNA ",
  "RIO WAWAIM GRANDE","RIO LUSHIN"];

document.addEventListener("DOMContentLoaded", function () {
  const selectRio = document.getElementById("rio-select");
  const selectPuntos = document.getElementById("puntos-select");
  const selectAnio = document.getElementById("anio-select");
  let datosBiologicos = [];

  // Poblado del select de ríos
  rios.forEach((rio) => {
    const option = document.createElement("option");
    option.value = rio;
    option.text = rio;
    selectRio.add(option);
  });

  // Evento cuando se selecciona un río
  selectRio.addEventListener("change", function () {
    const nombreRioSeleccionado = selectRio.value;
    if (!nombreRioSeleccionado) return mostrarPopupError("Seleccione un río.");

    limpiarSelects(selectPuntos, selectAnio);
    poblarSelectPuntos(nombreRioSeleccionado);
  });

  // Evento cuando se selecciona un punto
  selectPuntos.addEventListener("change", function () {
    const puntoSeleccionado = selectPuntos.value;

    if (!puntoSeleccionado) {
      mostrarPopupError("Seleccione un punto.");
      return;
    }

    const datosFiltrados = filtrarDatosPorPunto(puntoSeleccionado);
    actualizarTabla(datosFiltrados, "tabla2");
    poblarSelectAnios(datosFiltrados); // Poblar años según los datos filtrados
  });

  // Evento cuando se selecciona un año
  selectAnio.addEventListener("change", function () {
    if (selectAnio.value) buscarDatos();
  });

  // Función para limpiar selects
  function limpiarSelects(...selects) {
    selects.forEach((select) => {
      select.innerHTML = '<option value="">Seleccione una opción</option>';
    });
  }

  // Función para poblar el select de puntos
  function poblarSelectPuntos(rio) {
    const puntos = datosBiologicos
      .filter((dato) => dato.RIO === rio)
      .map((dato) => dato.PUNTO)
      .filter((v, i, a) => a.indexOf(v) === i); // Eliminar duplicados

    puntos.forEach((punto) => {
      const option = document.createElement("option");
      option.value = punto;
      option.text = punto;
      selectPuntos.add(option);
    });
  }

  // Función para poblar el select de años
  function poblarSelectAnios(datos) {
    selectAnio.innerHTML = ''; // Limpiar opciones previas

    const aniosSet = new Set();
    datos.forEach((dato) => {
        let anio;
        if (dato.FECHA instanceof Date && !isNaN(dato.FECHA)) {
            anio = dato.FECHA.getFullYear();
        } else if (typeof dato.FECHA === "string") {
            const [dia, mes, anioStr] = dato.FECHA.split(/[-\/]/);
            anio = anioStr; // Aquí, asegúrate de que anioStr se esté tomando correctamente
        }
        if (!isNaN(anio)) aniosSet.add(Number(anio));
    });

    // Convertir el Set a un Array, ordenar y agregar al select
    Array.from(aniosSet)
        .sort((a, b) => a - b)
        .forEach((anio) => {
            const option = document.createElement("option");
            option.value = anio;
            option.textContent = anio;
            selectAnio.appendChild(option);
        });

    // Agregar la opción "Todos"
    const optionTodos = document.createElement("option");
    optionTodos.value = "Todos";
    optionTodos.textContent = "Todos";
    selectAnio.appendChild(optionTodos);
}


  // Función para filtrar los datos por punto
  function filtrarDatosPorPunto(punto) {
    return datosBiologicos.filter((dato) => dato.PUNTO === punto);
  }

  // Función para buscar datos según los filtros seleccionados
  function buscarDatos() {
    const nombreRioSeleccionado = selectRio.value;
    const puntoSeleccionado = selectPuntos.value;
    const anioSeleccionado = selectAnio.value;

    let datosFiltrados = datosBiologicos.filter(
      (dato) => dato.RIO === nombreRioSeleccionado && dato.PUNTO === puntoSeleccionado
    );

    if (anioSeleccionado !== "Todos") {
      datosFiltrados = datosFiltrados.filter((dato) => {
        let anio;
        if (dato.FECHA instanceof Date) {
          anio = dato.FECHA.getFullYear();
        } else if (typeof dato.FECHA === "string") {
          const [dia, mes, anioStr] = dato.FECHA.split(/[-\/]/);
          anio = anioStr;
        }
        return anio == anioSeleccionado;
      });
    }

    actualizarTabla(datosFiltrados, "tabla2");
    limpiarGrafico();
    if (datosFiltrados.length > 0) {
      actualizarGraficas(datosFiltrados, puntoSeleccionado);
    } else {
      mostrarPopupError("No hay datos disponibles para esta selección.");
    }
  }

  // Función para actualizar las gráficas
  function actualizarGraficas(datos, punto) {
    limpiarGrafico();
    generarGrafico(datos, punto, "#grafico1");
    generarGraficoshanon(datos, punto, "#grafico2");
    generarGrafico3(datos, "#grafico3");
    generarGrafico4(datos, "#grafico4");
    generarGrafico5(datos, "#grafico5");
  }

  // Cargar los datos CSV al cargar la página
  cargarDatosCSV(
    "https://raw.githubusercontent.com/TIESPOCH/Calidadagua/EdisonFlores/tablabio.csv",
    "tabla2"
  );

  function cargarDatosCSV(url, tablaId) {
    Papa.parse(url, {
        download: true,
        header: true,
        complete: function (results) {
            datosBiologicos = results.data.map((dato) => {
                if (dato.FECHA) {
                    const [dia, mes, anio] = dato.FECHA.split("/").map(Number);
                    dato.FECHA = new Date(anio, mes - 1, dia);
                }
                return dato;
            });

            console.log("Datos biológicos cargados:", datosBiologicos); // Verifica los datos cargados
            actualizarTabla(datosBiologicos, tablaId);
        },
        error: function (error) {
            mostrarPopupError("Error al cargar CSV: " + error.message);
        },
    });
}


  const toggleBtn = document.getElementById("sidebar-toggle-btn");
  toggleBtn.addEventListener("click", function () {
    const sidebar = document.querySelector(".sidebar");
    const content = document.querySelector(".content");
    const icon = toggleBtn.querySelector("i");

    sidebar.classList.toggle("collapsed");
    content.classList.toggle("expanded");

    icon.classList.toggle("fa-chevron-right", sidebar.classList.contains("collapsed"));
    icon.classList.toggle("fa-chevron-left", !sidebar.classList.contains("collapsed"));
  });
});



function limpiarGrafico() {
  d3.select("#grafico1 svg").remove();
  d3.select("#grafico2 svg").remove();
  d3.select("#grafico3 svg").remove();
  d3.select("#grafico4 svg").remove();
  d3.select("#grafico5 svg").remove();
}

function mostrarPopupError(mensaje) {
  const popup = document.getElementById("error-popup");
  const popupText = document.getElementById("error-popup-text");
  popupText.textContent = mensaje;
  popup.style.display = "block";
}

function cerrarPopup() {
  const popup = document.getElementById("error-popup");
  popup.style.display = "none";
}

function actualizarTabla(datos, tablaId) {
  const tabla = document.getElementById(tablaId);
  const thead = tabla.querySelector("thead tr");
  const tbody = tabla.querySelector("tbody");

  // Limpiar tabla
  thead.innerHTML = "";
  tbody.innerHTML = "";

  if (datos.length === 0) return;

  const camposAMostrar = [
    "RIO",
    "PUNTO",
    "FECHA",
    "RIQUEZA ABSOLUTA",
    "ÍNDICE BMWP/Col.1",
    "ÍNDICE BMWP/Col",
    "DIVERSIDAD SEGÚN SHANNON",
    "CALIDAD DEL AGUA SEGÚN SHANNON",
  ];

  // Llenar encabezado
  camposAMostrar.forEach((campo) => {
    const th = document.createElement("th");
    th.textContent = campo;
    thead.appendChild(th);
  });

  // Llenar cuerpo
  datos.forEach((dato) => {
    const tr = document.createElement("tr");
    camposAMostrar.forEach((campo) => {
      const td = document.createElement("td");
      td.textContent = dato[campo];
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}
function generarGrafico3(datos, contenedor) {
  // Transformar datos para Google Charts
  const datosGrafico = [['FECHA', 'Riqueza Absoluta']];
  
  datos.sort((a, b) => new Date(a.FECHA) - new Date(b.FECHA)); // Ordenar datos por fecha

  datos.forEach(dato => {
      datosGrafico.push([new Date(dato.FECHA), parseFloat(dato["RIQUEZA ABSOLUTA"])]);
  });

  // Cargar Google Charts
  google.charts.load('current', {'packages':['corechart']});
  google.charts.setOnLoadCallback(drawChart);

  function drawChart() {
      const data = google.visualization.arrayToDataTable(datosGrafico);
      
      const containerElement = document.querySelector(contenedor);
      const width = containerElement.clientWidth;
      const height = containerElement.clientHeight || 400; // Altura predeterminada si no se establece

      const options = {
          title: 'Riqueza Absoluta a lo largo del tiempo',
          titleTextStyle: {
              fontSize: 16, // Tamaño de fuente del título
              bold: true,   // Hacer el título en negrita
              color: '#333', // Color del título
              italic: false // No usar cursiva
          },
          hAxis: {
              title: 'Fecha',
              format: 'yyyy', // Mostrar solo años
              gridlines: { count: 15 },
              slantedText: true, // Rotar las etiquetas si es necesario
              slantedTextAngle: 45 // Ángulo de rotación de las etiquetas
          },
          vAxis: {
              title: 'Riqueza Absoluta',
              viewWindow: {
                  min: Math.min(...datosGrafico.slice(1).map(d => d[1])),
                  max: Math.max(...datosGrafico.slice(1).map(d => d[1]))
              }
          },
          legend: { position: 'none' },
          width: width,
          height: height,
          pointSize: 5, // Tamaño de los puntos en el gráfico
          explorer: {
              actions: ['dragToZoom', 'rightClickToReset'], // Habilitar zoom y reinicio
              axis: 'horizontal', // Aplicar zoom en el eje horizontal
              keepInBounds: true // Mantener dentro de los límites del gráfico
          },
          areaOpacity: 0.4,
          colors: ['#1c91c0'], // Color del área
          lineWidth: 1, // Grosor de la línea
      };

      const chart = new google.visualization.AreaChart(containerElement);
      chart.draw(data, options);
  }
}
function generarGrafico4(datos, contenedor) {
  // Transformar datos para Google Charts
  const datosGrafico = [['Fecha', 'ÍNDICE BMWP/Col']];
  
  datos.sort((a, b) => new Date(a.FECHA) - new Date(b.FECHA)); // Ordenar datos por fecha

  datos.forEach(dato => {
      datosGrafico.push([new Date(dato.FECHA), parseFloat(dato["ÍNDICE BMWP/Col"])]);
  });

  // Cargar Google Charts
  google.charts.load('current', {'packages':['corechart']});
  google.charts.setOnLoadCallback(drawChart);

  function drawChart() {
      const data = google.visualization.arrayToDataTable(datosGrafico);
      
      const containerElement = document.querySelector(contenedor);
      const width = containerElement.clientWidth;
      const height = containerElement.clientHeight || 400; // Altura predeterminada si no se establece

      const options = {
          title: 'ÍNDICE BMWP/Col a lo largo del tiempo',
          titleTextStyle: {
              fontSize: 16, // Tamaño de fuente del título
              bold: true,   // Hacer el título en negrita
              color: '#333', // Color del título
              italic: false // No usar cursiva
          },
          hAxis: {
              title: 'Fecha',
              format: 'yyyy', // Mostrar solo años
              gridlines: { count: 15 },
              slantedText: true, // Rotar las etiquetas si es necesario
              slantedTextAngle: 45 // Ángulo de rotación de las etiquetas
          },
          vAxis: {
              title: 'ÍNDICE BMWP/Col',
              viewWindow: {
                  min: Math.min(...datosGrafico.slice(1).map(d => d[1])),
                  max: Math.max(...datosGrafico.slice(1).map(d => d[1]))
              }
          },
          legend: { position: 'none' },
          width: width,
          height: height,
          pointSize: 5, // Tamaño de los puntos en el gráfico
          explorer: {
              actions: ['dragToZoom', 'rightClickToReset'], // Habilitar zoom y reinicio
              axis: 'horizontal', // Aplicar zoom en el eje horizontal
              keepInBounds: true // Mantener dentro de los límites del gráfico
          },
          lineWidth: 2, // Grosor de la línea
          colors: ['#e0440e'] // Color de la línea
      };

      const chart = new google.visualization.LineChart(containerElement);
      chart.draw(data, options);
  }
}
function generarGrafico5(datos, contenedor) {
  // Transformar datos para Google Charts
  const datosGrafico = [['Fecha', 'DIVERSIDAD SEGÚN SHANNON']];
  
  datos.sort((a, b) => new Date(a.FECHA) - new Date(b.FECHA)); // Ordenar datos por fecha

  datos.forEach(dato => {
      datosGrafico.push([new Date(dato.FECHA), parseFloat(dato["DIVERSIDAD SEGÚN SHANNON"])]);
  });

  // Cargar Google Charts
  google.charts.load('current', {'packages':['corechart']});
  google.charts.setOnLoadCallback(drawChart);

  function drawChart() {
      const data = google.visualization.arrayToDataTable(datosGrafico);
      
      const containerElement = document.querySelector(contenedor);
      const width = containerElement.clientWidth;
      const height = containerElement.clientHeight || 400; // Altura predeterminada si no se establece

      const options = {
          title: 'DIVERSIDAD SEGÚN SHANNON a lo largo del tiempo',
          titleTextStyle: {
              fontSize: 16, // Tamaño de fuente del título
              bold: true,   // Hacer el título en negrita
              color: '#333', // Color del título
              italic: false // No usar cursiva
          },
          hAxis: {
              title: 'Fecha',
              format: 'yyyy', // Mostrar solo años
              gridlines: { count: 15 },
              slantedText: true, // Rotar las etiquetas si es necesario
              slantedTextAngle: 45 // Ángulo de rotación de las etiquetas
          },
          vAxis: {
              title: 'DIVERSIDAD SEGÚN SHANNON',
              viewWindow: {
                  min: Math.min(...datosGrafico.slice(1).map(d => d[1])),
                  max: Math.max(...datosGrafico.slice(1).map(d => d[1]))
              }
          },
          legend: { position: 'none' },
          width: width,
          height: height,
          explorer: {
              actions: ['dragToZoom', 'rightClickToReset'], // Habilitar zoom y reinicio
              axis: 'horizontal', // Aplicar zoom en el eje horizontal
              keepInBounds: true // Mantener dentro de los límites del gráfico
          },
          bar: { groupWidth: '80%' }, // Ajustar el grosor de las barras
          colors: ['#76A7FA'] // Color de las barras
      };

      const chart = new google.visualization.ColumnChart(containerElement);
      chart.draw(data, options);
  }
}
function generarGrafico(data, puntoSeleccionado, contenedor) {
  // Convertir fechas y el índice BMWP/Col a números
  data.forEach((d) => {
    d.FECHA = new Date(d.FECHA);
    d["ÍNDICE BMWP/Col"] = +d["ÍNDICE BMWP/Col"];
  });

  // Encontrar la fecha mínima y máxima
  const minFecha = d3.min(data, (d) => d.FECHA);
  const maxFecha = d3.max(data, (d) => d.FECHA);

  // Añadir un mes a la última fecha
  const maxFechaExtendida = d3.timeMonth.offset(maxFecha, 0.5);

  // Ordenar y filtrar los datos
  data = data.filter((d) => d.FECHA >= minFecha).sort((a, b) => a.FECHA - b.FECHA);

  // Definir ticks dinámicos en el eje X
  let ticksCount = data.length > 50 ? d3.timeMonth.every(3) : d3.timeMonth.every(6);

 // Encontrar el mínimo y máximo de CALIDAD AGUA NSF en los datos
 const minCalidadAgua = d3.min(data, d => d['ÍNDICE BMWP/Col']);
 const maxCalidadAgua = d3.max(data, d => d['ÍNDICE BMWP/Col']);

 // Ajustar el dominio del eje Y con un margen de 2 unidades
 const yDomain = [minCalidadAgua, maxCalidadAgua + 2];
  // Configurar dimensiones del gráfico
  const containerWidth = d3.select(contenedor).node().getBoundingClientRect().width;
  const containerHeight = d3.select(contenedor).node().getBoundingClientRect().height;

  const margin = { top: 50, right: 20, bottom: 70, left: 50 },
    width = containerWidth - margin.left - margin.right,
    height = containerHeight - margin.top - margin.bottom;

  // Eliminar cualquier gráfico previo
  d3.select(contenedor).selectAll("svg").remove();

  const svg = d3
    .select(contenedor)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Escalas
  const x = d3.scaleTime().domain([minFecha, maxFechaExtendida]).range([0, width]);
  const y = d3.scaleLinear().domain(yDomain).nice().range([height, 0]);

  // Definir línea
  const line = d3
    .line()
    .curve(d3.curveMonotoneX)
    .x((d) => x(d.FECHA))
    .y((d) => y(d["ÍNDICE BMWP/Col"]));

  // Agregar ejes
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(ticksCount).tickFormat(d3.timeFormat("%b %Y")))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-65)");

  svg.append("g").call(d3.axisLeft(y));

  // Escala de colores dinámica
  const colorScale = d3
    .scaleThreshold()
    .domain([36, 50, 85, 130])
    .range(["#D32F2F", "#FBC02D", "#228B22", "#00008B"]);

  // Generar líneas de referencia dinámicas
  const yTicks = y.ticks(10);
  yTicks.forEach((tickValue) => {
    svg
      .append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", y(tickValue))
      .attr("y2", y(tickValue))
      .attr("stroke", colorScale(tickValue))
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5");
  });

  // Agregar línea de datos
  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 1.5)
    .attr("d", line);

  // Agregar puntos y eventos de interacción
  svg
    .selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => x(d.FECHA))
    .attr("cy", (d) => y(d["ÍNDICE BMWP/Col"]))
    .attr("r", 5) // Aumentar el tamaño de los puntos para una mejor visualización
    .attr("fill", "black") // Puntos en color negro
    .attr("stroke", "white") // Borde blanco para destacar los puntos
    .on("mouseover", function (event, d) {
      d3.select(this).transition().duration(200).attr("r", 8); // Agrandar el punto al pasar el mouse

      const tooltipGroup = svg.append("g").attr("class", "tooltip-group");

      const background = tooltipGroup
        .append("rect")
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr("rx", 5)
        .attr("ry", 5);

      const text1 = tooltipGroup
        .append("text")
        .attr("x", 0)
        .attr("y", -18)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("FECHA DE MUESTRA: " + d3.timeFormat("%d/%m/%Y")(d.FECHA));

      const text2 = tooltipGroup
        .append("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("ÍNDICE BMWP/Col:" + d["ÍNDICE BMWP/Col"]);

      const text3 = tooltipGroup
        .append("text")
        .attr("x", 0)
        .attr("y", 18)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(
          "ÍNDICE BMWP/Col:" +
            d["ÍNDICE BMWP/Col.1"]
        );

      const bbox = tooltipGroup.node().getBBox();
      background
        .attr("x", bbox.x - 10)
        .attr("y", bbox.y - 5)
        .attr("width", bbox.width + 20)
        .attr("height", bbox.height + 10);

      // Asegurar que el tooltip se muestre completamente dentro de los límites del gráfico
      let tooltipX = x(d.FECHA);
      let tooltipY = y(d["ÍNDICE BMWP/Col"]) - 40;

      if (tooltipX + bbox.width / 2 + 10 > width) {
        tooltipX = width - bbox.width / 2 - 10;
      } else if (tooltipX - bbox.width / 2 - 10 < 0) {
        tooltipX = bbox.width / 2 + 10;
      }

      if (tooltipY - bbox.height - 10 < 0) {
        tooltipY = y(d["ÍNDICE BMWP/Col"]) + bbox.height + 10;
      }

      tooltipGroup.attr("transform", `translate(${tooltipX},${tooltipY})`);
    })
    .on("mouseout", function () {
      d3.select(this).transition().duration(200).attr("r", 5); // Restaurar tamaño original del punto
      svg.select(".tooltip-group").remove();
    });

  // Agregar título
  const titulo =
    "ÍNDICE BMWP/Coll en el  " +
    data[0].RIO +
    " en el punto " +
    puntoSeleccionado;
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", -margin.top / 2) // Mover el título hacia abajo para evitar que se vea tapado
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("text-decoration", "bold")
    .text(titulo);

  // Agregar ícono de información
  const infoIcon = svg
    .append("g")
    .attr("class", "info-icon")
    .attr("transform", `translate(${width - 30}, -30)`)
    .on("mouseover", function () {
      legendGroup.style("display", "block");
    })
    .on("mouseout", function () {
      legendGroup.style("display", "none");
    });

  infoIcon
    .append("circle")
    .attr("r", 10)
    .attr("fill", "lightblue")
    .attr("stroke", "black");

  infoIcon
    .append("text")
    .attr("x", 0)
    .attr("y", 4)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("fill", "black")
    .text("i");

  // Agregar contenedor de la leyenda (oculto por defecto)
  const legendGroup = svg
    .append("g")
    .attr("class", "legend-group")
    .style("display", "none");

  const legendBackground = legendGroup
    .append("rect")
    .attr("x", width - 235)
    .attr("y", 0)
    .attr("width", 235)
    .attr("height", 100)
    .attr("fill", "white")
    .attr("stroke", "black");

  const legendData = [
    { color: "#D32F2F", label: "Contaminación alta (0-35)" },
    { color: "#FBC02D", label: "Contaminación Moderada (36-49)" },
    { color: "#228B22", label: "Poca Contaminación (50-84)" },
    { color: "#00008B", label: "Poca Contaminación (85>)" },
  ];

  legendGroup
    .selectAll("rect.legend-item")
    .data(legendData)
    .enter()
    .append("rect")
    .attr("class", "legend-item")
    .attr("x", width - 230)
    .attr("y", (d, i) => 20 + i * 20)
    .attr("width", 18)
    .attr("height", 18)
    .attr("fill", (d) => d.color);

  legendGroup
    .selectAll("text.legend-item")
    .data(legendData)
    .enter()
    .append("text")
    .attr("class", "legend-item")
    .attr("x", width - 210)
    .attr("y", (d, i) => 29 + i * 20)
    .attr("dy", ".35em")
    .attr("font-size", "12px")
    .text((d) => d.label);

  // Mostrar la leyenda al pasar el mouse sobre el ícono de información
  infoIcon.on("mouseover", function () {
    legendGroup.style("display", "block");
  });

  // Ocultar la leyenda cuando el mouse sale del ícono de información
  infoIcon.on("mouseout", function () {
    legendGroup.style("display", "none");
  });

  // Retornar el objeto SVG para poder modificarlo más tarde si es necesario
  return svg;
}



function generarGraficoshanon(data, puntoSeleccionado, contenedor) {
  // Convertir fechas y el índice DIVERSIDAD SEGÚN SHANNON a números
data.forEach((d) => {
  d.FECHA = new Date(d.FECHA); // Convertir la fecha a un objeto de fecha
  d["DIVERSIDAD SEGÚN SHANNON"] = +d["DIVERSIDAD SEGÚN SHANNON"]; // Asegurarse de que DIVERSIDAD SEGÚN SHANNON es un número
});

// Encontrar la fecha mínima y máxima en los datos para definir el dominio del eje x
const minFecha = d3.min(data, (d) => d.FECHA);
const maxFecha = d3.max(data, (d) => d.FECHA);

// Añadir un mes a la última fecha
const maxFechaExtendida = d3.timeMonth.offset(maxFecha, 0.5);

// Filtrar los datos para empezar desde la fecha mínima encontrada (opcional)
data = data.filter((d) => d.FECHA >= minFecha);

// Ordenar los datos por fecha nuevamente
data.sort((a, b) => a.FECHA - b.FECHA);

// Definir el número de ticks en el eje x dependiendo de la cantidad de datos
let ticksCount = data.length > 50 ? d3.timeMonth.every(3) : d3.timeMonth.every(6);

 // Encontrar el mínimo y máximo de CALIDAD AGUA NSF en los datos
 const minCalidadAgua = d3.min(data, d => d['DIVERSIDAD SEGÚN SHANNON']);
 const maxCalidadAgua = d3.max(data, d => d['DIVERSIDAD SEGÚN SHANNON']);

 // Ajustar el dominio del eje Y con un margen de 2 unidades
 const yDomain = [minCalidadAgua -0.1, maxCalidadAgua ];

// Obtener las dimensiones del contenedor
const containerWidth = d3.select(contenedor).node().getBoundingClientRect().width;
const containerHeight = d3.select(contenedor).node().getBoundingClientRect().height;

const margin = { top: 50, right: 20, bottom: 70, left: 50 },
  width = containerWidth - margin.left - margin.right,
  height = containerHeight - margin.top - margin.bottom;

// Eliminar cualquier SVG existente dentro del contenedor
d3.select(contenedor).selectAll("svg").remove();

const svg = d3
  .select(contenedor)
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Ajustar el dominio del eje X desde la fecha mínima hasta un mes después de la última fecha
const x = d3
  .scaleTime()
  .domain([minFecha, maxFechaExtendida]) // Establecer el dominio del eje x con un mes extra
  .range([0, width]);

const y = d3
  .scaleLinear()
  .domain(yDomain)
  .nice() // Mejorar el aspecto del eje y extendido
  .range([height, 0]);

// Continúa con el resto de tu código para agregar ejes, líneas, puntos, etc.

  const line = d3
    .line()
    .curve(d3.curveMonotoneX) // Aplicar la interpolación que pasa por los puntos
    .x((d) => x(d.FECHA))
    .y((d) => y(d["DIVERSIDAD SEGÚN SHANNON"]));

  // Agregar ejes
  svg
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).ticks(ticksCount).tickFormat(d3.timeFormat("%b %Y")))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-65)");

  svg.append("g").call(d3.axisLeft(y));

  // Definir la escala de colores
  const colorScale = d3.scaleLinear()
    .domain([0, 1.18, 2.46, 5])
    .range(["#ff5133", "#feef00", "#31a84f"]);

   // Generar líneas de referencia dinámicas
   const yTicks = y.ticks(10);
   yTicks.forEach((tickValue) => {
     svg
       .append("line")
       .attr("x1", 0)
       .attr("x2", width)
       .attr("y1", y(tickValue))
       .attr("y2", y(tickValue))
       .attr("stroke", colorScale(tickValue))
       .attr("stroke-width", 2)
       .attr("stroke-dasharray", "5,5");
   });
 
   // Agregar línea de datos
   svg
     .append("path")
     .datum(data)
     .attr("fill", "none")
     .attr("stroke", "black")
     .attr("stroke-width", 1.5)
     .attr("d", line);
 

  // Agregar puntos y eventos de interacción
  svg
    .selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => x(d.FECHA))
    .attr("cy", (d) => y(d["DIVERSIDAD SEGÚN SHANNON"]))
    .attr("r", 5) // Aumentar el tamaño de los puntos para una mejor visualización
    .attr("fill", "black") // Puntos en color negro
    .attr("stroke", "white") // Borde blanco para destacar los puntos
    .on("mouseover", function (event, d) {
      d3.select(this).transition().duration(200).attr("r", 8); // Agrandar el punto al pasar el mouse

      const tooltipGroup = svg.append("g").attr("class", "tooltip-group");

      const background = tooltipGroup
        .append("rect")
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr("rx", 5)
        .attr("ry", 5);

      const text1 = tooltipGroup
        .append("text")
        .attr("x", 0)
        .attr("y", -18)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("FECHA DE MUESTRA: " + d3.timeFormat("%d/%m/%Y")(d.FECHA));

      const text2 = tooltipGroup
        .append("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("DIVERSIDAD SEGÚN SHANNON: " + d["DIVERSIDAD SEGÚN SHANNON"]);

      const text3 = tooltipGroup
        .append("text")
        .attr("x", 0)
        .attr("y", 18)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(
          "CALIDAD DEL AGUA SEGÚN SHANNON: " +
            d["CALIDAD DEL AGUA SEGÚN SHANNON"]
        );

      const bbox = tooltipGroup.node().getBBox();
      background
        .attr("x", bbox.x - 10)
        .attr("y", bbox.y - 5)
        .attr("width", bbox.width + 20)
        .attr("height", bbox.height + 10);

      // Asegurar que el tooltip se muestre completamente dentro de los límites del gráfico
      let tooltipX = x(d.FECHA);
      let tooltipY = y(d["DIVERSIDAD SEGÚN SHANNON"]) - 40;

      if (tooltipX + bbox.width / 2 + 10 > width) {
        tooltipX = width - bbox.width / 2 - 10;
      } else if (tooltipX - bbox.width / 2 - 10 < 0) {
        tooltipX = bbox.width / 2 + 10;
      }

      if (tooltipY - bbox.height - 10 < 0) {
        tooltipY = y(d["DIVERSIDAD SEGÚN SHANNON"]) + bbox.height + 10;
      }

      tooltipGroup.attr("transform", `translate(${tooltipX},${tooltipY})`);
    })
    .on("mouseout", function () {
      d3.select(this).transition().duration(200).attr("r", 5); // Restaurar tamaño original del punto
      svg.select(".tooltip-group").remove();
    });

  // Agregar título
  const titulo =
    "Diversidad Según Shannon en el río " +
    data[0].RIO +
    " en el punto " +
    puntoSeleccionado;
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", -margin.top / 2) // Mover el título hacia abajo para evitar que se vea tapado
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("text-decoration", "bold")
    .text(titulo);

  // Agregar ícono de información
  const infoIcon = svg
    .append("g")
    .attr("class", "info-icon")
    .attr("transform", `translate(${width - 30}, -30)`)
    .on("mouseover", function () {
      legendGroup.style("display", "block");
    })
    .on("mouseout", function () {
      legendGroup.style("display", "none");
    });

  infoIcon
    .append("circle")
    .attr("r", 10)
    .attr("fill", "lightblue")
    .attr("stroke", "black");

  infoIcon
    .append("text")
    .attr("x", 0)
    .attr("y", 4)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("fill", "black")
    .text("i");

  // Agregar contenedor de la leyenda (oculto por defecto)
  const legendGroup = svg
    .append("g")
    .attr("class", "legend-group")
    .style("display", "none");

  const legendBackground = legendGroup
    .append("rect")
    .attr("x", width - 235)
    .attr("y", 0)
    .attr("width", 235)
    .attr("height", 100)
    .attr("fill", "white")
    .attr("stroke", "black");

  const legendData = [
    { color: "#D32F2F", label: "Contaminación alta (0-1.18)" },
    { color: "#FBC02D", label: "Contaminación Moderada (1.19-2.46)" },
    { color: "#228B22", label: "Poca Contaminación (2.46-5)" },
  ];

  legendGroup
    .selectAll("rect.legend-item")
    .data(legendData)
    .enter()
    .append("rect")
    .attr("class", "legend-item")
    .attr("x", width - 230)
    .attr("y", (d, i) => 20 + i * 20)
    .attr("width", 18)
    .attr("height", 18)
    .attr("fill", (d) => d.color);

  legendGroup
    .selectAll("text.legend-item")
    .data(legendData)
    .enter()
    .append("text")
    .attr("class", "legend-item")
    .attr("x", width - 210)
    .attr("y", (d, i) => 29 + i * 20)
    .attr("dy", ".35em")
    .attr("font-size", "12px")
    .text((d) => d.label);

  // Mostrar la leyenda al pasar el mouse sobre el ícono de información
  infoIcon.on("mouseover", function () {
    legendGroup.style("display", "block");
  });

  // Ocultar la leyenda cuando el mouse sale del ícono de información
  infoIcon.on("mouseout", function () {
    legendGroup.style("display", "none");
  });

  // Retornar el objeto SVG para poder modificarlo más tarde si es necesario
  return svg;
}

