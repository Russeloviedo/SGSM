// ============================================
// DASHBOARD ANALYTICS FUNCTIONS
// ============================================

let dashboardData = []; // All records from backend
let chartInstances = {}; // Store chart instances for updates
window.chartInstances = chartInstances; // Expose globally for export module

function openDashboard(e) {
    if (e) e.preventDefault();
    console.log("openDashboard called");

    // Hide main content, show dashboard
    const mainForm = document.getElementById('nutritionForm');
    const header = document.querySelector('header');
    const dashSection = document.getElementById('dashboardSection');

    if (!dashSection) {
        alert("Error: Dashboard section not found");
        return;
    }

    if (mainForm) mainForm.style.display = 'none';
    if (header) header.style.display = 'none';
    dashSection.style.display = 'block';

    // Initialize Lucide Icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // Load data if not already loaded
    if (dashboardData.length === 0) {
        loadDashboardData();
    } else {
        applyDashboardFilters();
    }
}

function closeDashboard() {
    document.getElementById('dashboardSection').style.display = 'none';
    const mainForm = document.getElementById('nutritionForm');
    const header = document.querySelector('header');
    if (mainForm) mainForm.style.display = 'block';
    if (header) header.style.display = 'block';
}

async function loadDashboardData() {
    const loadingEl = document.getElementById('dashboardLoading');
    loadingEl.style.display = 'flex';

    try {
        consttoken = sessionStorage.getItem('sessionToken');
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'getDashboardData',
                token: sessionStorage.getItem('sessionToken') // Fix: defined token but used variable name directly if local, safe to re-get
            })
        });

        const result = await response.json();

        if (result.success && result.records) {
            dashboardData = result.records;
            populateFilterOptions(dashboardData);
            applyDashboardFilters();
        } else {
            alert('Error cargando datos del dashboard: ' + (result.error || 'Desconocido'));
        }
    } catch (error) {
        console.error('Dashboard load error:', error);
        alert('Error de conexión al cargar dashboard');
    } finally {
        loadingEl.style.display = 'none';
    }
}

function populateFilterOptions(records) {
    // Get unique values for each filter
    const plantas = [...new Set(records.map(r => r.planta).filter(Boolean))].sort();
    const programas = [...new Set(records.flatMap(r => (r.programas || '').split(',').map(p => p.trim())).filter(Boolean))].sort();
    const turnos = [...new Set(records.map(r => r.turno).filter(Boolean))].sort();

    // Populate Planta dropdown
    const plantaSelect = document.getElementById('filterPlanta');
    plantaSelect.innerHTML = '<option value="">Todas</option>';
    plantas.forEach(p => plantaSelect.innerHTML += `<option value="${p}">${p}</option>`);

    // Populate Programa dropdown
    const programaSelect = document.getElementById('filterPrograma');
    programaSelect.innerHTML = '<option value="">Todos</option>';
    programas.forEach(p => programaSelect.innerHTML += `<option value="${p}">${p}</option>`);

    // Populate Turno dropdown
    const turnoSelect = document.getElementById('filterTurno');
    turnoSelect.innerHTML = '<option value="">Todos</option>';
    turnos.forEach(t => turnoSelect.innerHTML += `<option value="${t}">${t}</option>`);
}

function applyDashboardFilters() {
    const filterPlanta = document.getElementById('filterPlanta').value;
    const filterPrograma = document.getElementById('filterPrograma').value;
    const filterGenero = document.getElementById('filterGenero').value;
    const filterTurno = document.getElementById('filterTurno').value;
    const filterFechaDesde = document.getElementById('filterFechaDesde').value;
    const filterFechaHasta = document.getElementById('filterFechaHasta').value;

    let filtered = dashboardData.filter(record => {
        if (filterPlanta && record.planta !== filterPlanta) return false;
        if (filterPrograma && !(record.programas || '').includes(filterPrograma)) return false;
        if (filterGenero && record.genero !== filterGenero) return false;
        if (filterTurno && record.turno !== filterTurno) return false;

        // Date range filter
        if (filterFechaDesde || filterFechaHasta) {
            const recordDate = new Date(record.fechaRegistro);
            if (isNaN(recordDate.getTime())) return true; // Skip if no valid date

            if (filterFechaDesde) {
                const desde = new Date(filterFechaDesde);
                if (recordDate < desde) return false;
            }
            if (filterFechaHasta) {
                const hasta = new Date(filterFechaHasta);
                hasta.setHours(23, 59, 59, 999); // Include entire day
                if (recordDate > hasta) return false;
            }
        }

        return true;
    });

    renderKPIs(filtered);
    renderAllCharts(filtered);
}

