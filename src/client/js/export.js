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

// ============================================
// PREDEFINED REPORTS ENGINE
// ============================================

let selectedReportType = ''; // Stores the currently selected report type

const REPORT_CONFIG = {
    'General': {
        title: 'Reporte General - Todos los Programas',
        icon: '🌐',
        color: '#3b82f6',
        gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        filenamePrefix: 'Reporte_General'
    },
    'Cronico Degenerativos': {
        title: 'Reporte: Crónico Degenerativos',
        icon: '❤️',
        color: '#ef4444',
        gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
        filenamePrefix: 'Reporte_Cronico_Degenerativos'
    },
    'Salud Ocupacional': {
        title: 'Reporte: Salud Ocupacional',
        icon: '🏭',
        color: '#f59e0b',
        gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
        filenamePrefix: 'Reporte_Salud_Ocupacional'
    },
    'Actividades restringidas': {
        title: 'Reporte: Actividades Restringidas',
        icon: '⚠️',
        color: '#8b5cf6',
        gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        filenamePrefix: 'Reporte_Actividades_Restringidas'
    },
    'Brigadistas': {
        title: 'Reporte: Brigadistas',
        icon: '🚒',
        color: '#06b6d4',
        gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
        filenamePrefix: 'Reporte_Brigadistas'
    },
    'Nuevo ingreso': {
        title: 'Reporte: Nuevo Ingreso',
        icon: '🆕',
        color: '#10b981',
        gradient: 'linear-gradient(135deg, #10b981, #059669)',
        filenamePrefix: 'Reporte_Nuevo_Ingreso'
    },
    'Ley Silla': {
        title: 'Reporte: Ley Silla',
        icon: '🪑',
        color: '#86198f',
        gradient: 'linear-gradient(135deg, #a21caf, #86198f)',
        filenamePrefix: 'Reporte_Ley_Silla'
    }
};

/**
 * Filter dashboard data by a specific program.
 * 'General' returns all records.
 */
function getRecordsByProgram(programName) {
    if (programName === 'General') return dashboardData;
    return dashboardData.filter(r =>
        (r.programas || '').split(',').map(p => p.trim()).includes(programName)
    );
}

/**
 * Validate data quality for a set of records.
 * Returns an object with quality metrics and warnings.
 */
function validateDataQuality(records) {
    const total = records.length;
    if (total === 0) return { total: 0, warnings: ['No hay registros para este programa.'], quality: 'empty' };

    const warnings = [];
    let missingIMC = 0, missingGlucosa = 0, missingPresion = 0, missingEdad = 0;

    records.forEach(r => {
        const imc = parseFloat(r.imc);
        if (isNaN(imc) || imc <= 0) missingIMC++;
        const glucosa = parseFloat(r.glucometria);
        if (isNaN(glucosa) || glucosa <= 0) missingGlucosa++;
        const sis = parseFloat(r.taSistolica);
        const dia = parseFloat(r.taDiastolica);
        if (isNaN(sis) || isNaN(dia) || sis <= 0 || dia <= 0) missingPresion++;
        const edad = parseInt(r.edad);
        if (isNaN(edad)) missingEdad++;
    });

    const pctIMC = ((missingIMC / total) * 100).toFixed(0);
    const pctGlucosa = ((missingGlucosa / total) * 100).toFixed(0);
    const pctPresion = ((missingPresion / total) * 100).toFixed(0);

    if (pctIMC > 20) warnings.push(`⚠️ ${pctIMC}% sin datos de IMC`);
    if (pctGlucosa > 20) warnings.push(`⚠️ ${pctGlucosa}% sin datos de Glucosa`);
    if (pctPresion > 20) warnings.push(`⚠️ ${pctPresion}% sin datos de Presión Arterial`);

    const quality = warnings.length === 0 ? 'good' : warnings.length <= 1 ? 'moderate' : 'low';

    return { total, missingIMC, missingGlucosa, missingPresion, missingEdad, warnings, quality };
}

/**
 * Generate multi-program analysis HTML for the General Report PDF.
 */
