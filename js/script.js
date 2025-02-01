// Variables globales
let map;
let marker;
let filaSeleccionada = null;
let datosCSV = [];
let datosBiologicos = [];
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
   // Función para inicializar el mapa
function inicializarMapa() {
    map = L.map('map').setView([-1.831239, -78.183406], 6.60); // Coordenadas y zoom para ver Ecuador
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}


// Función para mostrar en el mapa y en la consola los campos especificados
function mostrarEnMapa(registro, fila) {
    const lat = parseFloat(registro['COORD- X']);
    const lon = parseFloat(registro['COORD- Y']);

    if (isNaN(lat) || isNaN(lon)) {
        mostrarPopupError("Las coordenadas no son válidas.");
        return;
    }

    const coordenadas = { latitude: lat, longitude: lon };

    // Eliminar la clase 'selected' de todas las filas
    document.querySelectorAll('tr.selected').forEach(fila => fila.classList.remove('selected'));

    // Añadir la clase 'selected' a la fila actual
    fila.classList.add('selected');
    filaSeleccionada = fila;

    // Buscar la fecha en el dataset correspondiente
    let fecha = '';
    if (registro.hasOwnProperty('ÍNDICE BMWP/Col.1')) {
        fecha = obtenerFechaPorID(datosBiologicos, registro['ID']);
    } else if (registro.hasOwnProperty('Clasificacion ')) {
        fecha = obtenerFechaPorID(datosFisicoquimicos, registro['ID']);
    }

    // Determinar el contenido del pop-up utilizando las funciones generadoras
    let popupContent = '';
    if (registro.hasOwnProperty('ÍNDICE BMWP/Col.1')) {
        popupContent = generarContenidoPopupBiologicos(registro, fecha);
        generarGraficoBarras(registro);
    } else if (registro.hasOwnProperty('Clasificacion ')) {
        popupContent = generarContenidoPopupFisicoquimicos(registro, fecha);
        generarGraficosFisicoquimicos(registro); // Llamada para generar gráficos
    } else {
        popupContent = `
            <div>
                <strong>Río:</strong> ${registro['RIO']}<br>
                <strong>Punto:</strong> ${registro['PUNTO']}<br>
                <strong>Fecha:</strong> ${fecha}<br>
                <strong>Información no disponible</strong>
            </div>
        `;
    }

    if (marker) {
        marker.setLatLng([coordenadas.latitude, coordenadas.longitude])
              .setPopupContent(popupContent)
              .openPopup();
    } else {
        marker = L.marker([coordenadas.latitude, coordenadas.longitude])
                  .addTo(map)
                  .bindPopup(popupContent)
                  .openPopup();
    }

    // Añadir eventos para mostrar el popup al pasar el mouse
    marker.on('mouseover', function() {
        marker.openPopup();
    });

    marker.on('mouseout', function() {
        marker.closePopup();
    });
    map.setView([coordenadas.latitude, coordenadas.longitude], 15);

    

   
}


// Función para obtener la fecha por ID
function obtenerFechaPorID(datos, id) {
    const registro = datos.find(item => item['ID'] === id);
    return registro ? registro['FECHA'] : 'Fecha no disponible';
}
// Función para limpiar el área de información
function limpiarInfoArea() {
    const infoArea = document.querySelector('.info-area');
    infoArea.innerHTML = '<h2><i class="fas fa-info-circle"></i> Información Adicional</h2>';
}
// Función para abrir una pestaña específica
function abrirPestania(evt, tabName) {
    const tabcontent = document.getElementsByClassName('tabcontent');
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = 'none';
    }

    const tablinks = document.getElementsByClassName('tablink');
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(' active', '');
    }

    document.getElementById(tabName).style.display = 'block';
    evt.currentTarget.className += ' active';

    // Mostrar el contenedor del dropdown cuando se hace clic en un tab
    document.getElementById("dropdown-container").style.display = "flex";
      // Limpiar el área de información al cambiar de pestaña
      limpiarInfoArea();
}