function clearDashboardFilters() {
    document.getElementById('filterPlanta').value = '';
    document.getElementById('filterPrograma').value = '';
    document.getElementById('filterGenero').value = '';
    document.getElementById('filterTurno').value = '';
    document.getElementById('filterFechaDesde').value = '';
    document.getElementById('filterFechaHasta').value = '';
    applyDashboardFilters();
}

function renderKPIs(records) {
    // Total Employees
    document.getElementById('kpiTotal').textContent = records.length;

    // Average IMC
    const imcValues = records.map(r => parseFloat(r.imc)).filter(v => !isNaN(v) && v > 0);
    const avgIMC = imcValues.length > 0 ? (imcValues.reduce((a, b) => a + b, 0) / imcValues.length).toFixed(1) : '--';
    document.getElementById('kpiIMC').textContent = avgIMC;

    // % Overweight/Obese (IMC >= 25)
    const overweight = imcValues.filter(v => v >= 25).length;
    const pctObesidad = imcValues.length > 0 ? ((overweight / imcValues.length) * 100).toFixed(0) + '%' : '--';
    document.getElementById('kpiObesidad').textContent = pctObesidad;

    // % Hypertension (Sistólica >= 140 or Diastólica >= 90)
    const hipertensos = records.filter(r => {
        const sis = parseFloat(r.taSistolica);
        const dia = parseFloat(r.taDiastolica);
        return (sis >= 140 || dia >= 90);
    }).length;
    const pctHipertension = records.length > 0 ? ((hipertensos / records.length) * 100).toFixed(0) + '%' : '--';
    document.getElementById('kpiHipertension').textContent = pctHipertension;
}

function renderAllCharts(records) {
    renderIMCChart(records);
    renderGeneroChart(records);
    renderProgramasChart(records);
    renderPlantasChart(records);
    renderTurnosChart(records);
    renderEdadesChart(records);
    renderGlucosaChart(records);
    renderPresionChart(records);
    renderPadecimientosChart(records);
}

function getIMCCategory(imc) {
    if (imc < 18.5) return 'Bajo Peso';
    if (imc < 25) return 'Normal';
    if (imc < 30) return 'Sobrepeso';
    if (imc < 35) return 'Obesidad I';
    if (imc < 40) return 'Obesidad II';
    return 'Obesidad III';
}

function renderIMCChart(records) {
    const categories = { 'Bajo Peso': 0, 'Normal': 0, 'Sobrepeso': 0, 'Obesidad I': 0, 'Obesidad II': 0, 'Obesidad III': 0 };
    records.forEach(r => {
        const imc = parseFloat(r.imc);
        if (!isNaN(imc) && imc > 0) {
            categories[getIMCCategory(imc)]++;
        }
    });

    const options = {
        series: Object.values(categories),
        chart: { type: 'donut', height: 300 },
        labels: Object.keys(categories),
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
        legend: { position: 'bottom' },
        dataLabels: { enabled: true, formatter: (val) => val.toFixed(0) + '%' }
    };

    if (chartInstances.chartIMC) {
        chartInstances.chartIMC.updateOptions(options);
    } else {
        chartInstances.chartIMC = new ApexCharts(document.getElementById('chartIMC'), options);
        chartInstances.chartIMC.render();
    }
}