function generateMultiProgramAnalysisHTML(records) {
    // Count programs per employee
    const programCounts = { '1 programa': 0, '2 programas': 0, '3+ programas': 0 };
    let totalProgramAssignments = 0;

    records.forEach(r => {
        const progs = (r.programas || '').split(',').map(p => p.trim()).filter(Boolean);
        const count = progs.length;
        totalProgramAssignments += count;
        if (count <= 1) programCounts['1 programa']++;
        else if (count === 2) programCounts['2 programas']++;
        else programCounts['3+ programas']++;
    });

    const avgPrograms = records.length > 0 ? (totalProgramAssignments / records.length).toFixed(1) : '0';

    // Identify complex cases (2+ programs AND high risk)
    let complexCases = 0;
    records.forEach(r => {
        const progs = (r.programas || '').split(',').map(p => p.trim()).filter(Boolean);
        if (progs.length >= 2 && classifyRiskLevel(r) === 'Alto') complexCases++;
    });

    return `
        <div style="background: linear-gradient(135deg, #eff6ff 0%, #faf5ff 100%); border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; page-break-inside: avoid;">
            <h3 style="margin: 0 0 1rem; font-size: 1.1rem; color: #4c1d95;">📊 Análisis de Multi-Programas</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem;">
                <div style="background: white; padding: 1rem; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <div style="font-size: 1.5rem; font-weight: 700; color: #3b82f6;">${avgPrograms}</div>
                    <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Promedio de Programas / Empleado</div>
                </div>
                <div style="background: white; padding: 1rem; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <div style="font-size: 1.5rem; font-weight: 700; color: #f59e0b;">${programCounts['2 programas'] + programCounts['3+ programas']}</div>
                    <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Empleados con 2+ Programas</div>
                </div>
                <div style="background: white; padding: 1rem; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <div style="font-size: 1.5rem; font-weight: 700; color: #ef4444;">${complexCases}</div>
                    <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Casos Complejos (Multi + Alto Riesgo)</div>
                </div>
            </div>
            <p style="margin: 0; font-size: 0.85rem; color: #475569; background: white; padding: 0.75rem 1rem; border-radius: 8px; border-left: 4px solid #8b5cf6;">
                Distribución: ${programCounts['1 programa']} con 1 programa, ${programCounts['2 programas']} con 2 programas, ${programCounts['3+ programas']} con 3 o más.
            </p>
        </div>
    `;
}

/**
 * Open the report format modal. Called when user clicks a report type.
 * Auto-loads dashboardData if not available (when called from Expediente).
 */
async function openReportFormatModal(reportType) {
    selectedReportType = reportType;
    const config = REPORT_CONFIG[reportType];
    if (!config) return;

    // Auto-load dashboardData if not available (e.g., opened from Expediente, not Dashboard)
    if (!dashboardData || dashboardData.length === 0) {
        try {
            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: 'getDashboardData',
                    token: sessionStorage.getItem('sessionToken')
                })
            });
            const result = await response.json();
            if (result.success && result.records) {
                dashboardData = result.records;
            } else {
                alert('Error cargando datos para el reporte: ' + (result.error || 'Desconocido'));
                return;
            }
        } catch (err) {
            console.error('Error loading data for report:', err);
            alert('Error de conexión al cargar datos del reporte.');
            return;
        }
    }

    // Update modal header
    const titleEl = document.getElementById('reportFormatTitle');
    const subtitleEl = document.getElementById('reportFormatSubtitle');
    const headerDiv = titleEl?.parentElement;

    if (titleEl) titleEl.textContent = `${config.icon} ${config.title}`;
    if (subtitleEl) subtitleEl.textContent = 'Selecciona el formato de exportación';
    if (headerDiv) headerDiv.style.background = config.gradient;

    // Calculate data quality preview
    const records = getRecordsByProgram(reportType);
    const quality = validateDataQuality(records);
    const qualityEl = document.getElementById('reportQualityContent');

    if (qualityEl) {
        let html = `<strong>${quality.total}</strong> registros encontrados`;

        if (quality.total > 0) {
            const qualityBadge = quality.quality === 'good'
                ? '<span style="color: #10b981; font-weight: 600;">✅ Calidad Alta</span>'
                : quality.quality === 'moderate'
                    ? '<span style="color: #f59e0b; font-weight: 600;">⚠️ Calidad Moderada</span>'
                    : '<span style="color: #ef4444; font-weight: 600;">🔴 Calidad Baja</span>';

            html += ` — ${qualityBadge}`;

            if (quality.warnings.length > 0) {
                html += '<br>' + quality.warnings.join('<br>');
            }
        }

        qualityEl.innerHTML = html;
    }

    // Show modal
    document.getElementById('reportFormatModal').style.display = 'flex';
}

function closeReportFormatModal() {
    document.getElementById('reportFormatModal').style.display = 'none';
    selectedReportType = '';
}

/**
 * Execute the predefined report in the chosen format.
 */