// Función para cargar datos CSV y mostrarlos en las tablas
function cargarDatosCSV(url, tablaId) {
    Papa.parse(url, {
        download: true,
        header: true,
        complete: function(results) {
            const datos = results.data;
            if (tablaId === 'tabla1') {
                datosBiologicos = datos;
            } else if (tablaId === 'tabla2') {
                datosFisicoquimicos = datos;
            }
            actualizarTabla(datos, tablaId);
            if (tablaId === 'tabla1') {
                cargarNombresRios();
            }
        },
        error: function(error) {
            mostrarPopupError("Error al cargar el archivo CSV: " + error.message);
        }
    });
}

// Función para actualizar la tabla con los datos cargados
function actualizarTabla(datos, tablaId) {
    const tabla = document.getElementById(tablaId).getElementsByTagName('tbody')[0];
    const thead = document.getElementById(tablaId).getElementsByTagName('thead')[0].getElementsByTagName('tr')[0];
    tabla.innerHTML = '';
    thead.innerHTML = '';

    if (datos.length === 0) return;

    // Obtener los campos específicos para cada tabla
    let camposAMostrar = [];
    if (tablaId === 'tabla1') {
        camposAMostrar = ['ID', 'RIO', 'PUNTO','Nivel 10','Nivel 9','Nivel 8','Nivel 7','Nivel 6','Nivel 5','Nivel 4','Nivel 3','Nivel 2','Nivel 1', 'RIQUEZA ABSOLUTA', 'DIVERSIDAD SEGÚN SHANNON', 'CALIDAD DEL AGUA SEGÚN SHANNON', 'ÍNDICE BMWP/Col', 'ÍNDICE BMWP/Col.1'];
    } else if (tablaId === 'tabla2') {
        camposAMostrar = ['ID', 'RIO', 'PUNTO', 'Temperatura', 'Ph', 'Oxigeno disuelto', 'Solidos_Totales', 'Nitratos', 'Fosfatos', 'Turbiedad', 'DBO5', 'Coliformes fecales', 'CALIDAD AGUA NSF', 'Clasificacion '];
    }

    // Crear encabezados de tabla
    camposAMostrar.forEach(campo => {
        const th = document.createElement('th');
        th.textContent = campo;
        thead.appendChild(th);
    });

    // Llenar la tabla con los datos
    datos.forEach(registro => {
        const fila = tabla.insertRow();

        camposAMostrar.forEach(campo => {
            const celda = fila.insertCell();
            celda.textContent = registro[campo];
        });

        fila.onclick = () => mostrarEnMapa(registro, fila);
    });
}

// Mapeo de opciones amigables a los nombres de los campos del dataset
const mapeoCamposFisicoquimicos = {
    "Busqueda por río": "RIO",
    "Busqueda por calidad del agua": "CALIDAD AGUA NSF",
    "Busqueda por coliformes fecales": "Coliformes fecales",
    "Busqueda por DBO5": "DBO5",
    "Busqueda por turbiedad": "Turbiedad",
    "Busqueda por fosfatos": "Fosfatos",
    "Busqueda por nitratos": "Nitratos",
    "Busqueda por sólidos totales": "Solidos_Totales",
    "Busqueda por oxígeno disuelto": "Oxigeno disuelto",
    "Busqueda por pH": "Ph",
    "Busqueda por temperatura": "Temperatura"
};

const mapeoCamposBiologicos = {
    "Busqueda por río": "RIO",
    "Busqueda por riqueza absoluta": "RIQUEZA ABSOLUTA",
    "Busqueda por diversidad (Shannon)": "DIVERSIDAD SEGÚN SHANNON",
    "Busqueda por calidad del agua (Shannon)": "CALIDAD DEL AGUA SEGÚN SHANNON",
    "Busqueda por índice BMWP/Col": "ÍNDICE BMWP/Col"
};