function renderGeneroChart(records) {
    const generos = { 'Masculino': 0, 'Femenino': 0 };
    records.forEach(r => {
        if (r.genero === 'Masculino') generos['Masculino']++;
        else if (r.genero === 'Femenino') generos['Femenino']++;
    });

    const options = {
        series: Object.values(generos),
        chart: { type: 'pie', height: 300 },
        labels: Object.keys(generos),
        colors: ['#3b82f6', '#ec4899'],
        legend: { position: 'bottom' },
        dataLabels: { enabled: true, formatter: (val) => val.toFixed(0) + '%' }
    };

    if (chartInstances.chartGenero) {
        chartInstances.chartGenero.updateOptions(options);
    } else {
        chartInstances.chartGenero = new ApexCharts(document.getElementById('chartGenero'), options);
        chartInstances.chartGenero.render();
    }
}

function renderProgramasChart(records) {
    const programas = {};
    records.forEach(r => {
        if (r.programas) {
            r.programas.split(',').forEach(p => {
                const clean = p.trim();
                if (clean) programas[clean] = (programas[clean] || 0) + 1;
            });
        }
    });

    const sorted = Object.entries(programas).sort((a, b) => b[1] - a[1]).slice(0, 8);

    const options = {
        series: [{ name: 'Empleados', data: sorted.map(p => p[1]) }],
        chart: { type: 'bar', height: 300 },
        plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
        xaxis: { categories: sorted.map(p => p[0]) },
        colors: ['#10b981'],
        dataLabels: { enabled: true }
    };

    if (chartInstances.chartProgramas) {
        chartInstances.chartProgramas.updateOptions(options);
    } else {
        chartInstances.chartProgramas = new ApexCharts(document.getElementById('chartProgramas'), options);
        chartInstances.chartProgramas.render();
    }
}

function renderPlantasChart(records) {
    const plantas = {};
    records.forEach(r => {
        if (r.planta) plantas[r.planta] = (plantas[r.planta] || 0) + 1;
    });

    const options = {
        series: [{ name: 'Empleados', data: Object.values(plantas) }],
        chart: { type: 'bar', height: 300 },
        plotOptions: { bar: { columnWidth: '60%', borderRadius: 6 } },
        xaxis: { categories: Object.keys(plantas) },
        colors: ['#3b82f6'],
        dataLabels: { enabled: true }
    };

    if (chartInstances.chartPlantas) {
        chartInstances.chartPlantas.updateOptions(options);
    } else {
        chartInstances.chartPlantas = new ApexCharts(document.getElementById('chartPlantas'), options);
        chartInstances.chartPlantas.render();
    }
}

function renderTurnosChart(records) {
    const turnos = {};
    records.forEach(r => {
        if (r.turno) turnos[r.turno] = (turnos[r.turno] || 0) + 1;
    });

    const options = {
        series: Object.values(turnos),
        chart: { type: 'donut', height: 300 },
        labels: Object.keys(turnos),
        colors: ['#f59e0b', '#8b5cf6', '#06b6d4'],
        legend: { position: 'bottom' },
        dataLabels: { enabled: true, formatter: (val) => val.toFixed(0) + '%' }
    };

    if (chartInstances.chartTurnos) {
        chartInstances.chartTurnos.updateOptions(options);
    } else {
        chartInstances.chartTurnos = new ApexCharts(document.getElementById('chartTurnos'), options);
        chartInstances.chartTurnos.render();
    }
}