async function executePredefinedReport(format) {
    const reportType = selectedReportType;
    const config = REPORT_CONFIG[reportType];
    if (!config || !reportType) return;

    closeReportFormatModal();

    const records = getRecordsByProgram(reportType);
    if (records.length === 0) {
        alert('No hay registros para este programa. No se puede generar el reporte.');
        return;
    }

    if (format === 'excel') {
        generatePredefinedExcelReport(reportType, config, records);
    } else {
        await generatePredefinedPDFReport(reportType, config, records);
    }
}

/**
 * Generate a predefined Excel report.
 */
function generatePredefinedExcelReport(reportType, config, records) {
    const dateStr = new Date().toISOString().split('T')[0];

    // Prepare data with risk classification and complex case flag
    const exportData = records.map(record => {
        const progs = (record.programas || '').split(',').map(p => p.trim()).filter(Boolean);
        return {
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
            'Nivel de Riesgo': classifyRiskLevel(record),
            'Caso Complejo': progs.length >= 2 ? 'Sí' : 'No'
        };
    });

    const wb = XLSX.utils.book_new();

    // Main data sheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [
        { wch: 12 }, { wch: 25 }, { wch: 10 }, { wch: 6 }, { wch: 15 },
        { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 8 },
        { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 10 }, { wch: 30 }, { wch: 15 }, { wch: 14 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');

    // Summary sheet
    const quality = validateDataQuality(records);
    const summaryData = [
        [config.title],
        [''],
        ['Reporte Generado', new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })],
        ['Programa', reportType],
        ['Total Registros', records.length],
        [''],
        ['Distribución por Nivel de Riesgo'],
        ['Alto', records.filter(r => classifyRiskLevel(r) === 'Alto').length],
        ['Medio', records.filter(r => classifyRiskLevel(r) === 'Medio').length],
        ['Bajo', records.filter(r => classifyRiskLevel(r) === 'Bajo').length],
        [''],
        ['Calidad de Datos'],
        ['Registros sin IMC', quality.missingIMC || 0],
        ['Registros sin Glucosa', quality.missingGlucosa || 0],
        ['Registros sin Presión Arterial', quality.missingPresion || 0],
    ];

    if (reportType === 'General') {
        // Add multi-program analysis to summary
        const programCounts = { '1 programa': 0, '2 programas': 0, '3+ programas': 0 };
        records.forEach(r => {
            const count = (r.programas || '').split(',').map(p => p.trim()).filter(Boolean).length;
            if (count <= 1) programCounts['1 programa']++;
            else if (count === 2) programCounts['2 programas']++;
            else programCounts['3+ programas']++;
        });
        summaryData.push(['']);
        summaryData.push(['Análisis Multi-Programa']);
        summaryData.push(['Empleados con 1 programa', programCounts['1 programa']]);
        summaryData.push(['Empleados con 2 programas', programCounts['2 programas']]);
        summaryData.push(['Empleados con 3+ programas', programCounts['3+ programas']]);
        summaryData.push(['Casos Complejos (Multi + Alto Riesgo)',
            records.filter(r => {
                const progs = (r.programas || '').split(',').map(p => p.trim()).filter(Boolean);
                return progs.length >= 2 && classifyRiskLevel(r) === 'Alto';
            }).length
        ]);
    }

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 35 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

    const filename = `${config.filenamePrefix}_${dateStr}.xlsx`;
    XLSX.writeFile(wb, filename);
}

/**
 * Generate a predefined PDF report with all charts and interpretations.
 */
