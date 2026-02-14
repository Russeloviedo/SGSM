// ============================================
// REPORT EXPORT MODULE
// ============================================

/**
 * This module handles exporting dashboard data to PDF and Excel formats.
 * Features:
 * - Respects active dashboard filters
 * - PDF: Chart selection modal, executive summary, data-focused interpretations
 * - Excel: Structured tables with risk classification column
 * - Filter traceability in headers
 * - Comparative indicators vs. total population
 */

// ============================================
// INITIALIZATION
// ============================================

function initExportModule() {
    // Setup dropdown toggle
    const exportBtn = document.getElementById('exportReportBtn');
    const exportMenu = document.getElementById('exportDropdownMenu');

    if (exportBtn && exportMenu) {
        exportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            exportMenu.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            exportMenu.classList.remove('show');
        });
    }
}

// ============================================
// UTILITY: Get Current Filters as String
// ============================================

function getActiveFiltersLabel() {
    const planta = document.getElementById('filterPlanta')?.value || 'Todas';
    const programa = document.getElementById('filterPrograma')?.value || 'Todos';
    const genero = document.getElementById('filterGenero')?.value || 'Todos';
    const turno = document.getElementById('filterTurno')?.value || 'Todos';
    const fechaDesde = document.getElementById('filterFechaDesde')?.value || '';
    const fechaHasta = document.getElementById('filterFechaHasta')?.value || '';

    let parts = [];
    if (planta && planta !== 'Todas') parts.push(`Planta: ${planta}`);
    if (programa && programa !== 'Todos') parts.push(`Programa: ${programa}`);
    if (genero && genero !== 'Todos') parts.push(`Género: ${genero}`);
    if (turno && turno !== 'Todos') parts.push(`Turno: ${turno}`);
    if (fechaDesde) parts.push(`Desde: ${fechaDesde}`);
    if (fechaHasta) parts.push(`Hasta: ${fechaHasta}`);

    return parts.length > 0 ? parts.join(' | ') : 'Sin filtros aplicados';
}

// ============================================
// UTILITY: Get Filtered Data
// ============================================

function getFilteredDashboardData() {
    // Reuse the filter logic from dashboard.js
    const filterPlanta = document.getElementById('filterPlanta')?.value || '';
    const filterPrograma = document.getElementById('filterPrograma')?.value || '';
    const filterGenero = document.getElementById('filterGenero')?.value || '';
    const filterTurno = document.getElementById('filterTurno')?.value || '';
    const filterFechaDesde = document.getElementById('filterFechaDesde')?.value || '';
    const filterFechaHasta = document.getElementById('filterFechaHasta')?.value || '';

    return dashboardData.filter(record => {
        if (filterPlanta && record.planta !== filterPlanta) return false;
        if (filterPrograma && !(record.programas || '').includes(filterPrograma)) return false;
        if (filterGenero && record.genero !== filterGenero) return false;
        if (filterTurno && record.turno !== filterTurno) return false;

        if (filterFechaDesde || filterFechaHasta) {
            const recordDate = new Date(record.fechaRegistro);
            if (isNaN(recordDate.getTime())) return true;
            if (filterFechaDesde && recordDate < new Date(filterFechaDesde)) return false;
            if (filterFechaHasta) {
                const hasta = new Date(filterFechaHasta);
                hasta.setHours(23, 59, 59, 999);
                if (recordDate > hasta) return false;
            }
        }
        return true;
    });
}

// ============================================
// UTILITY: Classify Risk Level
// ============================================