// Actualiza las opciones del desplegable según la pestaña seleccionada
function actualizarOpciones(tipo) {
    const parametroSelect = document.getElementById('parametro-select');
    parametroSelect.innerHTML = '<option value="">Seleccione un criterio</option>';

    const opciones = tipo === 'fisicoquimicos' 
        ? Object.keys(mapeoCamposFisicoquimicos)
        : Object.keys(mapeoCamposBiologicos);

    opciones.forEach(opcion => {
        const option = document.createElement('option');
        option.value = opcion;
        option.textContent = opcion;
        parametroSelect.appendChild(option);
    });
    
}

// Mostrar u ocultar el select de ríos y el select de orden según la opción seleccionada
document.getElementById('parametro-select').addEventListener('change', function () {
    const rioSelect = document.getElementById('rio-select');
    const ordenSelect = document.getElementById('orden-select');
    const parametroSeleccionado = this.value;

    // Mostrar el select de ríos si se selecciona "Filtrar por río"
    rioSelect.style.display = parametroSeleccionado === "Busqueda por río" ? "block" : "none";
    
    // Mostrar el select de orden si no se selecciona "Filtrar por río"
    ordenSelect.style.display = parametroSeleccionado !== "Busqueda por río" && parametroSeleccionado ? "block" : "none";
});

function buscarDatos() {
    const parametroSeleccionado = document.getElementById('parametro-select').value;
    const rioSeleccionado = document.getElementById('rio-select').value;
    const ordenSeleccionado = document.getElementById('orden-select').value; // Obtener el tipo de orden seleccionado

    // Identificar la tabla activa según la pestaña seleccionada
    const tablaId = document.getElementById('biological-parameters-tab').classList.contains('active') ? 'tabla1' : 'tabla2';
    const datos = tablaId === 'tabla1' ? datosBiologicos : datosFisicoquimicos;

    let datosFiltrados = [...datos]; // Clonar los datos para evitar modificar el original

    // Elegir el campo adecuado según el tipo de tabla
    const campo = tablaId === 'tabla1'
        ? mapeoCamposBiologicos[parametroSeleccionado]
        : mapeoCamposFisicoquimicos[parametroSeleccionado];

    // Filtrar por río si se selecciona "Busqueda por río" y hay un río seleccionado
    if (parametroSeleccionado === "Busqueda por río" && rioSeleccionado) {
        datosFiltrados = datosFiltrados.filter(dato => dato['RIO'] === rioSeleccionado);
    }

    // Ordenar los datos si se seleccionó otro criterio válido
    if (campo && campo !== "RIO") {
        datosFiltrados.sort((a, b) => {
            const valorA = a[campo] ?? 0; // Manejar valores nulos
            const valorB = b[campo] ?? 0;

            // Ordenar según el tipo de orden seleccionado
            return ordenSeleccionado === 'asc' ? valorA - valorB : valorB - valorA;
        });
    }

    // Actualizar la tabla con los datos filtrados y ordenados
    actualizarTabla(datosFiltrados, tablaId);
}

// Inicializar las opciones y cargar los ríos al cargar la página
document.addEventListener('DOMContentLoaded', function () {
    cargarNombresRios();
    actualizarOpciones('biologicos'); // Inicializar con parámetros biológicos
});



// Agregar eventos a los botones de pestañas para actualizar las opciones
document.getElementById('biological-parameters-tab').addEventListener('click', () => {
    actualizarOpciones('biologicos');
});

document.getElementById('physicochemical-parameters-tab').addEventListener('click', () => {
    actualizarOpciones('fisicoquimicos');
});

// Agregar evento al botón de búsqueda
document.getElementById('buscar-btn').addEventListener('click', buscarDatos);

// Inicializar las opciones y cargar los ríos al cargar la página
document.addEventListener('DOMContentLoaded', function () {
    cargarNombresRios();
    actualizarOpciones('biologicos'); // Inicializar con parámetros biológicos
});