async function generatePredefinedPDFReport(reportType, config, records) {
    // Show loading
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'pdfLoadingOverlay';
    loadingOverlay.innerHTML = `
        <div style="background: white; padding: 2rem 3rem; border-radius: 12px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
            <div style="width: 40px; height: 40px; border: 4px solid #e5e7eb; border-top-color: ${config.color}; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
            <p style="color: #1e293b; font-weight: 500;">Generando ${config.title}...</p>
        </div>
    `;
    loadingOverlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 99999;';
    document.body.appendChild(loadingOverlay);

    const dateGenerated = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    const quality = validateDataQuality(records);

    // Create PDF content
    const pdfContainer = document.createElement('div');
    pdfContainer.id = 'pdfExportContainer';
    pdfContainer.style.cssText = 'width: 210mm; padding: 15mm; background: white; font-family: Inter, sans-serif; color: #1e293b;';

    // Header
    pdfContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid ${config.color}; padding-bottom: 1rem; margin-bottom: 1.5rem;">
            <div>
                <h1 style="margin: 0; font-size: 1.5rem; color: #0b4f35;">${config.icon} ${config.title}</h1>
                <p style="margin: 0.25rem 0 0; color: #64748b; font-size: 0.85rem;">Generado: ${dateGenerated}</p>
            </div>
            <img src="EHS.png" alt="EHS Logo" style="height: 50px;">
        </div>

        <!-- Data Quality Alert -->
        ${quality.warnings.length > 0 ? `
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1.5rem;">
            <strong style="color: #92400e;">⚠️ Alertas de Calidad de Datos:</strong><br>
            <span style="color: #78350f; font-size: 0.85rem;">${quality.warnings.join(' | ')}</span>
        </div>
        ` : ''}

        <!-- Executive Summary -->
        <div style="background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%); border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem;">
            <h2 style="margin: 0 0 1rem; font-size: 1.1rem; color: #1e40af;">📊 Resumen Ejecutivo</h2>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; text-align: center;">
                ${generateExecutiveSummaryHTML(records)}
            </div>
            <p style="margin: 1rem 0 0; font-size: 0.85rem; color: #475569;">${generateComparativeIndicator(records)}</p>
        </div>
    `;

    // Multi-program analysis (only for General report)
    if (reportType === 'General') {
        const multiProgramDiv = document.createElement('div');
        multiProgramDiv.innerHTML = generateMultiProgramAnalysisHTML(records);
        pdfContainer.appendChild(multiProgramDiv);
    }

    // Add all chart interpretations as text sections (since we can't render new charts for filtered data)
    const interpretations = [
        { title: 'Distribución de IMC', fn: generateIMCInterpretation },
        { title: 'Distribución por Género', fn: generateGeneroInterpretation },
        { title: 'Distribución de Glucosa', fn: generateGlucosaInterpretation },
        { title: 'Distribución de Presión Arterial', fn: generatePresionInterpretation },
        { title: 'Distribución por Edad', fn: generateEdadesInterpretation },
        { title: 'Distribución por Turno', fn: generateTurnosInterpretation },
        { title: 'Empleados por Planta', fn: generatePlantasInterpretation },
        { title: 'Programas de Salud', fn: generateProgramasInterpretation },
        { title: 'Principales Padecimientos', fn: generatePadecimientosInterpretation }
    ];

    // Try to capture existing chart images if the dashboard charts are rendered
    const chartMappings = {
        'Distribución de IMC': 'chartIMC',
        'Distribución por Género': 'chartGenero',
        'Distribución de Glucosa': 'chartGlucosa',
        'Distribución de Presión Arterial': 'chartPresion',
        'Distribución por Edad': 'chartEdades',
        'Distribución por Turno': 'chartTurnos',
        'Empleados por Planta': 'chartPlantas',
        'Programas de Salud': 'chartProgramas',
        'Principales Padecimientos': 'chartPadecimientos'
    };

    for (const interp of interpretations) {
        const section = document.createElement('div');
        section.style.cssText = 'margin-bottom: 1.5rem; page-break-inside: avoid;';

        let chartImage = '';
        const chartId = chartMappings[interp.title];
        const chartInstance = window.chartInstances ? window.chartInstances[chartId] : null;

        if (chartInstance) {
            try {
                const { imgURI } = await chartInstance.dataURI();
                chartImage = `<div style="text-align: center; margin-bottom: 0.5rem;"><img src="${imgURI}" style="max-width: 100%; max-height: 250px;"></div>`;
            } catch (e) {
                console.warn(`Could not capture chart image for ${interp.title}`);
            }
        }

        section.innerHTML = `
            <h3 style="font-size: 1rem; color: ${config.color}; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; margin-bottom: 0.75rem;">${interp.title}</h3>
            ${chartImage}
            <p style="background: #f8fafc; border-left: 4px solid ${config.color}; padding: 0.75rem 1rem; font-size: 0.85rem; color: #475569; border-radius: 0 8px 8px 0; margin: 0;">
                ${interp.fn(records)}
            </p>
        `;
        pdfContainer.appendChild(section);
    }

    document.body.appendChild(pdfContainer);
    await new Promise(resolve => setTimeout(resolve, 500));

    const dateStr = new Date().toISOString().split('T')[0];
    const opt = {
        margin: 0,
        filename: `${config.filenamePrefix}_${dateStr}.pdf`,
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


// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    initExportModule();

    // Close reports dropdown when clicking outside
    document.addEventListener('click', () => {
        const reportsMenu = document.getElementById('reportsDropdownMenu');
        if (reportsMenu) reportsMenu.classList.remove('show');
    });
});