function classifyRiskLevel(record) {
    let riskScore = 0;

    const imc = parseFloat(record.imc);
    if (!isNaN(imc)) {
        if (imc >= 30) riskScore += 2; // Obesity
        else if (imc >= 25) riskScore += 1; // Overweight
    }

    const glucosa = parseFloat(record.glucometria);
    if (!isNaN(glucosa)) {
        if (glucosa >= 126) riskScore += 2; // Diabetes
        else if (glucosa >= 100) riskScore += 1; // Prediabetes
    }

    const taSis = parseFloat(record.taSistolica);
    const taDia = parseFloat(record.taDiastolica);
    if (!isNaN(taSis) && !isNaN(taDia)) {
        if (taSis >= 140 || taDia >= 90) riskScore += 2; // Hypertension Stage 2
        else if (taSis >= 130 || taDia >= 80) riskScore += 1; // Hypertension Stage 1
    }

    if (riskScore >= 4) return 'Alto';
    if (riskScore >= 2) return 'Medio';
    return 'Bajo';
}

// ============================================
// INTERPRETATION GENERATORS (Data-Focused)
// ============================================

function generateIMCInterpretation(records) {
    const categories = { 'Bajo Peso': 0, 'Normal': 0, 'Sobrepeso': 0, 'Obesidad I': 0, 'Obesidad II': 0, 'Obesidad III': 0 };
    let validCount = 0;

    records.forEach(r => {
        const imc = parseFloat(r.imc);
        if (!isNaN(imc) && imc > 0) {
            validCount++;
            if (imc < 18.5) categories['Bajo Peso']++;
            else if (imc < 25) categories['Normal']++;
            else if (imc < 30) categories['Sobrepeso']++;
            else if (imc < 35) categories['Obesidad I']++;
            else if (imc < 40) categories['Obesidad II']++;
            else categories['Obesidad III']++;
        }
    });

    if (validCount === 0) return 'No hay datos de IMC disponibles para este grupo.';

    const parts = Object.entries(categories)
        .filter(([_, count]) => count > 0)
        .map(([cat, count]) => `${((count / validCount) * 100).toFixed(1)}% ${cat} (${count})`)
        .join(', ');

    return `Distribución de IMC: ${parts}. Total evaluados: ${validCount}.`;
}

function generateGlucosaInterpretation(records) {
    const categories = { 'Normal (<100)': 0, 'Prediabetes (100-125)': 0, 'Diabetes (≥126)': 0 };
    let validCount = 0;

    records.forEach(r => {
        const glucosa = parseFloat(r.glucometria);
        if (!isNaN(glucosa) && glucosa > 0) {
            validCount++;
            if (glucosa < 100) categories['Normal (<100)']++;
            else if (glucosa < 126) categories['Prediabetes (100-125)']++;
            else categories['Diabetes (≥126)']++;
        }
    });

    if (validCount === 0) return 'No hay datos de glucosa disponibles para este grupo.';

    const parts = Object.entries(categories)
        .filter(([_, count]) => count > 0)
        .map(([cat, count]) => `${((count / validCount) * 100).toFixed(1)}% ${cat} (${count})`)
        .join(', ');

    return `Distribución de Glucosa: ${parts}. Total evaluados: ${validCount}.`;
}

function generatePresionInterpretation(records) {
    const categories = { 'Normal': 0, 'Elevada': 0, 'Hipertensión I': 0, 'Hipertensión II': 0 };
    let validCount = 0;

    records.forEach(r => {
        const sis = parseFloat(r.taSistolica);
        const dia = parseFloat(r.taDiastolica);
        if (!isNaN(sis) && !isNaN(dia) && sis > 0 && dia > 0) {
            validCount++;
            if (sis < 120 && dia < 80) categories['Normal']++;
            else if (sis < 130 && dia < 80) categories['Elevada']++;
            else if (sis < 140 || dia < 90) categories['Hipertensión I']++;
            else categories['Hipertensión II']++;
        }
    });

    if (validCount === 0) return 'No hay datos de presión arterial disponibles para este grupo.';

    const parts = Object.entries(categories)
        .filter(([_, count]) => count > 0)
        .map(([cat, count]) => `${((count / validCount) * 100).toFixed(1)}% ${cat} (${count})`)
        .join(', ');

    return `Distribución de Presión Arterial: ${parts}. Total evaluados: ${validCount}.`;
}

