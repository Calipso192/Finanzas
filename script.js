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
    const montoInput = document.getElementById(`monto${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);
    const monto = parseFloat(montoInput.value);
    if (!isNaN(monto)) {
        const fecha = new Date().toISOString().split('T')[0]; // Obtener la fecha actual en formato YYYY-MM-DD
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
        actualizarGraficaCombinada();
    }
}

function actualizarGraficaCombinada() {
    if (graficaCombinada) {
        graficaCombinada.destroy();
    }

    const fechas = [...new Set([...Object.keys(montosGastos), ...Object.keys(montosIngresos)])].sort();
    const datosGastos = fechas.map(fecha => montosGastos[fecha] || 0);
    const datosIngresos = fechas.map(fecha => montosIngresos[fecha] || 0);

    const ctx = document.getElementById('graficaCombinada').getContext('2d');
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
                            return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
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
                            if (context.parsed !== null) {
                                label += new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(context.parsed);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Cargar datos almacenados al iniciar la página
window.addEventListener('load', actualizarGraficaCombinada);
