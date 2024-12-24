if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then((registration) => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, (err) => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

let montosGastos = JSON.parse(localStorage.getItem('montosGastos')) || {};
let montosIngresos = JSON.parse(localStorage.getItem('montosIngresos')) || {};
let graficaCombinada;

function guardarMonto(tipo) {
    const fechaInput = document.getElementById(`fecha${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);
    const montoInput = document.getElementById(`monto${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);
    const fecha = fechaInput.value;
    const monto = parseFloat(montoInput.value);
    if (!isNaN(monto) && fecha) {
        if (tipo === 'gasto') {
            if (!montosGastos[fecha]) {
                montosGastos[fecha] = 0;
            }
            montosGastos[fecha] += monto;
            localStorage.setItem('montosGastos', JSON.stringify(montosGastos));
        } else if (tipo === 'ingreso') {
            if (!montosIngresos[fecha]) {
                montosIngresos[fecha] = 0;
            }
            montosIngresos[fecha] += monto;
            localStorage.setItem('montosIngresos', JSON.stringify(montosIngresos));
        }
        montoInput.value = '';
        fechaInput.value = '';
        actualizarGraficaCombinada();
        cargarDatos(); // Actualizar los datos en la página principal
    }
}

function borrarUltimoDato(tipo) {
    let datos = tipo === 'gasto' ? montosGastos : montosIngresos;
    let clave = Object.keys(datos).pop();
    if (clave) {
        delete datos[clave];
        if (tipo === 'gasto') {
            localStorage.setItem('montosGastos', JSON.stringify(montosGastos));
        } else if (tipo === 'ingreso') {
            localStorage.setItem('montosIngresos', JSON.stringify(montosIngresos));
        }
        actualizarGraficaCombinada();
        cargarDatos(); // Actualizar los datos en la página principal
    }
}

function actualizarGraficaCombinada() {
    if (graficaCombinada) {
        graficaCombinada.destroy();
    }

    const fechas = [...new Set([...Object.keys(montosGastos), ...Object.keys(montosIngresos)])].sort();
    const datosGastos = fechas.map(fecha => montosGastos[fecha] || 0);
    const datosIngresos = fechas.map(fecha => montosIngresos[fecha] || 0);

    const ctx = document.getElementById('graficaCombinada');
    if (ctx) {
        graficaCombinada = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: fechas,
                datasets: [
                    {
                        label: 'Gastos',
                        data: datosGastos,
                        backgroundColor: 'rgba(255, 99, 132, 0.6)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Ingresos',
                        data: datosIngresos,
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
                            }
                        }
                    },
                    x: {
                        stacked: true,
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.raw !== null) {
                                    label += new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(context.raw);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
}

function cargarDatos() {
    const presupuesto = document.getElementById('presupuesto');
    const gastosTotales = document.getElementById('gastosTotales');
    const ingresosTotales = document.getElementById('ingresosTotales');
    const detallesGastos = document.getElementById('detallesGastos');
    const detallesIngresos = document.getElementById('detallesIngresos');

    const totalGastos = Object.values(montosGastos).reduce((total, monto) => total + monto, 0);
    const totalIngresos = Object.values(montosIngresos).reduce((total, monto) => total + monto, 0);
    const presupuestoTotal = totalIngresos - totalGastos;

    if (presupuesto) presupuesto.textContent = `S/. ${presupuestoTotal.toFixed(2)}`;
    if (gastosTotales) gastosTotales.textContent = `S/. ${totalGastos.toFixed(2)}`;
    if (ingresosTotales) ingresosTotales.textContent = `S/. ${totalIngresos.toFixed(2)}`;

    if (detallesGastos) {
        detallesGastos.innerHTML = '';
        for (const [fecha, monto] of Object.entries(montosGastos)) {
            const li = document.createElement('li');
            li.textContent = `${fecha}: S/. ${monto.toFixed(2)}`;
            detallesGastos.appendChild(li);
        }
    }

    if (detallesIngresos) {
        detallesIngresos.innerHTML = '';
        for (const [fecha, monto] of Object.entries(montosIngresos)) {
            const li = document.createElement('li');
            li.textContent = `${fecha}: S/. ${monto.toFixed(2)}`;
            detallesIngresos.appendChild(li);
        }
    }
}

// Cargar datos al iniciar la página
window.addEventListener('load', cargarDatos);
                      