function generateGeneroInterpretation(records) {
    const generos = { 'Masculino': 0, 'Femenino': 0 };
    records.forEach(r => {
        if (r.genero === 'Masculino') generos['Masculino']++;
        else if (r.genero === 'Femenino') generos['Femenino']++;
    });
    const total = generos['Masculino'] + generos['Femenino'];
    if (total === 0) return 'No hay datos de género disponibles.';

    return `Distribución por Género: ${((generos['Masculino'] / total) * 100).toFixed(1)}% Masculino (${generos['Masculino']}), ${((generos['Femenino'] / total) * 100).toFixed(1)}% Femenino (${generos['Femenino']}). Total: ${total}.`;
}

function generateEdadesInterpretation(records) {
    const ranges = { '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '56+': 0 };
    let validCount = 0;

    records.forEach(r => {
        const edad = parseInt(r.edad);
        if (!isNaN(edad)) {
            validCount++;
            if (edad <= 25) ranges['18-25']++;
            else if (edad <= 35) ranges['26-35']++;
            else if (edad <= 45) ranges['36-45']++;
            else if (edad <= 55) ranges['46-55']++;
            else ranges['56+']++;
        }
    });

    if (validCount === 0) return 'No hay datos de edad disponibles.';

    const parts = Object.entries(ranges)
        .filter(([_, count]) => count > 0)
        .map(([range, count]) => `${((count / validCount) * 100).toFixed(1)}% ${range} años (${count})`)
        .join(', ');

    return `Distribución por Edad: ${parts}. Total: ${validCount}.`;
}

function generateTurnosInterpretation(records) {
    const turnos = {};
    records.forEach(r => {
        if (r.turno) turnos[r.turno] = (turnos[r.turno] || 0) + 1;
    });
    const total = Object.values(turnos).reduce((a, b) => a + b, 0);
    if (total === 0) return 'No hay datos de turno disponibles.';

    const parts = Object.entries(turnos)
        .map(([turno, count]) => `${((count / total) * 100).toFixed(1)}% ${turno} (${count})`)
        .join(', ');

    return `Distribución por Turno: ${parts}. Total: ${total}.`;
}

function generatePlantasInterpretation(records) {
    const plantas = {};
    records.forEach(r => {
        if (r.planta) plantas[r.planta] = (plantas[r.planta] || 0) + 1;
    });
    const total = Object.values(plantas).reduce((a, b) => a + b, 0);
    if (total === 0) return 'No hay datos de planta disponibles.';

    const parts = Object.entries(plantas)
        .map(([planta, count]) => `${((count / total) * 100).toFixed(1)}% ${planta} (${count})`)
        .join(', ');

    return `Distribución por Planta: ${parts}. Total: ${total}.`;
}

function generateProgramasInterpretation(records) {
    const programas = {};
    records.forEach(r => {
        if (r.programas) {
            r.programas.split(',').forEach(p => {
                const clean = p.trim();
                if (clean) programas[clean] = (programas[clean] || 0) + 1;
            });
        }
    });
    const total = Object.values(programas).reduce((a, b) => a + b, 0);
    if (total === 0) return 'No hay datos de programas disponibles.';

    const sorted = Object.entries(programas).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const parts = sorted.map(([prog, count]) => `${prog} (${count})`).join(', ');

    return `Top 5 Programas de Salud: ${parts}. Total asignaciones: ${total}.`;
}

function generatePadecimientosInterpretation(records) {
    const padecimientos = {};
    records.forEach(r => {
        const val = String(r.padecimiento || '');
        if (val.trim() && val.toLowerCase() !== 'ninguno' && val.toLowerCase() !== 'no') {
            val.split(',').forEach(item => {
                const clean = item.trim();
                if (clean) padecimientos[clean] = (padecimientos[clean] || 0) + 1;
            });
        }
    });
    const total = Object.values(padecimientos).reduce((a, b) => a + b, 0);
    if (total === 0) return 'No se reportaron padecimientos en este grupo.';

    const sorted = Object.entries(padecimientos).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const parts = sorted.map(([pad, count]) => `${pad} (${count})`).join(', ');

    return `Top 5 Padecimientos: ${parts}. Total casos reportados: ${total}.`;
}

// ============================================
// COMPARATIVE INDICATOR
// ============================================

function generateComparativeIndicator(filteredRecords) {
    // Compare filtered group IMC average vs. total population
    const filteredIMCs = filteredRecords.map(r => parseFloat(r.imc)).filter(v => !isNaN(v) && v > 0);
    const totalIMCs = dashboardData.map(r => parseFloat(r.imc)).filter(v => !isNaN(v) && v > 0);

    if (filteredIMCs.length === 0 || totalIMCs.length === 0) {
        return 'No hay suficientes datos para calcular el indicador comparativo.';
    }

    const filteredAvg = filteredIMCs.reduce((a, b) => a + b, 0) / filteredIMCs.length;
    const totalAvg = totalIMCs.reduce((a, b) => a + b, 0) / totalIMCs.length;
    const diff = ((filteredAvg - totalAvg) / totalAvg * 100).toFixed(1);

    if (parseFloat(diff) > 0) {
        return `Este grupo tiene un IMC promedio ${diff}% mayor que el promedio general (${filteredAvg.toFixed(1)} vs ${totalAvg.toFixed(1)}).`;
    } else if (parseFloat(diff) < 0) {
        return `Este grupo tiene un IMC promedio ${Math.abs(diff)}% menor que el promedio general (${filteredAvg.toFixed(1)} vs ${totalAvg.toFixed(1)}).`;
    } else {
        return `Este grupo tiene un IMC promedio igual al promedio general (${filteredAvg.toFixed(1)}).`;
    }
}

// ============================================
// PDF EXPORT
// ============================================

function openPDFSelectionModal() {
    document.getElementById('pdfSelectionModal').style.display = 'flex';
}

function closePDFSelectionModal() {
    document.getElementById('pdfSelectionModal').style.display = 'none';
}

async function generatePDFReport() {
    const modal = document.getElementById('pdfSelectionModal');
    const checkboxes = modal.querySelectorAll('input[name="chartSelection"]:checked');
    const selectedCharts = Array.from(checkboxes).map(cb => cb.value);

    if (selectedCharts.length === 0) {
        alert('Por favor, selecciona al menos una gráfica para incluir en el reporte.');
        return;
    }

    closePDFSelectionModal();

    // Show loading
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'pdfLoadingOverlay';
    loadingOverlay.innerHTML = `
        <div style="background: white; padding: 2rem 3rem; border-radius: 12px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
            <div style="width: 40px; height: 40px; border: 4px solid #e5e7eb; border-top-color: #10b981; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
            <p style="color: #1e293b; font-weight: 500;">Generando PDF...</p>
        </div>
    `;
    loadingOverlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 99999;';
    document.body.appendChild(loadingOverlay);

    const filteredRecords = getFilteredDashboardData();
    const filtersLabel = getActiveFiltersLabel();
    const dateGenerated = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

    // Create PDF content container
    const pdfContainer = document.createElement('div');
    pdfContainer.id = 'pdfExportContainer';
    pdfContainer.style.cssText = 'width: 210mm; padding: 15mm; background: white; font-family: Inter, sans-serif; color: #1e293b;';

    // Header with logo and title
    pdfContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #10b981; padding-bottom: 1rem; margin-bottom: 1.5rem;">
            <div>
                <h1 style="margin: 0; font-size: 1.5rem; color: #0b4f35;">Reporte de Salud - Dashboard EHS</h1>
                <p style="margin: 0.25rem 0 0; color: #64748b; font-size: 0.85rem;">Generado: ${dateGenerated}</p>
            </div>
            <img src="EHS.png" alt="EHS Logo" style="height: 50px;">
        </div>

        <!-- Filter Traceability -->
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1.5rem;">
            <strong style="color: #166534;">Filtros Aplicados:</strong> <span style="color: #1e293b;">${filtersLabel}</span>
        </div>

        <!-- Executive Summary -->
        <div style="background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%); border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem;">
            <h2 style="margin: 0 0 1rem; font-size: 1.1rem; color: #1e40af;">📊 Resumen Ejecutivo</h2>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; text-align: center;">
                ${generateExecutiveSummaryHTML(filteredRecords)}
            </div>
            <p style="margin: 1rem 0 0; font-size: 0.85rem; color: #475569;">${generateComparativeIndicator(filteredRecords)}</p>
        </div>
    `;

    // Add selected charts with interpretations
    const chartMappings = {
        'imc': { title: 'Distribución de IMC', elementId: 'chartIMC', interpreter: generateIMCInterpretation },
        'genero': { title: 'Distribución por Género', elementId: 'chartGenero', interpreter: generateGeneroInterpretation },
        'glucosa': { title: 'Distribución de Glucosa', elementId: 'chartGlucosa', interpreter: generateGlucosaInterpretation },
        'presion': { title: 'Distribución de Presión Arterial', elementId: 'chartPresion', interpreter: generatePresionInterpretation },
        'edades': { title: 'Distribución por Edad', elementId: 'chartEdades', interpreter: generateEdadesInterpretation },
        'turnos': { title: 'Distribución por Turno', elementId: 'chartTurnos', interpreter: generateTurnosInterpretation },
        'plantas': { title: 'Empleados por Planta', elementId: 'chartPlantas', interpreter: generatePlantasInterpretation },
        'programas': { title: 'Programas de Salud', elementId: 'chartProgramas', interpreter: generateProgramasInterpretation },
        'padecimientos': { title: 'Top Padecimientos', elementId: 'chartPadecimientos', interpreter: generatePadecimientosInterpretation }
    };

    // Generate PDF content with Chart Images
    for (const chartKey of selectedCharts) {
        const mapping = chartMappings[chartKey];
        if (!mapping) continue;

        // Get ApexChart Instance
        // Defined in dashboard.js: let chartInstances = {};
        // Keys in chartInstances match the elementIDs (e.g. 'chartIMC')
        const chartInstance = window.chartInstances ? window.chartInstances[mapping.elementId] : null;

        if (!chartInstance) {
            console.warn(`Chart instance not found for ${mapping.elementId}`);
            continue;
        }

        // Get Data URI (Base64 Image)
        try {
            const { imgURI } = await chartInstance.dataURI();

            const chartSection = document.createElement('div');
            chartSection.style.cssText = 'margin-bottom: 2rem; page-break-inside: avoid;';

            chartSection.innerHTML = `
                <h3 style="font-size: 1rem; color: #0b4f35; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; margin-bottom: 1rem;">${mapping.title}</h3>
                <div style="text-align: center;">
                    <img src="${imgURI}" style="max-width: 100%; max-height: 300px;">
                </div>
                <p style="background: #f8fafc; border-left: 4px solid #10b981; padding: 0.75rem 1rem; margin-top: 1rem; font-size: 0.85rem; color: #475569; border-radius: 0 8px 8px 0;">
                    ${mapping.interpreter(filteredRecords)}
                </p>
            `;

            pdfContainer.appendChild(chartSection);

        } catch (e) {
            console.error(`Error generating image for ${chartKey}:`, e);
        }
    }

    document.body.appendChild(pdfContainer);

    // Wait a bit for DOM to render
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate PDF using html2pdf
    const opt = {
        margin: 0,
        filename: `Reporte_EHS_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
        await html2pdf().set(opt).from(pdfContainer).save();
    } catch (err) {
        console.error('PDF generation error:', err);
        alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    }

    // Cleanup
    document.body.removeChild(pdfContainer);
    document.body.removeChild(loadingOverlay);
}

