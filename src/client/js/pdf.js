function openPDFModal() {
    if (!window.searchResults || window.searchResults.length === 0) {
        alert("No hay registros disponibles.");
        return;
    }

    const listContainer = document.getElementById('pdfModalList');
    listContainer.innerHTML = '';

    window.searchResults.forEach((item, index) => {
        const dateObj = new Date(item.date);
        // Formato seguro para evitar problemas de zona horaria en visualización simple
        const dateStr = dateObj.toLocaleDateString('es-ES', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        const div = document.createElement('div');
        div.className = 'pdf-list-item';
        div.onclick = () => {
            previewPDF(index);
            closePDFModal();
        };

        div.innerHTML = `
    <div class="pdf-item-date">
        <span class="pdf-item-icon">📅</span>
        <span>${dateStr}</span>
    </div>
    <span class="pdf-item-download">Descargar PDF &darr;</span>
        `;
        listContainer.appendChild(div);
    });

    document.getElementById('pdfModal').style.display = 'flex';
}

function closePDFModal() {
    document.getElementById('pdfModal').style.display = 'none';
}

// Preview PDF Logic
function previewPDF(index) {
    const item = window.searchResults[index];
    const data = item.data;

    // 1. Populate Template Fields
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = (val && val !== '' && val !== 'Ninguno' && val !== 'NINGUNA') ? val : 'N/A';
    };

    const formatPdfDate = (val) => {
        if (!val || val === '' || val === 'N/A') return 'N/A';
        try {
            // Handle ISO strings (e.g., 2026-01-14T08:00:00.000Z) or simple dates (2026-01-14)
            const d = new Date(val);
            if (isNaN(d.getTime())) return val;
            // Using UTC to avoid timezone shifts if it's just a date string
            const day = String(d.getUTCDate()).padStart(2, '0');
            const month = String(d.getUTCMonth() + 1).padStart(2, '0');
            const year = d.getUTCFullYear();
            return `${day}/${month}/${year}`;
        } catch (e) {
            return val;
        }
    };

    const dateObj = new Date(item.date);
    setVal('pdf_fechaGen', dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }));

    setVal('pdf_nombre', data.nombre);
    setVal('pdf_num', data.num);
    setVal('pdf_genero', data.genero);
    setVal('pdf_edad', data.edad);
    setVal('pdf_contacto', data.contacto);
    setVal('pdf_nacimiento', data.lugarNacimiento);
    setVal('pdf_estadoCivil', data.estadoCivil);
    setVal('pdf_escolaridad', data.escolaridad);

    // --- JOB INFO ---
    setVal('pdf_planta', data.planta);
    setVal('pdf_area', data.area);
    setVal('pdf_puesto', data.puesto);
    setVal('pdf_turno', data.turno);
    setVal('pdf_supervisor', data.supervisor);
    setVal('pdf_ingresoPuesto', formatPdfDate(data.fechaIngresoPuesto));
    setVal('pdf_ingresoEmpresa', formatPdfDate(data.fechaIngresoEmpresa));

    // Helper for seniority calculation (fallback if stored value is N/A)
    const getSeniorityText = (dateString) => {
        if (!dateString || dateString === 'N/A') return 'N/A';
        const fechaIngreso = new Date(dateString);
        const hoy = new Date();
        if (fechaIngreso > hoy || isNaN(fechaIngreso.getTime())) return 'N/A';

        let anos = hoy.getFullYear() - fechaIngreso.getFullYear();
        let meses = hoy.getMonth() - fechaIngreso.getMonth();
        let dias = hoy.getDate() - fechaIngreso.getDate();

        if (dias < 0) { meses--; dias += new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate(); }
        if (meses < 0) { anos--; meses += 12; }

        let texto = '';
        if (anos > 0) texto += `${anos} año${anos !== 1 ? 's' : ''}`;
        if (meses > 0) texto += `${texto ? ', ' : ''}${meses} mes${meses !== 1 ? 'es' : ''}`;
        if (dias > 0) texto += `${texto ? ' y ' : ''}${dias} día${dias !== 1 ? 's' : ''}`;
        return texto || '0 días';
    };

    // Use stored value if valid, otherwise calculate
    const isValidSeniority = (val) => val && val !== 'N/A' && !String(val).includes('Calculado');
    setVal('pdf_antiguedadPuesto', isValidSeniority(data.antiguedadPuesto) ? data.antiguedadPuesto : getSeniorityText(data.fechaIngresoPuesto));
    setVal('pdf_antiguedadEmpresa', isValidSeniority(data.antiguedadEmpresa) ? data.antiguedadEmpresa : getSeniorityText(data.fechaIngresoEmpresa));

    setVal('pdf_programas', data.programasList);
    setVal('pdf_funciones', data.funcionesPuesto);

    // --- BIOMETRICS ---
    setVal('pdf_peso', data.peso ? data.peso + ' kg' : 'N/A');
    setVal('pdf_talla', data.talla ? data.talla + ' cm' : 'N/A');
    setVal('pdf_imc', data.imc);
    setVal('pdf_fat', data.fat ? data.fat + '%' : 'N/A');
    setVal('pdf_musc', data.musc ? data.musc + '%' : 'N/A');
    setVal('pdf_visc', data.visc);
    setVal('pdf_bodyage', data.bodyage);
    setVal('pdf_rmi', data.rmi);
    setVal('pdf_ta', (data.taSistolica && data.taDiastolica) ? `${data.taSistolica}/${data.taDiastolica}` : 'N/A');
    setVal('pdf_pulso', data.pulso ? data.pulso + ' bpm' : 'N/A');
    setVal('pdf_oximetria', data.oximetria ? data.oximetria + '%' : 'N/A');
    setVal('pdf_gluco', data.glucometria ? data.glucometria + ' mg/dL' : 'N/A');
    setVal('pdf_temp', data.temperatura ? data.temperatura + ' °C' : 'N/A');
    setVal('pdf_agudezaVisual', data.agudezaVisual);
    setVal('pdf_agudezaAuditiva', data.agudezaAuditiva);
    setVal('pdf_lateralidad', data.lateralidad);

    // --- AHF ---
    const getAHF = (id, base) => {
        const check = data[id];
        const detail = data[id + '_detalle'];
        if (check === 'SI' || check === 'on' || check === true) {
            return `• ${base}: ${detail || 'Sin detalles'}`;
        }
        return '';
    };
    const ahfContainer = [
        getAHF('ahf_diabetes', 'Diabetes'),
        getAHF('ahf_hipertension', 'Hipertensión'),
        getAHF('ahf_cancer', 'Cáncer'),
        getAHF('ahf_cardiopatias', 'Cardiopatías')
    ].filter(x => x !== '').join('<br>');

    const ahfEl = document.getElementById('pdf_ahf_diabetes');
    if (ahfEl) ahfEl.innerHTML = ahfContainer || 'Sin antecedentes heredo-familiares';
    setVal('pdf_ahf_otros', data.ahf_otros);

    // --- HABITS ---
    const getHabito = (id, base) => {
        const t = data[`habito_${base}_Tipo`];
        const c = data[`habito_${base}_Cantidad`];
        const f = data[`habito_${base}_Frecuencia`];
        if (t || c || f) return `• ${base}: ${t || ''} (${c || ''} - ${f || ''})`;
        return '';
    };
    const habitosHTML = [
        getHabito('alcohol', 'Alcohol'),
        getHabito('tabaco', 'Tabaco'),
        getHabito('drogas', 'Drogas'),
        getHabito('meds', 'Medicamentos')
    ].filter(x => x !== '').join('<br>');

    const habitosEl = document.getElementById('pdf_habito_alcohol');
    if (habitosEl) habitosEl.innerHTML = habitosHTML || 'Sin hábitos nocivos reportados';

    // --- PATOLOGIAS / VACUNAS ---
    setVal('pdf_patologias', data.patologiasLista);
    const vacunas = [
        data.vacuna_tetanos === 'SI' ? 'Tétanos' : '',
        data.vacuna_influenza === 'SI' ? 'Influenza' : '',
        data.vacuna_hepatitis === 'SI' ? 'Hepatitis' : ''
    ].filter(x => x !== '').join(', ');
    setVal('pdf_vacunas', vacunas);
    setVal('pdf_alergias', data.alergia_medicamentos);

    // --- RIESGOS ---
    setVal('pdf_r_quimicos', data.riesgosQuimicos);
    setVal('pdf_r_fisicos', data.riesgosFisicos);
    setVal('pdf_r_ergonomicos', data.riesgosErgonomicos);
    setVal('pdf_r_metabolicos', data.riesgosMetabolicos);
    setVal('pdf_r_biologicos', data.riesgosBiologicos);

    // --- ACTIVIDADES ---
    setVal('pdf_oficioExterno', data.oficio_externo);
    setVal('pdf_deporte', data.deporte);
    setVal('pdf_ortopedico', data.ortopedico);

    // --- HALLAZGOS (Dinámico: Exploración + Evaluación) ---
    const hallazgosContainer = document.getElementById('pdf_evaluacionHallazgos');
    if (hallazgosContainer) {
        let joinedHTML = '';

        const processJSON = (jsonStr) => {
            if (!jsonStr || jsonStr === 'N/A' || jsonStr === '') return '';
            try {
                if (jsonStr.trim().startsWith('[')) {
                    const items = JSON.parse(jsonStr);
                    return items.map(h => `<div class="pdf-hallazgo"><strong>${h.item}:</strong> ${h.detalle}</div>`).join('');
                }
                return `<div class="pdf-hallazgo">${jsonStr}</div>`;
            } catch (e) {
                console.error("Parse Error:", e);
                return `<div class="pdf-hallazgo">${jsonStr}</div>`;
            }
        };

        const htmlExploracion = processJSON(data.exploracionData);
        const htmlEvaluacion = processJSON(data.evaluacionData);

        joinedHTML = htmlExploracion + htmlEvaluacion;

        if (joinedHTML) {
            hallazgosContainer.innerHTML = joinedHTML;
        } else {
            hallazgosContainer.innerHTML = '<div style="color:#94a3b8; font-style:italic; font-size:10px;">Sin hallazgos reportados.</div>';
        }
    }

    // --- GINECO ---
    const ginecoSection = document.getElementById('pdf_gineco_section');
    if (data.genero === 'Femenino') {
        ginecoSection.style.display = 'block';
        setVal('pdf_g_menarca', data.gineco_menarca);
        setVal('pdf_g_fum', formatPdfDate(data.gineco_fum));
        setVal('pdf_g_plan', data.gineco_planificacion);
        setVal('pdf_g_gpca', `G:${data.gineco_gestas || 0} P:${data.gineco_partos || 0} C:${data.gineco_cesareas || 0} A:${data.gineco_abortos || 0}`);
        setVal('pdf_g_papa', data.gineco_papanicolau);
        setVal('pdf_g_masto', data.gineco_mastografia);
    } else {
        ginecoSection.style.display = 'none';
    }

    // --- CIERRE ---
    setVal('pdf_notas', data.notas);
    setVal('pdf_aptitud', data.aptitud_medica);
    setVal('pdf_seguimiento', formatPdfDate(data.seguimiento_fecha));
    const restEl = document.getElementById('pdf_restricciones');
    if (restEl) restEl.textContent = data.aptitud_restricciones || '';


    // 2. Clone and Show
    const template = document.querySelector('.pdf-container');
    const clone = template.cloneNode(true);
    clone.style.display = 'block'; // Make sure it's visible

    const previewBody = document.getElementById('pdfPreviewBody');
    previewBody.innerHTML = '';
    previewBody.appendChild(clone);

    document.getElementById('pdfPreviewModal').style.display = 'flex';
}

function closePreviewModal() {
    document.getElementById('pdfPreviewModal').style.display = 'none';
}

async function confirmDownloadPDF() {
    const name = document.getElementById('pdf_nombre').textContent || 'Reporte';
    const date = document.getElementById('pdf_fechaGen').textContent || 'Fecha';
    const empId = document.getElementById('pdf_num').textContent || '000'; // Obtener ID de empleado

    // FORMATO DE NOMBRE SOLICITADO
    // "ID_Expediente_Nombre_Fecha"
    // Ejemplo: "12345_Expediente_Jorge Alberto..._30 de enero de 2026"
    const filename = `${empId}_Expediente_${name}_${date}`;

    // TRUCO PARA EL NOMBRE DEL ARCHIVO EN WINDOW.PRINT
    // El navegador usa el <title> de la página como sugerencia de nombre.
    const originalTitle = document.title;
    document.title = filename;

    // MÉTODO NATIVO DE IMPRESIÓN
    window.print();

    // Restaurar título después de un momento (damos tiempo al diálogo para abrirse)
    setTimeout(() => {
        document.title = originalTitle;
    }, 1000);
}
