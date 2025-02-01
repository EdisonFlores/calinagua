let datosCSV = [];
let datosFisicoquimicos = [];
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
        if (!puntoSeleccionado) return mostrarPopupError("Seleccione un punto.");

        limpiarSelects(selectAnio);
        poblarSelectAnios();
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
    function poblarSelectAnios() {
        // Limpiar opciones del select
        selectAnio.innerHTML = '';

        const aniosSet = new Set(); // Usar un Set para evitar duplicados
        let maxAnio = null; // Variable para almacenar el año máximo

        datosBiologicos.forEach(dato => {
            let anio; // Variable para almacenar el año

            if (dato.FECHA instanceof Date) {
                // Si FECHA es un objeto Date, obtener el año
                anio = dato.FECHA.getFullYear();
            } else if (typeof dato.FECHA === "string") {
                // Si FECHA es una cadena, dividir para obtener el año
                const fechaParts = dato.FECHA.split(/[-\/]/);
                anio = fechaParts[0].length === 4 ? fechaParts[0] : fechaParts[2];
            } else {
                console.warn("Formato de fecha no válido:", dato.FECHA); // Advertencia
                return; // Salir si el formato no es válido
            }

            // Convertir el año en número para evitar inconsistencias de formato
            anio = Number(anio);

            // Agregar el año al Set
            if (!isNaN(anio)) {
                aniosSet.add(anio); // Solo agregar si el año es válido
                if (maxAnio === null || anio > maxAnio) {
                    maxAnio = anio; // Actualizar el año máximo encontrado
                }
            }
        });

        // Convertir el Set a un Array y ordenarlo
        const aniosOrdenados = Array.from(aniosSet).sort((a, b) => a - b);

        // Agregar las opciones al select hasta el último año registrado
        aniosOrdenados.forEach(anio => {
            if (anio <= maxAnio) { // Solo agregar hasta el año máximo
                const option = document.createElement('option');
                option.value = anio;
                option.textContent = anio;
                selectAnio.appendChild(option);
            }
        });

        // Agregar opción para "Todos"
        const optionTodos = document.createElement('option');
        optionTodos.value = "Todos";
        optionTodos.textContent = "Todos";
        selectAnio.appendChild(optionTodos);
    }

    function buscarDatos() {
        const nombreRioSeleccionado = selectRio.value;
        const puntoSeleccionado = selectPuntos.value;
        const anioSeleccionado = selectAnio.value;

        // Filtrar datos por río y punto
        let datosFiltrados = datosBiologicos.filter(
            (dato) =>
                dato.RIO === nombreRioSeleccionado && dato.PUNTO === puntoSeleccionado
        );

        if (anioSeleccionado !== "Todos") {
            datosFiltrados = datosFiltrados.filter((dato) => {
                let anio;

                // Verificar si FECHA es un objeto Date o una cadena
                if (dato.FECHA instanceof Date) {
                    anio = dato.FECHA.getFullYear(); // Si es Date, obtener año
                } else if (typeof dato.FECHA === "string") {
                    const fechaParts = dato.FECHA.split(/[-\/]/);
                    anio = fechaParts[0].length === 4 ? fechaParts[0] : fechaParts[2];
                } else {
                    console.warn("Dato sin fecha válida:", dato); // Advertencia
                    return false; // Excluir datos sin fecha válida
                }

                return anio == anioSeleccionado; // Comparación segura
            });
        }

        console.log("Datos filtrados:", datosFiltrados); // Depuración

        actualizarTabla(datosFiltrados, "tabla2"); // Actualizar tabla
        limpiarGrafico(); // Limpiar gráfico anterior

        if (datosFiltrados.length > 0) {
            actualizarGraficas(datosFiltrados, puntoSeleccionado); // Generar gráficos
        } else {
            mostrarPopupError("No hay datos disponibles para esta selección.");
        }
    }

    function actualizarGraficas(datos, punto) {
        limpiarGrafico();
        // Generar nuevo gráfico usando el parámetro 'datos'
        generarGrafico(datos, punto, '#grafico1');
        generarGrafico2(datos, '#grafico2');
        generarGrafico3(datos, '#grafico3');
        generarGrafico4(datos, '#grafico4');
        generarGrafico5(datos, '#grafico5');
        generarGrafico6(datos, '#grafico6');
        generarGrafico7(datos, '#grafico7');
        generarGrafico8(datos, '#grafico8');
        generarGrafico9(datos, '#grafico9');
    }

    // Cargar los datos CSV al cargar la página
    cargarDatosCSV('https://raw.githubusercontent.com/TIESPOCH/Calidadagua/EdisonFlores/Parametrosfisio.csv', 'tabla2');

    // Limpiar cualquier gráfico previo
    function cargarDatosCSV(url, tablaId) {
        Papa.parse(url, {
            download: true,
            header: true,
            complete: function (results) {
                datosBiologicos = results.data;
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
    d3.select("#grafico6 svg").remove();
    d3.select("#grafico7 svg").remove();
    d3.select("#grafico8 svg").remove();
    d3.select("#grafico9 svg").remove();
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
    const thead = tabla.querySelector('thead tr');
    const tbody = tabla.querySelector('tbody');
    
    // Limpiar tabla
    thead.innerHTML = '';
    tbody.innerHTML = '';
    
    if (datos.length === 0) return;

    const camposAMostrar = ['RIO', 'FECHA', 'Clasificacion ','Temperatura','Ph','Oxigeno disuelto','Nitratos','Fosfatos','DBO5', 'CALIDAD AGUA NSF'];
    
    // Llenar encabezado
    camposAMostrar.forEach(campo => {
        const th = document.createElement('th');
        th.textContent = campo;
        thead.appendChild(th);
    });
    
    // Llenar cuerpo
    datos.forEach(dato => {
        const tr = document.createElement('tr');
        camposAMostrar.forEach(campo => {
            const td = document.createElement('td');
            td.textContent = dato[campo];
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}
function generarGrafico2(datos, contenedor) {
    // Transformar datos para Google Charts
    const datosGrafico = [['Fecha', 'Temperatura']];
    datos.forEach(dato => {
        datosGrafico.push([new Date(dato.FECHA), parseFloat(dato.Temperatura)]);
    });

    // Cargar Google Charts
    google.charts.load('current', { 'packages': ['corechart'] });
    google.charts.setOnLoadCallback(drawChart);

    function drawChart() {
        const data = google.visualization.arrayToDataTable(datosGrafico);
        
        const containerElement = document.querySelector(contenedor);
        
        function draw() {
            const width = containerElement.clientWidth;
            const height = containerElement.clientHeight || 400; // Altura predeterminada si no se establece

            const options = {
                title: 'Temperatura a lo largo del tiempo',
                titleTextStyle: {
                    fontSize: 16, 
                    bold: true,   
                    color: 'black',
                    italic: false ,
                     color: 'black'
                },
                hAxis: {
                    title: 'Fecha',
                    format: 'yyyy',
                    gridlines: { count: 15 },
                    slantedText: true,
                    slantedTextAngle: 45,
                     color: 'black'
                },
                vAxis: {
                    title: 'Temperatura (°C)',
                    viewWindow: {
                        min: Math.min(...datosGrafico.slice(1).map(d => d[1])),
                        max: Math.max(...datosGrafico.slice(1).map(d => d[1]))
                    }
                },
                legend: { position: 'none' },
                width: width,
                height: height,
                bar: { groupWidth: '80%' },
                explorer: {
                    actions: ['dragToZoom', 'rightClickToReset'],
                    axis: 'horizontal',
                    keepInBounds: true
                }
            };

            const chart = new google.visualization.ColumnChart(containerElement);
            chart.draw(data, options);
        }

        draw(); // Dibujar gráfico inicialmente

        // Redibujar gráfico cuando la ventana cambia de tamaño
        window.addEventListener('resize', draw);
    }
}



function generarGrafico3(datos, contenedor) {
    // Ordenar los datos por fecha
    datos.sort((a, b) => new Date(a.FECHA) - new Date(b.FECHA));

    // Transformar datos para Google Charts
    const datosGrafico = [['Fecha', 'pH']];
    datos.forEach(dato => {
        datosGrafico.push([new Date(dato.FECHA), parseFloat(dato.Ph)]);
    });

    // Cargar Google Charts
    google.charts.load('current', { 'packages': ['corechart'] });
    google.charts.setOnLoadCallback(drawChart);

    function drawChart() {
        const data = google.visualization.arrayToDataTable(datosGrafico);

        const containerElement = document.querySelector(contenedor);

        function draw() {
            const width = containerElement.clientWidth;
            const height = containerElement.clientHeight || 400;

            const options = {
                title: 'pH a lo largo del tiempo',
                hAxis: {
                    title: 'Fecha',
                    format: 'yyyy',
                    gridlines: { count: 10 },
                    slantedText: true,
                    slantedTextAngle: 45
                },
                vAxis: {
                    title: 'pH',
                    viewWindow: {
                        min: Math.min(...datosGrafico.slice(1).map(d => d[1])),
                        max: Math.max(...datosGrafico.slice(1).map(d => d[1]))
                    }
                },
                legend: { position: 'none' },
                areaOpacity: 0.3,
                curveType: 'function',
                pointSize: 5,
                width: width,
                height: height,
                explorer: {
                    actions: ['dragToZoom', 'rightClickToReset'],
                    axis: 'horizontal',
                    keepInBounds: true
                }
            };

            const chart = new google.visualization.AreaChart(containerElement);
            chart.draw(data, options);
        }

        draw();

        // Redibujar gráfico cuando la ventana cambia de tamaño
        window.addEventListener('resize', draw);
    }
}


function generarGrafico4(datos, contenedor) {
    // Transformar datos para Google Charts
    const datosGrafico = [['Año', 'Oxígeno Disuelto']];

    // Extraer y procesar datos
    datos.forEach(dato => {
        const fecha = new Date(dato.FECHA);
        const oxigenoDisuelto = parseFloat(dato['Oxigeno disuelto']);
        datosGrafico.push([fecha, oxigenoDisuelto]);
    });

    // Cargar Google Charts
    google.charts.load('current', { 'packages': ['corechart'] });
    google.charts.setOnLoadCallback(drawChart);

    function drawChart() {
        const data = google.visualization.arrayToDataTable(datosGrafico);

        const containerElement = document.querySelector(contenedor);
        
        function draw() {
            const width = containerElement.clientWidth;
            const height = containerElement.clientHeight || 400; // Altura predeterminada si no se establece

            const options = {
                title: 'Oxígeno Disuelto a lo largo del tiempo',
                titleTextStyle: {
                    fontSize: 16, // Tamaño de fuente del título
                    bold: true,   // Hacer el título en negrita
                    color: '#333', // Color del título
                    italic: false // No usar cursiva
                },
                hAxis: {
                    title: 'Año',
                    format: 'yyyy', // Mostrar solo el año como texto
                    gridlines: { count: 6 }, // Controlar el número de líneas de cuadrícula
                    ticks: Array.from(new Set(datosGrafico.slice(1).map(d => d[0]))) // Crear ticks únicos para los años
                },
                vAxis: {
                    title: 'Oxígeno Disuelto',
                    viewWindow: {
                        min: Math.min(...datosGrafico.slice(1).map(d => d[1])),
                        max: Math.max(...datosGrafico.slice(1).map(d => d[1]))
                    }
                },
                legend: { position: 'none' },
                areaOpacity: 0.3, // Transparencia del área
                curveType: 'function', // Suavizar las líneas
                pointSize: 5, // Tamaño de los puntos en el gráfico
                width: width,
                height: height,
                explorer: {
                    actions: ['dragToZoom', 'rightClickToReset'], // Habilitar zoom y reinicio
                    axis: 'horizontal', // Aplicar zoom en el eje horizontal
                    keepInBounds: true // Mantener dentro de los límites del gráfico
                }
            };

            const chart = new google.visualization.AreaChart(containerElement);
            chart.draw(data, options);
        }

        draw(); // Dibujar gráfico inicialmente

        // Redibujar gráfico cuando la ventana cambia de tamaño
        window.addEventListener('resize', draw);
    }
}


function generarGrafico5(datos, contenedor) {
    // Transformar datos para Google Charts
    const datosGrafico = [['Fecha', 'Nitratos', { role: 'tooltip', type: 'string', p: { html: true } }]];
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    // Extraer y procesar datos
    datos.forEach(dato => {
        const fecha = new Date(dato.FECHA);
        const año = fecha.getFullYear().toString();
        const mes = meses[fecha.getMonth()];
        const dia = fecha.getDate();
        const nitratos = parseFloat(dato['Nitratos']);
        const fechaFormateada = `${mes} ${dia}, ${fecha.getFullYear()}`;
        
        datosGrafico.push([año, nitratos, ` ${fechaFormateada}<br>Nitratos: ${nitratos}`]);
    });

    // Cargar Google Charts
    google.charts.load('current', { 'packages': ['corechart'] });
    google.charts.setOnLoadCallback(drawChart);

    function drawChart() {
        const data = google.visualization.arrayToDataTable(datosGrafico);

        const containerElement = document.querySelector(contenedor);
        
        function draw() {
            const width = containerElement.clientWidth;
            const height = containerElement.clientHeight || 400;

            const options = {
                title: 'Comparación de Nitratos por Fecha',
                titleTextStyle: {
                    fontSize: 16, // Tamaño de fuente del título
                    bold: true,   // Hacer el título en negrita
                    color: 'black', // Color del título
                    italic: false // No usar cursiva
                },
                hAxis: {
                    title: 'Nitratos',
                    titleTextStyle: { color: 'black' }
                },
                vAxis: {
                    title: 'Fecha',
                    titleTextStyle: {  color: 'black' },
                    gridlines: { count: -1 } // Ajustar líneas de cuadrícula
                },
                legend: { position: 'none' },
                tooltip: { isHtml: true }, // Permitir HTML en tooltips para mantener el formato de fecha y nitratos
                width: width,
                height: height,
                explorer: {
                    actions: ['dragToZoom', 'rightClickToReset'], // Habilitar zoom y reinicio
                    axis: 'horizontal', // Aplicar zoom en el eje horizontal
                    keepInBounds: true // Mantener dentro de los límites del gráfico
                }
            };

            const chart = new google.visualization.BarChart(containerElement);
            chart.draw(data, options);
        }

        draw(); // Dibujar gráfico inicialmente

        // Redibujar gráfico cuando la ventana cambia de tamaño
        window.addEventListener('resize', draw);
    }
}

function generarGrafico6(datos, contenedor) {
    // Transformar datos para Google Charts
    const datosGrafico = [['Fecha', 'Fosfatos', { role: 'tooltip', type: 'string', p: { html: true } }]];
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    // Extraer y procesar datos
    datos.forEach(dato => {
        const fecha = new Date(dato.FECHA);
        const año = fecha.getFullYear().toString();
        const mes = meses[fecha.getMonth()];
        const dia = fecha.getDate();
        const fosfatos = parseFloat(dato['Fosfatos']);
        const fechaFormateada = `${mes} ${dia}, ${fecha.getFullYear()}`;
        
        datosGrafico.push([año, fosfatos, `<div><b>Fecha:</b> ${fechaFormateada}<br><b>Fosfatos:</b> ${fosfatos}</div>`]);
    });

    // Cargar Google Charts
    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(drawChart);

    function drawChart() {
        const data = google.visualization.arrayToDataTable(datosGrafico);

        const containerElement = document.querySelector(contenedor);

        function draw() {
            const width = containerElement.clientWidth;
            const height = containerElement.clientHeight || 400;

            const options = {
                title: 'Comparación de Fosfatos por Fecha',
                titleTextStyle: {
                    fontSize: 16, // Tamaño de fuente del título
                    bold: true,   // Hacer el título en negrita
                    color: '#333', // Color del título
                    italic: false // No usar cursiva
                },
                hAxis: {
                    title: 'Fosfatos',
                    titleTextStyle: { color: '#333' },
                    minValue: 0 // Asegura que la escala comience en 0
                },
                vAxis: {
                    title: 'Año',
                    titleTextStyle: { color: '#333' }
                },
                legend: { position: 'none' },
                tooltip: { isHtml: true }, // Permitir HTML en tooltips para mantener el formato de fecha y fosfatos
                width: width,
                height: height,
                explorer: {
                    actions: ['dragToZoom', 'rightClickToReset'], // Habilitar zoom y reinicio
                    axis: 'horizontal', // Aplicar zoom en el eje horizontal
                    keepInBounds: true // Mantener dentro de los límites del gráfico
                }
            };

            const chart = new google.visualization.BarChart(containerElement);
            chart.draw(data, options);
        }

        draw(); // Dibujar gráfico inicialmente

        // Redibujar gráfico cuando la ventana cambia de tamaño
        window.addEventListener('resize', draw);
    }
}

function generarGrafico7(datos, contenedor) {
    // Transformar datos para Google Charts
    const datosGrafico = [['Fecha', 'Turbiedad']];

    // Extraer y procesar datos
    datos.forEach(dato => {
        const fecha = new Date(dato.FECHA);
        const turbiedad = parseFloat(dato['Turbiedad']);
        datosGrafico.push([fecha, turbiedad]); // Añadir fecha y turbiedad
    });

    // Cargar Google Charts
    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(drawChart);

    function drawChart() {
        const data = google.visualization.arrayToDataTable(datosGrafico);

        const containerElement = document.querySelector(contenedor);

        function draw() {
            const width = containerElement.clientWidth;
            const height = containerElement.clientHeight || 400; // Altura por defecto si no se establece ninguna

            const options = {
                title: 'Turbiedad a lo largo del tiempo',
                titleTextStyle: {
                    fontSize: 16, // Tamaño de fuente del título
                    bold: true,   // Hacer el título en negrita
                    color: '#333', // Color del título
                    italic: false // No usar cursiva
                },
                hAxis: {
                    title: 'Fecha',
                    format: 'yyyy', // Formato de fecha en el eje X
                    slantedText: true, // Inclinar el texto para mejor legibilidad
                    slantedTextAngle: 45 // Ángulo de inclinación del texto
                },
                vAxis: {
                    title: 'Turbiedad',
                    titleTextStyle: { color: '#333' }
                },
                legend: { position: 'none' },
                width: width,
                height: height,
                explorer: {
                    actions: ['dragToZoom', 'rightClickToReset'], // Habilitar zoom y reinicio
                    axis: 'horizontal', // Aplicar zoom en el eje horizontal
                    keepInBounds: true // Mantener dentro de los límites del gráfico
                }
            };

            const chart = new google.visualization.ColumnChart(containerElement);
            chart.draw(data, options);
        }

        draw(); // Dibujar gráfico inicialmente

        // Redibujar gráfico cuando la ventana cambia de tamaño
        window.addEventListener('resize', draw);
    }
}


function generarGrafico8(datos, contenedor) {
    // Transformar datos para Google Charts
    const datosGrafico = [['Fecha', 'DBO5']];

    // Extraer y procesar datos
    datos.forEach(dato => {
        const fecha = new Date(dato.FECHA);
        const dbo5 = parseFloat(dato['DBO5']);
        datosGrafico.push([fecha, dbo5]); // Añadir fecha y DBO5
    });

    // Cargar Google Charts
    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(drawChart);

    function drawChart() {
        const data = google.visualization.arrayToDataTable(datosGrafico);

        const containerElement = document.querySelector(contenedor);

        function draw() {
            const width = containerElement.clientWidth;
            const height = containerElement.clientHeight || 400; // Altura por defecto si no se establece ninguna

            const options = {
                title: 'DBO5 a lo largo del tiempo',
                titleTextStyle: {
                    fontSize: 16, // Tamaño de fuente del título
                    bold: true,   // Hacer el título en negrita
                    color: '#333', // Color del título
                    italic: false // No usar cursiva
                },
                hAxis: {
                    title: 'Fecha',
                    format: 'yyyy', // Formato de fecha en el eje X
                    slantedText: true, // Inclinar el texto para mejor legibilidad
                    slantedTextAngle: 45 // Ángulo de inclinación del texto
                },
                vAxis: {
                    title: 'DBO5',
                    titleTextStyle: { color: '#333' }
                },
                legend: { position: 'none' },
                width: width,
                height: height,
                curveType: 'function', // Suavizar las líneas
                explorer: {
                    actions: ['dragToZoom', 'rightClickToReset'], // Habilitar zoom y reinicio
                    axis: 'horizontal', // Aplicar zoom en el eje horizontal
                    keepInBounds: true // Mantener dentro de los límites del gráfico
                },
                pointSize: 5 // Tamaño de los puntos en el gráfico
            };

            const chart = new google.visualization.LineChart(containerElement);
            chart.draw(data, options);
        }

        draw(); // Dibujar gráfico inicialmente

        // Redibujar gráfico cuando la ventana cambia de tamaño
        window.addEventListener('resize', draw);
    }
}

function generarGrafico9(datos, contenedor) {
    // Transformar datos para Google Charts
    const datosGrafico = [['Clasificación', 'Cantidad']];

    // Contar la cantidad de cada clasificación
    const clasificacionesCount = {};
    datos.forEach(dato => {
        const clasificacion = dato['Clasificacion ']; // Usar el nombre exacto de la columna
        if (clasificacionesCount[clasificacion]) {
            clasificacionesCount[clasificacion]++;
        } else {
            clasificacionesCount[clasificacion] = 1;
        }
    });

    // Preparar datos para el gráfico
    Object.keys(clasificacionesCount).forEach(clasificacion => {
        datosGrafico.push([clasificacion, clasificacionesCount[clasificacion]]);
    });

    // Cargar Google Charts
    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(drawChart);

    function drawChart() {
        const data = google.visualization.arrayToDataTable(datosGrafico);

        const containerElement = document.querySelector(contenedor);

        function draw() {
            const width = containerElement.clientWidth;
            const height = containerElement.clientHeight || 400; // Altura por defecto si no se establece ninguna

            // Mapear clasificaciones a colores
            const colores = {
                'Buena': '#4CAF50',   // Verde
                'Regular': '#FF9800', // Naranja
                'Mala': '#F44336'     // Rojo
            };

            // Crear un array de colores según el orden de las clasificaciones en los datos
            const colorArray = datosGrafico.slice(1).map(row => colores[row[0]] || '#000000'); // Default color (black) in case of unexpected value

            const options = {
                title: 'Distribución de Clasificaciones',
                titleTextStyle: {
                    fontSize: 16, // Tamaño de fuente del título
                    bold: true,   // Hacer el título en negrita
                    color: '#333', // Color del título
                    italic: false // No usar cursiva
                },
                pieSliceText: 'label', // Mostrar etiquetas en las rebanadas
                legend: { position: 'right' },
                pieStartAngle: 100, // Ajustar el ángulo de inicio de la gráfica
                width: width,
                height: height,
                colors: colorArray // Aplicar colores a los segmentos del gráfico
            };

            const chart = new google.visualization.PieChart(containerElement);
            chart.draw(data, options);
        }

        draw(); // Dibujar gráfico inicialmente

        // Redibujar gráfico cuando la ventana cambia de tamaño
        window.addEventListener('resize', draw);
    }
}


function generarGrafico(data, puntoSeleccionado, contenedor) {
    // Convertir fechas y calidad del agua a números
    data.forEach(d => {
        d.FECHA = new Date(d.FECHA);  // Convertir FECHA a un objeto Date
        d['CALIDAD AGUA NSF'] = +d['CALIDAD AGUA NSF'];  // Asegurar que CALIDAD AGUA NSF es un número
    });

    // Encontrar la fecha mínima y máxima en los datos para definir el dominio del eje X
    const minFecha = d3.min(data, d => d.FECHA);
    const maxFecha = d3.max(data, d => d.FECHA);

    // Añadir un mes a la última fecha
    const maxFechaExtendida = d3.timeMonth.offset(maxFecha, 0.5);

    // Ordenar los datos por fecha
    data.sort((a, b) => a.FECHA - b.FECHA);

    // Definir los colores para los rangos de calidad del agua
    const colorScale = d3.scaleThreshold()
        .domain([50.09, 68.25])
        .range(['#D32F2F', '#FBC02D', '#388E3C']);

    // Encontrar el mínimo y máximo de CALIDAD AGUA NSF en los datos
    const minCalidadAgua = d3.min(data, d => d['CALIDAD AGUA NSF']);
    const maxCalidadAgua = d3.max(data, d => d['CALIDAD AGUA NSF']);

    // Ajustar el dominio del eje Y con un margen de 2 unidades
    const yDomain = [minCalidadAgua, maxCalidadAgua + 2];

    // Obtener las dimensiones del contenedor
    const containerWidth = d3.select(contenedor).node().getBoundingClientRect().width;
    const containerHeight = d3.select(contenedor).node().getBoundingClientRect().height;

    const margin = { top: 20, right: 20, bottom: 70, left: 50 },
        width = containerWidth - margin.left - margin.right,
        height = containerHeight - margin.top - margin.bottom;

    // Eliminar cualquier SVG existente dentro del contenedor
    d3.select(contenedor).selectAll("svg").remove();

    // Crear el contenedor SVG
    const svg = d3.select(contenedor).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Definir la escala del eje X (fechas)
    const x = d3.scaleTime()
        .domain([minFecha, maxFechaExtendida])
        .range([0, width]);

    // Definir la escala del eje Y
    const y = d3.scaleLinear()
        .domain(yDomain)
        .nice()
        .range([height, 0]);

    // Crear el eje Y para obtener los ticks
    const yAxis = d3.axisLeft(y);

    // Generar líneas de referencia basadas en los ticks del eje Y
    const yTicks = y.ticks(); // Obtener los valores de ticks generados automáticamente
    yTicks.forEach(tickValue => {
        const color = colorScale(tickValue);
        svg.append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", y(tickValue))
            .attr("y2", y(tickValue))
            .attr("stroke", color)
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "5,5");
    });

    // Crear la línea de datos
    const line = d3.line()
        .curve(d3.curveMonotoneX)
        .x(d => x(d.FECHA))
        .y(d => y(d['CALIDAD AGUA NSF']));

    // Agregar ejes
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b %Y")))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");

    svg.append("g")
        .call(yAxis);

    // Agregar la línea negra
    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .attr("d", line);

    // Agregar puntos interactivos y tooltips
    svg.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => x(d.FECHA))
        .attr("cy", d => y(d['CALIDAD AGUA NSF']))
        .attr("r", 5)
        .attr("fill", "black")
        .attr("stroke", "white")
        .on("mouseover", function(event, d) {
            d3.select(this).transition().duration(200).attr("r", 6);

            const tooltipGroup = svg.append("g")
                .attr("class", "tooltip-group");

            const background = tooltipGroup.append("rect")
                .attr("fill", "white")
                .attr("stroke", "black")
                .attr("rx", 5)
                .attr("ry", 5);

            const text1 = tooltipGroup.append("text")
                .attr("x", 0)
                .attr("y", -18)
                .attr("text-anchor", "middle")
                .style("font-size", "12px")
                .text("CALIDAD DE AGUA NSF: " + d['CALIDAD AGUA NSF']);

            const text2 = tooltipGroup.append("text")
                .attr("x", 0)
                .attr("y", 0)
                .attr("text-anchor", "middle")
                .style("font-size", "12px")
                .text("FECHA DE MUESTRA: " + d3.timeFormat("%d/%m/%Y")(d.FECHA));

            const text3 = tooltipGroup.append("text")
                .attr("x", 0)
                .attr("y", 18)
                .attr("text-anchor", "middle")
                .style("font-size", "12px")
                .text("Clasificación: " + d['Clasificacion ']);

            const bbox = tooltipGroup.node().getBBox();
            background
                .attr("x", bbox.x - 10)
                .attr("y", bbox.y - 5)
                .attr("width", bbox.width + 20)
                .attr("height", bbox.height + 10);

            let tooltipX = x(d.FECHA);
            let tooltipY = y(d["CALIDAD AGUA NSF"]) - 40;

            if (tooltipX + bbox.width / 2 + 10 > width) {
                tooltipX = width - bbox.width / 2 - 10;
            } else if (tooltipX - bbox.width / 2 - 10 < 0) {
                tooltipX = bbox.width / 2 + 10;
            }

            if (tooltipY - bbox.height - 10 < 0) {
                tooltipY = y(d["CALIDAD AGUA NSF"]) + bbox.height + 10;
            }

            tooltipGroup.attr("transform", `translate(${tooltipX},${tooltipY})`);
        })
        .on("mouseout", function() {
            d3.select(this).transition().duration(200).attr("r", 5);
            svg.select(".tooltip-group").remove();
        });

    // Agregar título
    const titulo = "Calidad del Agua NSF en el " + data[0].RIO + " en el punto " + puntoSeleccionado;
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 3)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text(titulo);

    // Manejar el redimensionamiento del gráfico
    window.addEventListener('resize', () => {
        d3.select(contenedor).select("svg").remove();
        generarGrafico(data, puntoSeleccionado, contenedor);
    });

    return svg;
}