function generateExecutiveSummaryHTML(records) {
    // KPIs
    const total = records.length;

    const imcValues = records.map(r => parseFloat(r.imc)).filter(v => !isNaN(v) && v > 0);
    const avgIMC = imcValues.length > 0 ? (imcValues.reduce((a, b) => a + b, 0) / imcValues.length).toFixed(1) : '--';

    const overweight = imcValues.filter(v => v >= 25).length;
    const pctObesidad = imcValues.length > 0 ? ((overweight / imcValues.length) * 100).toFixed(0) + '%' : '--';

    const hipertensos = records.filter(r => {
        const sis = parseFloat(r.taSistolica);
        const dia = parseFloat(r.taDiastolica);
        return (sis >= 140 || dia >= 90);
    }).length;
    const pctHipertension = records.length > 0 ? ((hipertensos / records.length) * 100).toFixed(0) + '%' : '--';

    return `
        <div style="background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div style="font-size: 1.5rem; font-weight: 700; color: #3b82f6;">${total}</div>
            <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Total Empleados</div>
        </div>
        <div style="background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div style="font-size: 1.5rem; font-weight: 700; color: #10b981;">${avgIMC}</div>
            <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">IMC Promedio</div>
        </div>
        <div style="background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div style="font-size: 1.5rem; font-weight: 700; color: #f59e0b;">${pctObesidad}</div>
            <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Sobrepeso/Obesidad</div>
        </div>
        <div style="background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div style="font-size: 1.5rem; font-weight: 700; color: #ef4444;">${pctHipertension}</div>
            <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Hipertensión</div>
        </div>
    `;
}

