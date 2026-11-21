// Shared date handling for evaluation history and individual PDF reports.
function parseReportDate(value) {
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) return null;
        if (value > 100000000000) { const d = new Date(value); return Number.isNaN(d.getTime()) ? null : d; }
        return null;
    }
    const text = String(value).trim();
    if (!text || /^(N\/?A|Invalid Date|null|undefined|No registrada)$/i.test(text)) return null;
    let match = text.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})(?:[ ,T]+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]\.?m\.?)?)?$/i);
    let year, month, day;
    if (match) { day=Number(match[1]); month=Number(match[2]); year=Number(match[3]); }
    else {
        match=text.match(/^(\d{4})-(\d{2})-(\d{2})(.*)$/);
        if (!match) return null;
        year=Number(match[1]);month=Number(match[2]);day=Number(match[3]);
    }
    const calendar=new Date(Date.UTC(year,month-1,day,12));
    if (year<1900 || year>2200 || calendar.getUTCFullYear()!==year || calendar.getUTCMonth()!==month-1 || calendar.getUTCDate()!==day) return null;
    // Calendar-only and locally formatted sheet dates keep the day entered by the operator.
    if (!/^\d{4}-\d{2}-\d{2}T/.test(text)) return calendar;
    const timestamp=new Date(text);
    return Number.isNaN(timestamp.getTime()) ? null : timestamp;
}
function getEvaluationDate(record) {
    const data=record?.data || {};
    const candidates=[record?.date,record?.fechaRegistro,record?.fecha_registro,data.fechaRegistro,data.fecha_registro,data.fecha,data['Fecha Registro']];
    for (const candidate of candidates) { const date=parseReportDate(candidate); if(date) return date; }
    return null;
}
function formatReportDate(value, options = {day:'2-digit',month:'2-digit',year:'numeric'}) {
    const date=value && typeof value==='object' && !(value instanceof Date) ? getEvaluationDate(value) : parseReportDate(value);
    return date ? date.toLocaleDateString('es-ES',{...options,timeZone:'America/Tijuana'}) : 'No registrada';
}