// Función para cargar los nombres de los ríos en el menú desplegable
function cargarNombresRios() {
    const selectRios = document.getElementById('rio-select');
    selectRios.innerHTML = '<option value="">Seleccione un río</option>'; // Limpiar opciones previas

    rios.forEach(nombreRio => {
        const opcion = document.createElement('option');
        opcion.value = nombreRio;
        opcion.textContent = nombreRio;
        selectRios.appendChild(opcion);
    });
}

// Función para mostrar el popup de error
function mostrarPopupError(mensaje) {
    const popup = document.getElementById('error-popup');
    const textoPopup = document.getElementById('error-popup-text');
    textoPopup.textContent = mensaje;
    popup.style.display = 'block';
}

// Función para cerrar el popup de error
function cerrarPopup() {
    const popup = document.getElementById('error-popup');
    popup.style.display = 'none';
}

// Inicialización del mapa y carga de datos al cargar la página
window.onload = function() {
    inicializarMapa();
    abrirPestania({currentTarget: document.getElementById('biological-parameters-tab')}, 'tab1');
    document.getElementById('buscar-btn').addEventListener('click', buscarDatos);
    document.getElementById('biological-parameters-tab').addEventListener('click', () => cargarDatosCSV('https://raw.githubusercontent.com/TIESPOCH/Calidadagua/EdisonFlores/tablabio.csv', 'tabla1'));
    document.getElementById('physicochemical-parameters-tab').addEventListener('click', () => cargarDatosCSV('https://raw.githubusercontent.com/TIESPOCH/Calidadagua/EdisonFlores/Parametrosfisio.csv', 'tabla2'));
};

// Nuevo código para llenar el menú desplegable con ríos y buscar datos
document.addEventListener("DOMContentLoaded", function () {
    const selectRio = document.getElementById('rio-select');
    rios.forEach(rio => {
        const option = document.createElement('option');
        option.value = rio;
        option.text = rio;
        selectRio.add(option);
    });

    const buscarBtn = document.getElementById('buscar-btn');
    buscarBtn.addEventListener('click', function () {
        const selectedRio = selectRio.value;
        if (!selectedRio) {
            mostrarPopupError("Por favor seleccione un río.");
            return;
        }
        buscarDatos();
    });
   
    
});

// Función para generar el contenido del popup para parámetros biológicos
function generarContenidoPopupBiologicos(registro, fecha) {
    const nombreRio = registro['RIO'];
    const puntoRio = registro['PUNTO'];
    const indiceBMWP = registro['ÍNDICE BMWP/Col.1'];
    const calidadshanon = registro['CALIDAD DEL AGUA SEGÚN SHANNON'];

    return `
        <div>
            <strong>Río:</strong> ${nombreRio}<br>
            <strong>Punto:</strong> ${puntoRio}<br>
            <strong>ÍNDICE BMWP/Col.1:</strong> ${indiceBMWP}<br>
            <strong>Calidad según Shanon:</strong> ${calidadshanon}<br>
            <strong>Fecha:</strong> ${fecha}
        </div>
    `;
}

// Función para generar el contenido del popup para parámetros fisicoquímicos
function generarContenidoPopupFisicoquimicos(registro, fecha) {
    const nombreRio = registro['RIO'];
    const puntoRio = registro['PUNTO'];
    const clasificacion = registro['Clasificacion '];

    return `
        <div>
            <strong>Río:</strong> ${nombreRio}<br>
            <strong>Punto:</strong> ${puntoRio}<br>
            <strong>Clasificación de calidad del agua:</strong> ${clasificacion}<br>
            <strong>Fecha:</strong> ${fecha}
        </div>
    `;
}

const valoresExcelentes = {
    'Ph': [6.5, 9],
    'Oxigeno disuelto': 8,
    'Nitratos': 13,
    'DBO5': 20,
    'Coliformes Fecales': 0,
    'CALIDAD AGUA NSF': 100
};