// ============================================
// EXCEL EXPORT
// ============================================

function generateExcelReport() {
    const filteredRecords = getFilteredDashboardData();
    const filtersLabel = getActiveFiltersLabel();

    if (filteredRecords.length === 0) {
        alert('No hay datos para exportar con los filtros actuales.');
        return;
    }

    // Prepare data with risk classification
    const exportData = filteredRecords.map(record => ({
        'No. Empleado': record.numEmpleado || '',
        'Nombre': record.nombre || '',
        'Género': record.genero || '',
        'Edad': record.edad || '',
        'Planta': record.planta || '',
        'Área': record.area || '',
        'Turno': record.turno || '',
        'Peso (kg)': record.peso || '',
        'Talla (cm)': record.talla || '',
        'IMC': record.imc || '',
        'Grasa Corporal (%)': record.fat || '',
        'Masa Muscular (kg)': record.musc || '',
        'Grasa Visceral': record.visc || '',
        'TA Sistólica': record.taSistolica || '',
        'TA Diastólica': record.taDiastolica || '',
        'Glucosa': record.glucometria || '',
        'Programas': record.programas || '',
        'Nivel de Riesgo': classifyRiskLevel(record)
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Main data sheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Add header row styling info (SheetJS doesn't style directly, but we set column widths)
    ws['!cols'] = [
        { wch: 12 }, // No. Empleado
        { wch: 25 }, // Nombre
        { wch: 10 }, // Género
        { wch: 6 },  // Edad
        { wch: 15 }, // Planta
        { wch: 15 }, // Área
        { wch: 12 }, // Turno
        { wch: 10 }, // Peso
        { wch: 10 }, // Talla
        { wch: 8 },  // IMC
        { wch: 15 }, // Grasa Corporal
        { wch: 15 }, // Masa Muscular
        { wch: 12 }, // Grasa Visceral
        { wch: 12 }, // TA Sistólica
        { wch: 12 }, // TA Diastólica
        { wch: 10 }, // Glucosa
        { wch: 30 }, // Programas
        { wch: 15 }  // Nivel de Riesgo
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Datos');

    // Summary sheet
    const summaryData = [
        ['Reporte Generado', new Date().toLocaleDateString('es-MX')],
        ['Filtros Aplicados', filtersLabel],
        ['Total Registros', filteredRecords.length],
        [''],
        ['Distribución por Nivel de Riesgo'],
        ['Alto', filteredRecords.filter(r => classifyRiskLevel(r) === 'Alto').length],
        ['Medio', filteredRecords.filter(r => classifyRiskLevel(r) === 'Medio').length],
        ['Bajo', filteredRecords.filter(r => classifyRiskLevel(r) === 'Bajo').length]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

    // Download
    const filename = `Reporte_EHS_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', initExportModule);