function renderEdadesChart(records) {
    const ranges = { '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '56+': 0 };
    records.forEach(r => {
        const edad = parseInt(r.edad);
        if (!isNaN(edad)) {
            if (edad <= 25) ranges['18-25']++;
            else if (edad <= 35) ranges['26-35']++;
            else if (edad <= 45) ranges['36-45']++;
            else if (edad <= 55) ranges['46-55']++;
            else ranges['56+']++;
        }
    });

    const options = {
        series: [{ name: 'Empleados', data: Object.values(ranges) }],
        chart: { type: 'bar', height: 300 },
        plotOptions: { bar: { columnWidth: '60%', borderRadius: 6, distributed: true } },
        xaxis: { categories: Object.keys(ranges) },
        colors: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'],
        legend: { show: false },
        dataLabels: { enabled: true }
    };

    if (chartInstances.chartEdades) {
        chartInstances.chartEdades.updateOptions(options);
    } else {
        chartInstances.chartEdades = new ApexCharts(document.getElementById('chartEdades'), options);
        chartInstances.chartEdades.render();
    }
}

// Glucosa Distribution Chart
function renderGlucosaChart(records) {
    const categories = { 'Normal (<100)': 0, 'Prediabetes (100-125)': 0, 'Diabetes (≥126)': 0 };
    records.forEach(r => {
        const glucosa = parseFloat(r.glucometria);
        if (!isNaN(glucosa) && glucosa > 0) {
            if (glucosa < 100) categories['Normal (<100)']++;
            else if (glucosa < 126) categories['Prediabetes (100-125)']++;
            else categories['Diabetes (≥126)']++;
        }
    });

    const options = {
        series: Object.values(categories),
        chart: { type: 'donut', height: 300 },
        labels: Object.keys(categories),
        colors: ['#10b981', '#f59e0b', '#ef4444'],
        legend: { position: 'bottom' },
        dataLabels: { enabled: true, formatter: (val) => val.toFixed(0) + '%' }
    };

    if (chartInstances.chartGlucosa) {
        chartInstances.chartGlucosa.updateOptions(options);
    } else {
        chartInstances.chartGlucosa = new ApexCharts(document.getElementById('chartGlucosa'), options);
        chartInstances.chartGlucosa.render();
    }
}

// Blood Pressure Distribution Chart
function renderPresionChart(records) {
    const categories = { 'Normal': 0, 'Elevada': 0, 'Hipertensión I': 0, 'Hipertensión II': 0 };
    records.forEach(r => {
        const sis = parseFloat(r.taSistolica);
        const dia = parseFloat(r.taDiastolica);
        if (!isNaN(sis) && !isNaN(dia) && sis > 0 && dia > 0) {
            if (sis < 120 && dia < 80) categories['Normal']++;
            else if (sis < 130 && dia < 80) categories['Elevada']++;
            else if (sis < 140 || dia < 90) categories['Hipertensión I']++;
            else categories['Hipertensión II']++;
        }
    });

    const options = {
        series: Object.values(categories),
        chart: { type: 'donut', height: 300 },
        labels: Object.keys(categories),
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
        legend: { position: 'bottom' },
        dataLabels: { enabled: true, formatter: (val) => val.toFixed(0) + '%' }
    };

    if (chartInstances.chartPresion) {
        chartInstances.chartPresion.updateOptions(options);
    } else {
        chartInstances.chartPresion = new ApexCharts(document.getElementById('chartPresion'), options);
        chartInstances.chartPresion.render();
    }
}

// Top 10 Padecimientos Chart
function renderPadecimientosChart(records) {
    const padecimientos = {};
    records.forEach(r => {
        const fields = ['padecimiento'];
        fields.forEach(field => {
            const val = String(r[field] || '');
            if (val.trim() && val.toLowerCase() !== 'ninguno' && val.toLowerCase() !== 'no') {
                const items = val.split(',');
                items.forEach(item => {
                    const clean = item.trim();
                    if (clean) padecimientos[clean] = (padecimientos[clean] || 0) + 1;
                });
            }
        });
    });

    const sorted = Object.entries(padecimientos).sort((a, b) => b[1] - a[1]).slice(0, 10);

    const options = {
        series: [{ name: 'Casos', data: sorted.map(p => p[1]) }],
        chart: { type: 'bar', height: 300 },
        plotOptions: { bar: { horizontal: true, borderRadius: 4, distributed: true } },
        xaxis: { categories: sorted.map(p => p[0]) },
        colors: ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#14b8a6', '#f97316', '#a855f7'],
        legend: { show: false },
        dataLabels: { enabled: true }
    };

    if (chartInstances.chartPadecimientos) {
        chartInstances.chartPadecimientos.updateOptions(options);
    } else {
        chartInstances.chartPadecimientos = new ApexCharts(document.getElementById('chartPadecimientos'), options);
        chartInstances.chartPadecimientos.render();
    }
}