function generarGraficosFisicoquimicos(registro) {
    // Limpiar el área de información al cambiar de pestaña
    limpiarInfoArea();
    const parametros = [
        'DBO5', 'Nitratos', 'Oxigeno disuelto', 'Ph', 'Coliformes fecales', 'CALIDAD AGUA NSF'
    ];

    const infoArea = document.querySelector('.info-area');
    infoArea.innerHTML = '<h2><i class="fas fa-info-circle"></i> Información Adicional</h2>';

    let filaDiv;
    parametros.forEach((parametro, index) => {
        if (index % 3 === 0) {
            filaDiv = document.createElement('div');
            filaDiv.className = 'fila-graficos';
            infoArea.appendChild(filaDiv);
        }

        const chartDiv = document.createElement('div');
        chartDiv.className = 'chart';
        filaDiv.appendChild(chartDiv);

        const valorRegistrado = parseFloat(registro[parametro]);
        let rangoEscala;
        let colorIdeal, colorRegistrado;
        let titulo;

        switch (parametro) {
            case 'DBO5':
                rangoEscala = [0, Math.max(25, valorRegistrado)];
                colorRegistrado = valorRegistrado < 20 ? 'blue' : valorRegistrado === 20 ? 'green' : 'red';
                colorIdeal = 'green';
                titulo = 'Comparación de niveles de DBO5 ';
                break;
            case 'Nitratos':
                rangoEscala = [0, Math.max(25, valorRegistrado)];
                colorRegistrado = valorRegistrado < 13 ? 'blue' : valorRegistrado === 13 ? 'green' : 'red';
                colorIdeal = 'green';
                titulo = 'Comparación de niveles de Nitratos';
                break;
            case 'Oxigeno disuelto':
                rangoEscala = [0, Math.max(100, valorRegistrado)];
                colorRegistrado = valorRegistrado > 8 ? 'blue' : valorRegistrado === 8 ? 'green' : 'red';
                colorIdeal = 'green';
                titulo = 'Comparación de niveles de Oxígeno Disuelto';
                break;
            case 'Ph':
                rangoEscala = [0, 14];
                colorRegistrado = valorRegistrado >= 6.5 && valorRegistrado <= 9 ? 'blue' : 'red';
                colorIdeal = 'green';
                titulo = 'Comparación de niveles de pH';
                break;
            case 'Coliformes fecales':
                rangoEscala = [0, valorRegistrado];
                colorRegistrado = 'red';
                colorIdeal = 'green';
                titulo = 'Comparación de niveles de Coliformes Fecales';
                break;
            case 'CALIDAD AGUA NSF':
                rangoEscala = [0, 100];
                colorIdeal = 'blue'; // Color de la barra ideal
                if (valorRegistrado >= 91) colorRegistrado = 'blue';
                else if (valorRegistrado >= 71) colorRegistrado = 'green';
                else if (valorRegistrado >= 51) colorRegistrado = 'yellow';
                else if (valorRegistrado >= 26) colorRegistrado = 'red';
                else colorRegistrado = 'black';
                titulo = 'Comparación Calidad del Agua NSF';
                break;
        }

        const data = [
            
            { name: 'Criterio Admisible', value: valoresExcelentes[parametro] instanceof Array ? valoresExcelentes[parametro][1] : valoresExcelentes[parametro], color: colorIdeal },
            { name: 'Valor Registrado', value: valorRegistrado, color: colorRegistrado }
        ];

        const width = 400;
        const height = 300;
        const margin = { top: 40, right: 30, bottom: 60, left: 40 }; // Incremento en el margen superior para dar espacio al título

        const svg = d3.select(chartDiv).append('svg')
            .attr('width', width)
            .attr('height', height)
            .style("filter", "drop-shadow(3px 3px 3px rgba(0, 0, 0, 0.4))");

        const x = d3.scaleBand()
            .domain(data.map(d => d.name))
            .range([margin.left, width - margin.right])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, rangoEscala[1]]).nice()
            .range([height - margin.bottom, margin.top]);

        const xAxis = g => g
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickSizeOuter(0));

        const yAxis = g => g
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(y))
            .call(g => g.select('.domain').remove());

        svg.append('g')
            .selectAll('rect')
            .data(data)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.name))
            .attr('y', d => y(d.value))
            .attr('height', d => y(0) - y(d.value))
            .attr('width', x.bandwidth())
            .attr('fill', d => d.color)
            .style('filter', 'url(#3d-bar-filter)'); // Añadir filtro 3D

        svg.selectAll('rect')
            .each(function (d) {
                d3.select(this.parentNode).append('text')
                    .attr('x', x(d.name) + x.bandwidth() / 2)
                    .attr('y', y(d.value) - 5)
                    .attr('text-anchor', 'middle')
                    .text(d.value);
            });

        svg.append('g').call(xAxis);
        svg.append('g').call(yAxis);

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', margin.top / 2) // Posición del título en la parte superior del gráfico
            .attr('text-anchor', 'middle')
            .attr('font-size', '16px') // Tamaño del texto del título
            .text(titulo);

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height + margin.bottom - 10) // Ajuste de la posición del pie de gráfico
            .attr('text-anchor', 'middle')
            .text('Valor');

        // Definir el filtro 3D
        svg.append('defs')
            .append('filter')
            .attr('id', '3d-bar-filter')
            .append('feDropShadow')
            .attr('dx', 3)
            .attr('dy', 3)
            .attr('stdDeviation', 2)
            .attr('flood-color', 'rgba(0, 0, 0, 0.4)');
    });
}