function isNutritionEvaluation(item) {
    const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    return String(item?.data?.programasList || item?.data?.programas || '').split(',').some(p => normalize(p) === 'consulta nutricional');
}
function openPDFModal(program = '') {
    if (!window.searchResults || window.searchResults.length === 0) {
        alert("No hay registros disponibles.");
        return;
    }

    const listContainer = document.getElementById('pdfModalList');
    listContainer.innerHTML = '';
    document.querySelector('#pdfModal .modal-title').textContent = program === 'Consulta Nutricional' ? 'Reporte de Consulta Nutricional' : 'Generar Reporte PDF';
    window.searchResults.forEach((item, index) => {
        if (program === 'Consulta Nutricional' && !isNutritionEvaluation(item)) return;
        const dateStr = formatReportDate(item, {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        const div = document.createElement('div');
        div.className = 'pdf-list-item';
        div.onclick = () => {
            previewPDF(index, program);
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

    if (!listContainer.children.length) {
        const empty = document.createElement('p');
        empty.textContent = 'No hay evaluaciones registradas para Consulta Nutricional.';
        listContainer.append(empty);
    }
    document.getElementById('pdfModal').style.display = 'flex';
}

function closePDFModal() {
    document.getElementById('pdfModal').style.display = 'none';
}

// Preview PDF Logic
function previewPDF(index, program = '') {
    const item = window.searchResults[index];
    if (program === 'Consulta Nutricional' && !isNutritionEvaluation(item)) return;
    const data = item.data;

    // 1. Populate Template Fields
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = (val && val !== '' && val !== 'Ninguno' && val !== 'NINGUNA') ? val : 'N/A';
    };

    const formatPdfDate = (val) => formatReportDate(val);
    setVal('pdf_fechaGen', formatReportDate(item, { day: 'numeric', month: 'long', year: 'numeric' }));
    setVal('pdf_fechaActual', formatReportDate(new Date(), { day: 'numeric', month: 'long', year: 'numeric' }));

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
        const fechaIngreso = parseReportDate(dateString);
        const hoy = new Date();
        if (!fechaIngreso || fechaIngreso > hoy) return 'N/A';

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

    // --- LEY SILLA ---
    const leySillaSection = document.getElementById('pdf_leysilla_section');
    if (leySillaSection) {
        const isLeySilla = (data.programasList || '').includes('Ley Silla');
        const intVal = data.leysilla_int || '';
        const expVal = data.leysilla_exp || '';

        const hasInt = intVal && intVal !== 'N/A' && intVal.trim() !== '';
        const hasExp = expVal && expVal !== 'N/A' && expVal.trim() !== '';

        if (isLeySilla || hasInt || hasExp) {
            leySillaSection.style.display = 'block';
            document.getElementById('pdf_leysilla_sintomas').textContent = hasInt ? intVal : 'Ninguno';
            document.getElementById('pdf_leysilla_exploracion').textContent = hasExp ? expVal : 'Sin hallazgos';
        } else {
            leySillaSection.style.display = 'none';
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
    setVal('pdf_notas', window.Nutrition ? window.Nutrition.plainNotes(data.notas) : data.notas);
    setVal('pdf_aptitud', data.aptitud_medica);
    setVal('pdf_seguimiento', formatPdfDate(data.seguimiento_fecha));
    const restEl = document.getElementById('pdf_restricciones');
    if (restEl) restEl.textContent = data.aptitud_restricciones || '';


    // 2. Clone and Show
    const template = document.querySelector('.pdf-container');
    template.querySelector('.nut-pdf-annex')?.remove();
    const nutritionAnnex = window.Nutrition?.annexText(data.notas);
    if (nutritionAnnex) {
        const section = document.createElement('section');
        section.className = 'nut-pdf-annex';
        const title = document.createElement('h2'); title.textContent = 'Consulta Nutricional — Historia alimentaria';
        section.append(title);
        nutritionAnnex.split('\n').filter(Boolean).forEach(line => {
            const entry = document.createElement('p'); entry.textContent = line; section.append(entry);
        });
        template.append(section);
    }
    const clone = template.cloneNode(true);
    clone.style.display = 'block'; // Make sure it's visible
    clone.dataset.reportProgram = program;
    if (program === 'Consulta Nutricional') configureNutritionReport(clone, data);

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
    const nutritionReport = document.querySelector('#pdfPreviewBody .pdf-container')?.dataset.reportProgram === 'Consulta Nutricional';
    const filename = nutritionReport ? `${empId}_Consulta_Nutricional_${name}_${date}` : `${empId}_Expediente_${name}_${date}`;

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

// Only the cloned preview is narrowed; the complete-report template remains intact.
function configureNutritionReport(clone, data) {
    const get = id => clone.querySelector('#' + id);
    const title = document.createElement('div');
    title.className = 'pdf-title'; title.style.fontSize = '14px';
    title.textContent = 'Reporte de Consulta Nutricional';
    clone.querySelector('.pdf-header > div').append(title);
    get('pdf_programas').textContent = 'Consulta Nutricional';
    ['pdf_funciones','pdf_patologias','pdf_vacunas','pdf_alergias','pdf_agudezaVisual','pdf_agudezaAuditiva','pdf_lateralidad'].forEach(id=>get(id)?.closest('.pdf-field')?.remove());
    clone.querySelector('.pdf-risk-grid')?.remove();
    get('pdf_leysilla_section')?.remove();
    // Medical fitness and work restrictions belong to occupational evaluations.
    const nextVisit = get('pdf_seguimiento')?.textContent || 'No registrada';
    get('pdf_aptitud')?.closest('.pdf-box')?.remove();
    const notes = get('pdf_notas');
    if (notes) {
        const programs = String(data.programasList || data.programas || '').split(',').map(x=>x.trim()).filter(Boolean);
        if (programs.length > 1) notes.textContent = 'Las notas compartidas con otros programas no se incluyen en este reporte.';
        const field=document.createElement('div');field.className='pdf-field';
        const label=document.createElement('span');label.className='pdf-label';label.textContent='Próxima consulta / Seguimiento';
        const value=document.createElement('div');value.className='pdf-value';value.textContent=nextVisit;field.append(label,value);
        notes.closest('.pdf-grid-2').append(field);
    }
    const findings=get('pdf_evaluacionHallazgos');
    if (findings) {
        findings.replaceChildren();let items=[];
        try { items=Array.isArray(data.evaluacionData)?data.evaluacionData:JSON.parse(data.evaluacionData || '[]'); } catch (_) {}
        if (Array.isArray(items)) items.forEach(h=>{
            const row=document.createElement('div');row.className='pdf-hallazgo';
            row.textContent=String(h.item || h.label || '')+': '+String(h.detalle || h.value || 'No registrado');findings.append(row);
        });
        if (!findings.children.length) findings.textContent='Sin hallazgos de evaluación médica integral registrados.';
    }
    const renamed = {
        '2. Información Laboral y Programas':'2. Información Laboral',
        '3. Evaluación Antropométrica y Signos Vitales':'3. Evaluación Nutricional y Signos Vitales',
        '4. Antecedentes Médicos y Factores de Riesgo':'4. Hábitos Nocivos y Antecedentes Heredofamiliares',
        '5. Exposición Laboral y Actividades':'5. Actividades Adicionales',
        '6. Hallazgos en Exploración Física':'6. Evaluación Médica Integral'
    };
    clone.querySelectorAll('.pdf-section-title').forEach(el=>{if(renamed[el.textContent])el.textContent=renamed[el.textContent];});
    // Render the exclusive nutrition annex with the existing report's section and field styles.
    clone.querySelector('.nut-pdf-annex')?.remove();
    const annex=window.Nutrition?.annexText(data.notas) || '';
    const groups=new Map();
    annex.split('\n').filter(Boolean).forEach(line=>{
        const match=line.match(/^(.*?) \/ (\d+) \/ (.*?): (.*)$/);if(!match)return;
        if(!groups.has(match[1]))groups.set(match[1],[]);
        groups.get(match[1]).push({label:match[3],value:match[4],index:match[2]});
    });
    const closure = get('pdf_notas')?.closest('.pdf-section');
    let sectionNumber=8;
    groups.forEach((entries,name)=>{
        const section=document.createElement('div');section.className='pdf-section nutrition-report-section';
        const heading=document.createElement('div');heading.className='pdf-section-title';heading.textContent=(sectionNumber++)+'. '+name;
        const grid=document.createElement('div');grid.className='pdf-grid-2';
        const repeated=entries.some(x=>x.index!=='1');
        entries.forEach(entry=>{
            const field=document.createElement('div');field.className='pdf-field';
            const label=document.createElement('span');label.className='pdf-label';label.textContent=(repeated?'Registro '+entry.index+' · ':'')+entry.label;
            const value=document.createElement('div');value.className='pdf-value';value.style.whiteSpace='pre-wrap';value.style.overflowWrap='anywhere';
            value.textContent=entry.value.replace(/\\([\\nr])/g,(_,c)=>c==='n'?'\n':c==='r'?'\r':'\\');
            field.append(label,value);grid.append(field);
        });section.append(heading,grid);clone.insertBefore(section,closure || null);
    });
    let number=1;
    clone.querySelectorAll('.pdf-section-title').forEach(heading=>{
        if(heading.textContent==='Resultados y Observaciones')return;
        heading.textContent=(number++)+'. '+heading.textContent.replace(/^\d+\.\s*/, '');
    });
    clone.querySelectorAll('.pdf-grid-2').forEach(grid=>{if(!grid.textContent.trim())grid.remove();});
}