function generarGraficoBarras(registro) {
    // Limpiar el área de información al cambiar de pestaña
    limpiarInfoArea();
    const infoArea = document.querySelector('.info-area');
    infoArea.innerHTML = '<h2><i class="fas fa-info-circle"></i> Información Adicional</h2><br><br>';

    // Crear fila para los tres primeros gráficos
    const fila1Div = document.createElement('div');
    fila1Div.className = 'fila-graficos';
    infoArea.appendChild(fila1Div);

    // Ajustar tamaño de los contenedores
    const chartSize = 400;

    // Primer gráfico: Diversidad según Shannon
    const shannonDiv = document.createElement('div');
    shannonDiv.className = 'chart grande';
    shannonDiv.style.width = `${chartSize}px`;
    shannonDiv.style.height = `${chartSize}px`;
    fila1Div.appendChild(shannonDiv);

    const shannonValor = parseFloat(registro['DIVERSIDAD SEGÚN SHANNON']);
    const shannonData = [{ name: 'Diversidad', value: shannonValor, color: 'yellow', calidad: registro['CALIDAD DEL AGUA SEGÚN SHANNON'] }];
    crearGraficoBarrasSimple(shannonDiv, shannonData, 'ÍNDICE DE DIVERSIDAD SEGÚN SHANNON', 0, 3);

    // Segundo gráfico: Comparación del ÍNDICE BMWP/Col
    const bmwpDiv = document.createElement('div');
    bmwpDiv.className = 'chart grande';
    bmwpDiv.style.width = `${chartSize}px`;
    bmwpDiv.style.height = `${chartSize}px`;
    fila1Div.appendChild(bmwpDiv);

    const bmwpValor = parseFloat(registro['ÍNDICE BMWP/Col']);
    let bmwpColor;
    if (bmwpValor < 36) bmwpColor = 'red';
    else if (bmwpValor < 60) bmwpColor = 'yellow';
    else if (bmwpValor < 85) bmwpColor = 'green';
    else bmwpColor = 'blue';

    const bmwpData = [
        { name: 'Valor Admisible', value: 85, color: 'blue', indice: 'ÍNDICE BMWP/Col.1' },
        { name: 'Valor Registrado', value: bmwpValor, color: bmwpColor, indice: 'ÍNDICE BMWP/Col.1' }
    ];

    crearGraficoBarrasSimple(bmwpDiv, bmwpData, 'Comparación del ÍNDICE BMWP/Col', 0, 130);

    // Tercer gráfico: Diagrama de sectores de la riqueza absoluta
    const riquezaDiv = document.createElement('div');
    riquezaDiv.className = 'chart grande';
    riquezaDiv.style.width = `${chartSize}px`;
    riquezaDiv.style.height = `${chartSize}px`;
    fila1Div.appendChild(riquezaDiv);

    const niveles = ['Nivel 10', 'Nivel 9', 'Nivel 8', 'Nivel 7', 'Nivel 6', 'Nivel 5', 'Nivel 4', 'Nivel 3', 'Nivel 2', 'Nivel 1'];
    const riquezaAbsoluta = niveles.reduce((sum, nivel) => sum + parseFloat(registro[nivel]), 0);

    const riquezaData = niveles.map((nivel, index) => ({
        name: nivel,
        value: parseFloat(registro[nivel]),
        level: 10 - index // Niveles de 10 a 1
    }));

    crearDiagramaSectores(riquezaDiv, riquezaData, 'Presencia de Macroinvertebrados', riquezaAbsoluta);

    // Crear fila para el cuarto gráfico
    const fila2Div = document.createElement('div');
    fila2Div.className = 'fila-graficos';
    infoArea.appendChild(fila2Div);

    // Cuarto gráfico: Comparación de los niveles
    const nivelesDiv = document.createElement('div');
    nivelesDiv.className = 'chart extendido';
    nivelesDiv.style.width = `${chartSize}px`;
    nivelesDiv.style.height = `${chartSize}px`;
    fila2Div.appendChild(nivelesDiv);

    const nivelesData = niveles.map(nivel => ({
        name: nivel,
        value: parseFloat(registro[nivel]),
        color: 'steelblue'
    }));

    crearGraficoBarrasSimple(nivelesDiv, nivelesData, 'Comparación de Niveles', 0, Math.max(...nivelesData.map(d => d.value)) + 10);

    // Funciones para crear los gráficos
    function crearGraficoBarrasSimple(container, data, title, yMin, yMax) {
        const width = 400;
        const height = 400;
        const margin = { top: 60, right: 20, bottom: 40, left: 40 };

        const svg = d3.select(container).append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('filter', 'drop-shadow(3px 3px 3px rgba(0, 0, 0, 0.4))');

        const x = d3.scaleBand()
            .domain(data.map(d => d.name))
            .range([margin.left, width - margin.right])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([yMin, yMax]).nice()
            .range([height - margin.bottom, margin.top]);

        const xAxis = g => g
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickSizeOuter(0));

        const yAxis = g => g
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(y))
            .call(g => g.select('.domain').remove());

        svg.append('g')
            .selectAll('rect')
            .data(data)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.name))
            .attr('y', d => y(d.value))
            .attr('height', d => y(0) - y(d.value))
            .attr('width', x.bandwidth())
            .attr('fill', d => d.color)
            .style('filter', 'url(#3d-bar-filter)') // Añadir filtro 3D
            .on('mouseover', function(event, d) {
                d3.select(this).attr('fill', d3.rgb(d.color).darker(2));
                const [mouseX, mouseY] = d3.pointer(event);
                d3.select(container).append('text')
                    .attr('class', 'tooltip')
                    .attr('x', mouseX)
                    .attr('y', mouseY - 10)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '12px')
                    .attr('font-weight', 'bold')
                    .attr('fill', 'black')
                    .text(d.calidad || d.indice || d.value);
            })
            .on('mouseout', function(event, d) {
                d3.select(this).attr('fill', d.color);
                d3.selectAll('.tooltip').remove();
            });

        svg.append('g').call(xAxis);
        svg.append('g').call(yAxis);

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', margin.top / 2)
            .attr('text-anchor', 'middle')
            .attr('font-size', '16px')
            .text(title);

        // Añadir los valores en la barra
        svg.selectAll(".text")        
            .data(data)
            .enter()
            .append("text")
            .attr("class","label")
            .attr("x", (d) => x(d.name) + x.bandwidth() / 2)
            .attr("y", (d) => y(d.value) - 5)
            .attr("text-anchor", "middle")
            .text((d) => d.value);

        // Definir el filtro 3D
        svg.append('defs')
            .append('filter')
            .attr('id', '3d-bar-filter')
            .append('feDropShadow')
            .attr('dx', 3)
            .attr('dy', 3)
            .attr('stdDeviation', 2)
            .attr('flood-color', 'rgba(0, 0, 0, 0.4)');

        return svg;
    }

    function crearDiagramaSectores(container, data, title, total) {
        const width = 350;
        const height = 350;
        const margin = 50;  // Margen para el título y el pie de página
        const radius = Math.min(width, height - margin * 2) / 2;  // Ajustar el radio para que encaje en el espacio disponible
        const arc = d3.arc().outerRadius(radius - 10).innerRadius(0);
        const labelArc = d3.arc().outerRadius(radius - 40).innerRadius(radius - 40);
        const pie = d3.pie().sort(null).value(d => d.value);
    
        const colors = {
            10: '#0000CC',
            9: '#0000FF',
            8: '#00FF00',
            7: '#66FF66',
            6: '#FFFF00',
            5: '#CCCC00',
            4: '#FFA500',
            3: '#FF8C00',
            2: '#FF0000',
            1: '#8B0000'
        };
    
        const svg = d3.select(container).append('svg')
            .attr('width', width)
            .attr('height', height + margin * 2);  // Aumentamos la altura para el margen superior e inferior
    
        // Título
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', margin / 2)  // Posicionar el título en el margen superior
            .attr('text-anchor', 'middle')
            .attr('font-size', '16px')
            .text(title);
    
        // Grupo del gráfico
        const g = svg.append('g')
            .attr('transform', `translate(${width / 2},${(height / 2) + margin})`);
    
        const filteredData = data.filter(d => d.value > 0);
    
        const arcs = g.selectAll('.arc')
            .data(pie(filteredData))
            .enter().append('g')
            .attr('class', 'arc');
    
        arcs.append('path')
            .attr('d', arc)
            .style('fill', d => colors[d.data.level])
            .style('filter', 'url(#3d-sector-filter)') // Añadir filtro 3D
            .on('mouseover', function(event, d) {
                d3.select(this).transition()
                    .duration(200)
                    .attr('d', d3.arc().outerRadius(radius).innerRadius(0));
    
                const percentage = ((d.data.value / total) * 100).toFixed(2);
    
                // Actualizar el contenido del texto fijo
                fixedTooltip.html(`<div>Nivel ${d.data.level}: ${d.data.value}</div><div>${percentage}%</div>`);
            })
            .on('mouseout', function() {
                d3.select(this).transition()
                    .duration(200)
                    .attr('d', arc);
    
                // Limpiar el contenido del texto fijo al salir del sector
                fixedTooltip.html('');
            });
    
        arcs.append('text')
            .attr('transform', d => `translate(${labelArc.centroid(d)})`)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .text(d => d.data.value);
    
        // Texto de "Riqueza Absoluta"
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height + margin - 10)  // Posicionar el texto de "Riqueza Absoluta" en el margen inferior
            .attr('text-anchor', 'middle')
            .attr('font-size', '14px')
            .text(`Riqueza Absoluta: ${total}`);
    
        // Crear un elemento para el tooltip fijo
        const fixedTooltip = d3.select(container).append('div')
            .attr('class', 'fixed-tooltip')
            .style('position', 'absolute')
            .style('top', '50px')  // Posicionar el tooltip fijo en el margen superior
            .style('left', '40%')
            .style('transform', 'translateX(-50%)')
            .style('background', '#fff')
            .style('border', '1px solid #ccc')
            .style('padding', '5px')
            .style('pointer-events', 'none');

        // Definir el filtro 3D
        svg.append('defs')
            .append('filter')
            .attr('id', '3d-sector-filter')
            .append('feDropShadow')
            .attr('dx', 3)
            .attr('dy', 3)
            .attr('stdDeviation', 2)
            .attr('flood-color', 'rgba(0, 0, 0, 0.4)');

        return svg;
    }
}
