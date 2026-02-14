// --- BACKGROUND ROTATOR LOGIC ---
(function () {
    const TOTAL_IMAGES = 31;
    const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

    function updateBackground() {
        const index = (Math.floor(Date.now() / INTERVAL_MS) % TOTAL_IMAGES) + 1;
        const nextImageUrl = `url('/assets/backgrounds/${index}.png')`;

        // Identify layers
        const layer1 = document.getElementById('bg-layer-1');
        const layer2 = document.getElementById('bg-layer-2');

        if (!layer1 || !layer2) return;

        // Determine active/inactive
        const activeLayer = layer1.classList.contains('active') ? layer1 : layer2;
        const inactiveLayer = layer1.classList.contains('active') ? layer2 : layer1;

        // Only update if image is different
        if (inactiveLayer.style.backgroundImage !== nextImageUrl && activeLayer.style.backgroundImage !== nextImageUrl) {
            inactiveLayer.style.backgroundImage = nextImageUrl;
            requestAnimationFrame(() => {
                activeLayer.classList.remove('active');
                inactiveLayer.classList.add('active');
            });
        } else if (!activeLayer.style.backgroundImage) {
            // Initial Load
            activeLayer.style.backgroundImage = nextImageUrl;
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
        updateBackground();
        setInterval(updateBackground, 60000); // Check every minute

        // Check for Dashboard Persistence
        if (sessionStorage.getItem('openDashboardOnLoad') === 'true') {
            sessionStorage.removeItem('openDashboardOnLoad');
            // Small delay to ensure dashboard.js is loaded
            setTimeout(() => {
                if (typeof openDashboard === 'function') {
                    openDashboard();
                } else {
                    console.error("openDashboard function not found");
                }
            }, 100);
        }

        // Check for Pending Drafts
        checkDrafts();

        // Fetch Record Count
        fetchRecordCount();
    });
})();

// --- MAIN APP LOGIC ---

// Referencias Globales
const form = document.getElementById('nutritionForm');
const padecimientoSelect = document.getElementById('padecimientoSelect');
const padecimientoInput = document.getElementById('padecimiento');
const turnoSelect = document.getElementById('turnoSelect');
const turnoInput = document.getElementById('turno');
const areaSelect = document.getElementById('areaSelect');
const areaInput = document.getElementById('area');
const puestoSelect = document.getElementById('puestoSelect');
const puestoInput = document.getElementById('puesto');

if (form) {
    form.addEventListener('submit', handleFormSubmit);
}

// Estado Global
let currentAction = 'save'; // 'save' | 'update'
let currentRowIndex = null; // null | number
let currentSearchId = '';   // Para recordar qué ID buscaron
let lastKnownData = { nombre: '', genero: '' }; // Para persistencia lógica
let activeStep = 0; // Para persistencia de borrador

// --- HELPER: Set Select or Manual ---
// Intentar establecer un valor en un select. Si no existe, activar la opción manual.
function setSelectOrManual(selectId, inputId, value, manualOptionValue = 'Manual') {
    const select = document.getElementById(selectId);
    if (!select) return;

    // Si no hay valor o es nulo/undefined, no hacer nada (o limpiar si se desea)
    if (!value || value === 'N/A' || value.trim() === '') return;

    const normalizedValue = String(value).trim().toLowerCase();
    let found = false;

    // 1. Try exact match first
    for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value === value) {
            select.selectedIndex = i;
            found = true;
            break;
        }
    }

    // 2. Try case-insensitive match if not found
    if (!found) {
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].value.trim().toLowerCase() === normalizedValue) {
                select.selectedIndex = i;
                found = true;
                break;
            }
        }
    }

    if (!found) {
        // Si no se encuentra, seleccionar la opción manual y llenar el input
        // Check if manual option actually exists
        let manualExists = false;
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].value === manualOptionValue) {
                select.value = manualOptionValue;
                manualExists = true;
                break;
            }
        }

        if (manualExists) {
            const input = document.getElementById(inputId);
            if (input) {
                input.value = value;
                input.style.display = 'block';
            }
        } else {
            console.warn(`Value "${value}" not found in select "${selectId}" and manual option "${manualOptionValue}" missing. Attempting to set value directly.`);
            // Fallback: Just try setting it (maybe it's a dynamic select that accepts anything?)
            select.value = value;
        }

        // Disparar evento change si es necesario para lógica adicional
        select.dispatchEvent(new Event('change'));
    } else {
        // Si se encontró, asegurarse de ocultar el input manual si estaba visible
        const input = document.getElementById(inputId);
        if (input) input.style.display = 'none';
        select.dispatchEvent(new Event('change'));
    }
}

// --- DRAFT PERSISTENCE (Autosave) ---
function saveDraft() {
    // No guardar si estamos en el paso 0 o en History
    if (activeStep === 0 || activeStep === 'History') return;

    const data = {};

    // Robust capture: FormData misses disabled fields and unselected radios
    // We iterate through all form elements to capture everything
    const elements = form.elements;
    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];

        // FIX: Capture ALL selects by their ID for robust restoration
        // This creates a backup key like '_select_planta' that ensures we can restore
        // the value even if the standard 'name' based restoration fails or gets overwritten.
        if (el.tagName === 'SELECT' && el.id) {
            data['_select_' + el.id] = el.value;
        }

        if (!el.name) continue;

        if (el.type === 'checkbox') {
            if (!data[el.name]) data[el.name] = [];
            if (el.checked) data[el.name].push(el.value);
        } else if (el.type === 'radio') {
            if (el.checked) data[el.name] = el.value;
        } else {
            // This captures values even if disabled (like identification fields)
            data[el.name] = el.value;
        }
    }

    // Special handling for Sets and State
    data._extra = {
        programas: Array.from(programasSelected || []),
        patologias: Array.from(patologiasSelected || []),
        currentStep: activeStep,
        currentAction: currentAction,
        currentRowIndex: currentRowIndex
    };

    localStorage.setItem('hunter_draft', JSON.stringify({
        timestamp: new Date().getTime(),
        data: data
    }));
    console.log("Draft saved locally (robustly).");
}

async function loadDraft() {
    const draftStr = localStorage.getItem('hunter_draft');
    if (!draftStr) return;

    try {
        const draft = JSON.parse(draftStr);
        const data = draft.data;

        // Reset Form first
        form.reset();

        // Fill form fields (named elements)
        for (const [key, value] of Object.entries(data)) {
            if (key === '_extra' || key.startsWith('_select_')) continue;
            const elements = form.elements[key];
            if (!elements) continue;

            if (elements instanceof RadioNodeList || Array.isArray(elements) || elements.length > 1) {
                const vals = Array.isArray(value) ? value : [value];
                const elArray = (elements instanceof RadioNodeList) ? Array.from(elements) : elements;
                elArray.forEach(el => {
                    if (el.type === 'checkbox' || el.type === 'radio') {
                        el.checked = vals.includes(el.value);
                    }
                });
            } else {
                if (elements.type === 'checkbox' || elements.type === 'radio') {
                    elements.checked = (value === elements.value || value === 'on');
                } else {
                    elements.value = value;
                }
            }
        }

        // --- IDENTITY RECOVERY ---
        // Recover identity from backend, but PROTECT values already saved in the draft.
        if (data.num) {
            console.log("Refreshing identity from backend for ID:", data.num);
            await recoverIdentityFromBackend(data.num, data);
        }

        // --- FIX: Restore nameless selects (stored as _select_<id>) ---
        // This runs AFTER backend recovery to ensure draft values always win.
        for (const [key, value] of Object.entries(data)) {
            if (!key.startsWith('_select_')) continue;
            if (!value || value === '') continue; // Skip empty values

            const selectId = key.replace('_select_', '');
            const selectEl = document.getElementById(selectId);
            if (!selectEl) continue;

            // Try to set the value directly first
            let found = false;
            for (let i = 0; i < selectEl.options.length; i++) {
                if (selectEl.options[i].value === value) {
                    selectEl.selectedIndex = i;
                    found = true;
                    break;
                }
            }

            // If not found (dynamic options not loaded yet), try case-insensitive
            if (!found) {
                const normalizedValue = String(value).trim().toLowerCase();
                for (let i = 0; i < selectEl.options.length; i++) {
                    if (selectEl.options[i].value.trim().toLowerCase() === normalizedValue) {
                        selectEl.selectedIndex = i;
                        found = true;
                        break;
                    }
                }
            }

            if (found) {
                selectEl.dispatchEvent(new Event('change'));
                console.log(`Draft restored select "${selectId}" = "${value}"`);
            } else {
                console.warn(`Draft: Value "${value}" not found in select "${selectId}" options.`);
            }
        }

        // Restore programs/tags
        if (data._extra) {
            if (data._extra.programas) {
                programasSelected = new Set(data._extra.programas);
                renderProgramaTags();
            }
            if (data._extra.patologias) {
                patologiasSelected = new Set(data._extra.patologias);
                renderPatologiasTags();
            }

            // Restore Action State
            currentAction = data._extra.currentAction || 'save';
            currentRowIndex = data._extra.currentRowIndex || null;

            // Jump to Step
            if (data._extra.currentStep !== undefined) {
                showStep(data._extra.currentStep);
            }
        }

        // SYNC UI: Trigger all conditional field logic
        syncDraftUI();

        showToast("Borrador recuperado con éxito", "success transition-toast");

        // Hide the draft card
        const container = document.getElementById('draftContainer');
        if (container) container.innerHTML = '';

    } catch (e) {
        console.error("Error loading draft:", e);
        localStorage.removeItem('hunter_draft');
    }
}

/**
 * Trigger all conditional UI functions to match current form state
 */
function syncDraftUI() {
    if (typeof toggleGinecoFields === 'function') toggleGinecoFields();
    if (typeof checkAreaManual === 'function') checkAreaManual(document.getElementById('areaSelect'));
    if (typeof checkPuestoManual === 'function') checkPuestoManual(document.getElementById('puestoSelect'));
    if (typeof checkSupervisorManual === 'function') checkSupervisorManual(document.getElementById('supervisorSelect'));
    if (typeof checkTurnoManual === 'function') checkTurnoManual(document.getElementById('turnoSelect'));
    if (typeof checkEstadoCivilManual === 'function') checkEstadoCivilManual(document.getElementById('estadoCivilSelect'));
    if (typeof checkPadecimientoOtros === 'function') checkPadecimientoOtros(document.getElementById('padecimientoSelect'));
    if (typeof calcularIMC === 'function') calcularIMC();
}

/**
 * Call the new 'getProfile' action in backend to recover identity
 */
async function recoverIdentityFromBackend(id, draftData) {
    const token = sessionStorage.getItem('hunter_token');
    if (!token) return;

    // draftData contains the locally cached values from the draft.
    // If a field already has a value in the draft, we should NOT overwrite it
    // with backend data (which may be null/empty for unsaved records).
    const draft = draftData || {};

    /**
     * Helper: Only set a field if the draft doesn't already have a value for it.
     * This ensures local cache always wins over backend for incomplete records.
     */
    function safeSetText(elementId, backendValue) {
        if (!backendValue) return; // Backend has nothing, skip
        const draftVal = draft[elementId];
        if (draftVal && String(draftVal).trim() !== '') return; // Draft already has data, skip
        const el = document.getElementById(elementId);
        if (el) el.value = backendValue;
    }

    function safeSetSelect(selectId, inputId, backendValue, manualOption) {
        if (!backendValue) return; // Backend has nothing, skip
        // Check if the draft already has a value for this select
        // Check by name, by input id, AND by the _select_ prefix (for nameless selects)
        const draftVal = draft[selectId] || draft[inputId] || draft['_select_' + selectId];
        if (draftVal && String(draftVal).trim() !== '') return; // Draft already has data, skip
        setSelectOrManual(selectId, inputId, backendValue, manualOption);
    }

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'getProfile', id: id, token: token })
        });
        const result = await response.json();
        if (result.success && result.found) {
            const profile = result.data;

            // 1. Text Fields (only fill if draft is empty for this field)
            safeSetText('nombre', profile.nombre);
            safeSetText('edad', profile.edad);
            safeSetText('fechaIngresoPuesto', formatDateForInput(profile.fechaIngresoPuesto));
            safeSetText('fechaIngresoEmpresa', formatDateForInput(profile.fechaIngresoEmpresa));

            // Recalcular antigüedades si hay fechas
            if (typeof calcularAntiguedad === 'function') calcularAntiguedad();
            if (typeof calcularAntiguedadEmpresa === 'function') calcularAntiguedadEmpresa();

            // 2. Selects (only fill if draft is empty for this field)
            safeSetSelect('genero', null, profile.genero, null);
            safeSetSelect('planta', null, profile.planta, null);
            safeSetSelect('unidadNegocio', null, profile.unidadNegocio, null);

            // 3. Selects with Manual fallback
            safeSetSelect('areaSelect', 'area', profile.area, 'Manual');
            safeSetSelect('puestoSelect', 'puesto', profile.puesto, 'Manual');
            safeSetSelect('turnoSelect', 'turno', profile.turno, 'Manual');
            safeSetSelect('supervisorSelect', 'supervisor', profile.supervisor, 'Personalizar');
            safeSetSelect('estadoCivilSelect', 'estadoCivil', profile.estadoCivil, 'Otro');
            safeSetSelect('escolaridad', null, profile.escolaridad, 'Otro');

            console.log("Identity recovered from backend (draft-safe mode). Only empty fields were filled.");
        }
    } catch (e) {
        console.error("Error recovering identity:", e);
    }
}

// Helper para fechas (YYYY-MM-DD)
function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toISOString().split('T')[0];
    } catch (e) {
        return '';
    }
}

function checkDrafts() {
    const draftStr = localStorage.getItem('hunter_draft');
    const container = document.getElementById('draftContainer');
    if (!container) return;
    container.innerHTML = '';

    if (draftStr) {
        try {
            const draft = JSON.parse(draftStr);
            // Don't show if older than 24h? For now always show.
            const name = draft.data.nombre || "Registro sin nombre";
            const date = new Date(draft.timestamp);
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = date.toLocaleDateString();

            const card = document.createElement('div');
            card.className = 'draft-card';
            card.onclick = loadDraft;
            card.innerHTML = `
                <div class="draft-info">
                    <span class="draft-title">Registro Pendiente</span>
                    <span class="draft-name">${name}</span>
                    <span class="draft-meta">Iniciado: ${dateStr} - ${timeStr}</span>
                </div>
                <div class="draft-action">Continuar &rarr;</div>
            `;
            container.appendChild(card);
        } catch (e) {
            localStorage.removeItem('hunter_draft');
        }
    }
}

// Modal Utilities
function showHunterModal(title, msg, type = 'info') {
    const modal = document.getElementById('hunterGenericModal');
    const icon = document.getElementById('hunterModalIcon');
    const titleEl = document.getElementById('hunterModalTitle');
    const msgEl = document.getElementById('hunterModalMessage');
    const btnOk = document.getElementById('hunterBtnOk');
    const btnCancel = document.getElementById('hunterBtnCancel');

    if (!modal) {
        alert(msg); // Fallback
        return;
    }

    // Configurar Estilo
    titleEl.textContent = title;
    msgEl.innerHTML = msg;

    // Iconos y Colores
    const topBar = document.getElementById('hunterModalBar');
    const iconContainer = document.getElementById('hunterModalIconContainer');
    const iconEl = document.getElementById('hunterModalIcon');
    const logoEl = document.getElementById('hunterModalLogo');

    if (logoEl) logoEl.style.display = 'none';
    if (iconEl) iconEl.style.display = 'block';

    if (type === 'success') {
        iconEl.setAttribute('data-lucide', 'check-circle');
        titleEl.style.color = '#10b981';
        if (topBar) topBar.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        if (iconContainer) iconContainer.style.color = '#10b981';
        btnOk.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    } else if (type === 'error') {
        iconEl.setAttribute('data-lucide', 'alert-circle');
        titleEl.style.color = '#ef4444';
        if (topBar) topBar.style.background = 'linear-gradient(135deg, #ef4444, #b91c1c)';
        if (iconContainer) iconContainer.style.color = '#ef4444';
        btnOk.style.background = 'linear-gradient(135deg, #ef4444, #b91c1c)';
    } else if (type === 'warning') {
        iconEl.setAttribute('data-lucide', 'alert-triangle');
        titleEl.style.color = '#f59e0b';
        if (topBar) topBar.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        if (iconContainer) iconContainer.style.color = '#f59e0b';
        btnOk.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
    } else {
        iconEl.setAttribute('data-lucide', 'info');
        titleEl.style.color = 'var(--primary-color)';
        if (topBar) topBar.style.background = 'linear-gradient(135deg, var(--primary-color), var(--accent-color))';
        if (iconContainer) iconContainer.style.color = 'var(--primary-color)';
        btnOk.style.background = 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))';
    }

    // Refresh Lucide Icons
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Reset buttons
    btnCancel.style.display = 'none';
    btnOk.onclick = () => {
        modal.style.display = 'none';
        if (type === 'reload') window.location.reload();
    };

    modal.style.display = 'flex';
}

function showHunterConfirm(title, msg, onConfirm) {
    const modal = document.getElementById('hunterGenericModal');
    const titleEl = document.getElementById('hunterModalTitle');
    const msgEl = document.getElementById('hunterModalMessage');
    const btnOk = document.getElementById('hunterBtnOk');
    const btnCancel = document.getElementById('hunterBtnCancel');
    const topBar = document.getElementById('hunterModalBar');
    const iconContainer = document.getElementById('hunterModalIconContainer');
    const iconEl = document.getElementById('hunterModalIcon');
    const logoEl = document.getElementById('hunterModalLogo');

    // Branding: Show Logo, Hide Icon for Confirmations
    if (logoEl) logoEl.style.display = 'block';
    if (iconEl) iconEl.style.display = 'none';

    titleEl.textContent = title;
    titleEl.style.color = '#10b981'; // Green instead of yellow
    msgEl.innerHTML = msg;

    if (topBar) topBar.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    if (iconContainer) iconContainer.style.color = '#10b981';

    // Refresh Lucide Icons (though hidden here)
    if (typeof lucide !== 'undefined') lucide.createIcons();

    btnOk.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    btnOk.textContent = 'Sí, continuar';
    btnCancel.textContent = 'Cancelar';

    btnCancel.style.display = 'inline-block';

    btnCancel.onclick = () => {
        modal.style.display = 'none';
    };

    btnOk.onclick = () => {
        modal.style.display = 'none';
        if (onConfirm) onConfirm();
    };

    modal.style.display = 'flex';
    setTimeout(() => btnOk.focus(), 100);
}

// Inicialización de Opciones
(function initOptions() {
    // Area
    if (areaSelect) {
        const areaDocFrag = document.createDocumentFragment();
        AREA_OPTIONS.forEach(opt => {
            const el = document.createElement('option');
            el.value = opt;
            el.textContent = opt;
            areaDocFrag.appendChild(el);
        });
        areaSelect.appendChild(areaDocFrag);
    }

    // Puesto
    if (puestoSelect) {
        const puestoDocFrag = document.createDocumentFragment();
        PUESTO_OPTIONS.forEach(opt => {
            const el = document.createElement('option');
            el.value = opt;
            el.textContent = opt;
            puestoDocFrag.appendChild(el);
        });
        puestoSelect.appendChild(puestoDocFrag);
    }

    // Supervisor
    const supervisorSelect = document.getElementById('supervisorSelect');
    if (supervisorSelect) {
        const supervisorDocFrag = document.createDocumentFragment();
        SUPERVISORES.forEach(opt => {
            const el = document.createElement('option');
            el.value = opt;
            el.textContent = opt;
            supervisorDocFrag.appendChild(el);
        });
        supervisorSelect.appendChild(supervisorDocFrag);
    }
})();

// UI Helpers
function checkPadecimientoOtros(select) {
    if (select.value === 'Otros') {
        padecimientoInput.style.display = 'block';
        padecimientoInput.value = '';
        padecimientoInput.focus();
    } else {
        padecimientoInput.style.display = 'none';
    }
}

function checkAreaManual(select) {
    if (select.value === 'Manual') {
        areaInput.style.display = 'block';
        areaInput.value = '';
        areaInput.focus();
        areaInput.required = true;
    } else {
        areaInput.style.display = 'none';
        areaInput.required = false;
    }
}

function checkPuestoManual(select) {
    if (select.value === 'Manual') {
        puestoInput.style.display = 'block';
        puestoInput.value = '';
        puestoInput.focus();
        puestoInput.required = true;
    } else {
        puestoInput.style.display = 'none';
        puestoInput.required = false;
    }
}

function checkSupervisorManual(select) {
    const input = document.getElementById('supervisor');
    if (select.value === 'Personalizar') {
        input.style.display = 'block';
        input.value = '';
        input.focus();
        input.required = true;
    } else {
        input.style.display = 'none';
        input.required = false;
    }
}

function checkTurnoManual(select) {
    if (select.value === 'Manual') {
        turnoInput.style.display = 'block';
        turnoInput.value = '';
        turnoInput.focus();
        turnoInput.required = true;
    } else {
        turnoInput.style.display = 'none';
        turnoInput.required = false;
    }
}

async function fetchRecordCount() {
    const counterEl = document.getElementById('headerRecordCount');
    const valueEl = document.getElementById('recordCountValue');
    const token = sessionStorage.getItem('hunter_token');

    if (!token || !counterEl || !valueEl) return;

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'getRecordCount', token: token })
        });
        const result = await response.json();
        if (result.success) {
            valueEl.textContent = result.count;
            counterEl.style.display = 'inline-block';
        }
    } catch (e) {
        console.error("Error fetching record count:", e);
    }
}

function toggleAlta() {
    const btn = document.getElementById('btnAlta');
    const input = document.getElementById('restr_alta');

    if (input.value === 'NO') {
        input.value = 'SI';
        btn.textContent = 'ALTA ON';
        btn.style.background = '#10b981'; // Green
        btn.style.color = 'white';
        btn.style.border = '1px solid #059669';
    } else {
        input.value = 'NO';
        btn.textContent = 'ALTA OFF';
        btn.style.background = '#f1f5f9'; // Slate 100
        btn.style.color = '64748b'; // Slate 500
        btn.style.border = '1px solid #cbd5e1';
    }
}

// --- NAVIGATION LOGIC (Conditional Branching) ---
const PROGRAM_REQUIREMENTS = {
    // Todos los programas ahora siguen el flujo completo (0-7)
    'DEFAULT': [0, 1, 2, 3, 4, 5, 6, 7],

    /* Lógica original preservada para referencia futura:
    'Control de embarazo': [2, 3, 4, 7],
    'Control de niño sano': [2, 3, 4, 7],
    'Cronico Degenerativos': [2, 3, 4, 7],
    'Nuevo ingreso': [2, 3, 4, 5, 7],
    'Salud Ocupacional': [2, 3, 4, 5, 7],
    'Brigadistas': [2, 4, 7],
    'Actividades restringidas': [2, 3, 6, 7]
    */
};

function getEnabledSteps() {
    // Ahora todos los programas usan todos los pasos por defecto
    return [0, 1, 2, 3, 4, 5, 6, 7];

    /* Lógica dinámica original:
    const enabled = new Set([0, 1]);
    if (!programasSelected || programasSelected.size === 0) {
        enabled.add(2);
    } else {
        programasSelected.forEach(p => {
            const steps = PROGRAM_REQUIREMENTS[p];
            if (steps) steps.forEach(s => enabled.add(s));
        });
    }
    return Array.from(enabled).sort((a, b) => a - b);
    */
}

function getNextStep(current) {
    const enabled = getEnabledSteps();
    const currIdx = enabled.indexOf(Number(current));
    if (currIdx !== -1 && currIdx < enabled.length - 1) {
        return enabled[currIdx + 1];
    }
    return null;
}

function getPrevStep(current) {
    const enabled = getEnabledSteps();
    const currIdx = enabled.indexOf(Number(current));
    if (currIdx !== -1 && currIdx > 0) {
        return enabled[currIdx - 1];
    }
    return 0; // Fallback to home
}

// Navigation
function nextStep() {
    const currentStepEl = document.querySelector('.form-step.active');

    // Validación para el paso 1 (Programas)
    if (currentStepEl && currentStepEl.id === 'step1') {
        if (programasSelected.size === 0) {
            alert("Debes seleccionar al menos un Programa de Salud para continuar.");
            return;
        }
    }

    const inputs = currentStepEl.querySelectorAll('input, select, textarea');
    let valid = true;
    inputs.forEach(input => {
        // Skip validation for disabled or hidden elements
        if (input.offsetParent !== null && !input.disabled && !input.checkValidity()) {
            input.reportValidity();
            valid = false;
        }
    });

    if (!valid) return;

    saveDraft(); // Save draft on every change of step

    // Dynamic jump
    const current = Number(activeStep);
    const target = getNextStep(current);
    if (target !== null) {
        showStep(target);
    }
}

function prevStep() {
    const current = Number(activeStep);
    const target = getPrevStep(current);
    showStep(target);
}

function showStep(stepNumber) {
    const enabledSteps = getEnabledSteps();
    const allSteps = document.querySelectorAll('.form-step');

    // Identificar el target basándose en ID
    let targetId = 'step' + stepNumber;
    if (stepNumber === 'History') targetId = 'stepHistory';
    const targetEl = document.getElementById(targetId);

    allSteps.forEach(step => {
        const isActive = (step === targetEl);
        step.classList.toggle('active', isActive);

        // El número de paso suele estar en el ID (step0, step1...) o en un atributo
        // Para la lógica de deshabilitar, necesitamos el número puramente
        const sNum = step.id.replace('step', '');
        const isHistory = (sNum === 'History');

        // Solo deshabilitamos inputs de pasos numéricos que no están en el flujo
        if (!isHistory) {
            const num = parseInt(sNum);
            const isStepEnabled = enabledSteps.includes(num) || num === 0; // 0 siempre enabled
            const inputs = step.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.disabled = !isStepEnabled;
            });
        }
    });

    activeStep = stepNumber;

    // AI Trigger
    if (String(stepNumber) === '7') {
        setTimeout(triggerAiSuggestion, 300);
    }

    // Progress Bar
    if (Number.isNaN(Number(stepNumber)) && stepNumber === 'History') {
        // No update logic for history
    } else {
        document.querySelectorAll('.progress-step').forEach(el => {
            const step = parseInt(el.getAttribute('data-step'));
            if (step <= stepNumber) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });

        // Animate progress lines (fill completed ones)
        document.querySelectorAll('.progress-line').forEach((line, index) => {
            if (index < stepNumber) {
                line.classList.add('filled');
            } else {
                line.classList.remove('filled');
            }
        });
    }
}

function goBackFromStep1() {
    if (currentAction === 'update') {
        showStep('History');
    } else {
        showStep(0);
    }
}

// Calculations and Logic
function calcularIMC() {
    const peso = parseFloat(document.getElementById('peso').value);
    const tallaCm = parseFloat(document.getElementById('talla').value);
    if (peso > 0 && tallaCm > 0) {
        const tallaM = tallaCm / 100;
        const imc = peso / (tallaM * tallaM);
        document.getElementById('imc').value = imc.toFixed(1);
    }
}

function toggleHabito(checkbox) {
    const container = document.getElementById('habitosDetailsContainer');
    const type = checkbox.value;
    const idBase = 'habito_' + type;

    if (checkbox.checked) {
        const div = document.createElement('div');
        div.id = idBase + '_wrapper';
        div.className = 'grid-3';
        div.style.marginTop = '1rem';
        div.style.padding = '0.5rem';
        div.style.backgroundColor = '#f8fafc';
        div.style.borderRadius = '8px';
        div.style.border = '1px solid #e2e8f0';

        div.innerHTML = `
            <div class="full-width" style="margin-bottom:0.5rem; font-weight:600; color:var(--primary-color)">Detalles de ${type}:</div>
            <div class="form-group">
                <label>Tipo</label>
                <input type="text" name="${idBase}_Tipo" placeholder="Ej: ...">
            </div>
            <div class="form-group">
                <label>Cantidad</label>
                <input type="text" name="${idBase}_Cantidad" placeholder="Ej: ...">
            </div>
            <div class="form-group">
                <label>Frecuencia</label>
                <input type="text" name="${idBase}_Frecuencia" placeholder="Ej: ...">
            </div>
        `;
        container.appendChild(div);
    } else {
        const existing = document.getElementById(idBase + '_wrapper');
        if (existing) existing.remove();
    }
}

function openTab(evt, tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-link').forEach(el => {
        el.classList.remove('active');
        el.style.backgroundColor = '#f1f5f9';
        el.style.fontWeight = 'normal';
    });
    document.getElementById(tabName).style.display = 'block';
    evt.currentTarget.classList.add('active');
    evt.currentTarget.style.backgroundColor = '#e2e8f0';
    evt.currentTarget.style.fontWeight = '500';
}

// Helper for seniority calculation
function getSeniorityText(dateString) {
    if (!dateString) return "";
    const fechaIngreso = new Date(dateString);
    const hoy = new Date();
    if (fechaIngreso > hoy) return "Fecha futura inválida";

    let anos = hoy.getFullYear() - fechaIngreso.getFullYear();
    let meses = hoy.getMonth() - fechaIngreso.getMonth();
    let dias = hoy.getDate() - fechaIngreso.getDate();

    if (dias < 0) {
        meses--;
        const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
        dias += ultimoDiaMesAnterior;
    }
    if (meses < 0) {
        anos--;
        meses += 12;
    }
    let texto = "";
    if (anos > 0) texto += `${anos} año${anos !== 1 ? 's' : ''}`;
    if (meses > 0) texto += `${texto ? ', ' : ''}${meses} mes${meses !== 1 ? 'es' : ''}`;
    if (dias > 0) texto += `${texto ? ' y ' : ''}${dias} día${dias !== 1 ? 's' : ''}`;
    if (!texto) texto = "0 días (Ingresó hoy)";
    return texto;
}

function updateFechaEmpresaFromPuesto() {
    const fechaIngresoInput = document.getElementById('fechaIngresoPuesto').value;
    const empresaInput = document.getElementById('fechaIngresoEmpresa');
    if (fechaIngresoInput) {
        empresaInput.value = fechaIngresoInput;
        calcularAntiguedadEmpresa();
    }
    calcularAntiguedad();
}

function calcularAntiguedad() {
    const val = document.getElementById('fechaIngresoPuesto').value;
    document.getElementById('antiguedadPuesto').value = getSeniorityText(val);
}

function calcularAntiguedadEmpresa() {
    const val = document.getElementById('fechaIngresoEmpresa').value;
    document.getElementById('antiguedadEmpresa').value = getSeniorityText(val);
}

// Tag Systems
let programasSelected = new Set();
function addPrograma() {
    const select = document.getElementById('programaSelect');
    const val = select.value;
    if (!val) return;
    if (!programasSelected.has(val)) {
        programasSelected.add(val);
        renderProgramaTags();
    }
    select.value = "";
}
function removePrograma(val) {
    if (programasSelected.has(val)) {
        programasSelected.delete(val);
        renderProgramaTags();
    }
}
function renderProgramaTags() {
    const container = document.getElementById('programasTags');
    const hiddenInput = document.getElementById('programasList');
    container.innerHTML = '';
    const list = Array.from(programasSelected);
    hiddenInput.value = list.join(', ');
    list.forEach(item => {
        const tag = document.createElement('div');
        tag.style.cssText = `background-color:#dcfce7;color:#166534;padding:4px 10px;border-radius:16px;display:flex;align-items:center;gap:6px;font-size:0.85rem;border:1px solid #bbf7d0;`;
        tag.innerHTML = `${item}<span onclick="removePrograma('${item}')" style="cursor: pointer; font-weight: bold; color: #15803d;">&times;</span>`;
        container.appendChild(tag);
    });
}

let patologiasSelected = new Set();
function addPatologia(valor = null) {
    const select = document.getElementById('patologiasSelect');
    const val = valor || select.value;
    if (!val) return;
    if (val === 'Otros') {
        document.getElementById('patologiasOtros').style.display = 'block';
        document.getElementById('patologiasOtros').focus();
    }
    if (!patologiasSelected.has(val)) {
        patologiasSelected.add(val);
        renderPatologiasTags();
    }
    select.value = "";
}
function removePatologia(val) {
    if (patologiasSelected.has(val)) {
        patologiasSelected.delete(val);
        if (val === 'Otros') {
            const otrosInput = document.getElementById('patologiasOtros');
            otrosInput.style.display = 'none';
            otrosInput.value = '';
        }
        renderPatologiasTags();
    }
}
function renderPatologiasTags() {
    const container = document.getElementById('patologiasTags');
    const hiddenInput = document.getElementById('patologiasLista');
    container.innerHTML = '';
    const list = Array.from(patologiasSelected);
    hiddenInput.value = list.join(', ');
    list.forEach(item => {
        const tag = document.createElement('div');
        tag.style.cssText = `background-color:#e0f2fe;color:#0369a1;padding:4px 10px;border-radius:16px;display:flex;align-items:center;gap:6px;font-size:0.9rem;border:1px solid #bae6fd;`;
        tag.innerHTML = `${item}<span onclick="removePatologia('${item}')" style="cursor: pointer; font-weight: bold; color: #0284c7;">&times;</span>`;
        container.appendChild(tag);
    });
}

// Toast Helper
function showToast(message, type = 'info') {
    let toast = document.getElementById('hunterToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'hunterToast';
        toast.style.cssText = `
            position: fixed; bottom: 20px; right: 20px;
            background: #1e293b; color: white; padding: 12px 24px;
            border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000; font-weight: 500; transition: opacity 0.3s;
        `;
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.backgroundColor = type === 'error' ? '#ef4444' : (type === 'success' ? '#10b981' : '#1e293b');
    toast.style.opacity = '1';
    toast.style.display = 'block';

    if (type !== 'processing') {
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.style.display = 'none', 300);
        }, 3000);
    }
}

// REST Interface (Optimistic)
function handleFormSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');

    // 1. Gather Data & Snapshot State
    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => data[key] = value);

    // Manual Overrides
    const estadoCivilSelectVal = document.getElementById('estadoCivilSelect').value;
    data.estadoCivil = (estadoCivilSelectVal === 'Otro') ? document.getElementById('estadoCivil').value : estadoCivilSelectVal;

    const padSelectVal = padecimientoSelect.value;
    data.padecimiento = (padSelectVal === 'Otros') ? document.getElementById('padecimiento').value : padSelectVal;

    const supervisorSelectVal = document.getElementById('supervisorSelect').value;
    data.supervisor = (supervisorSelectVal === 'Personalizar') ? document.getElementById('supervisor').value : supervisorSelectVal;

    const areaSelectVal = areaSelect.value;
    data.area = (areaSelectVal === 'Manual') ? areaInput.value : areaSelectVal;

    const puestoSelectVal = puestoSelect.value;
    data.puesto = (puestoSelectVal === 'Manual') ? puestoInput.value : puestoSelectVal;

    const turnoSelectVal = turnoSelect.value;
    data.turno = (turnoSelectVal === 'Manual') ? turnoInput.value : turnoSelectVal;

    // Habitos
    const habitosSeleccionados = [];
    document.querySelectorAll('input[name="habitosCheck"]:checked').forEach(cb => habitosSeleccionados.push(cb.value));
    data.habitosLista = habitosSeleccionados.join(', ');

    const habitTypes = ['Alcohol', 'Tabaco', 'Drogas', 'Medicamentos'];
    habitTypes.forEach(h => {
        const keys = [`habito_${h}_Tipo`, `habito_${h}_Cantidad`, `habito_${h}_Frecuencia`];
        keys.forEach(k => {
            if (!data[k] || data[k].trim() === '') data[k] = 'N/A';
        });
    });

    data.patologiasLista = document.getElementById('patologiasLista').value;
    data.programasList = document.getElementById('programasList').value;

    ['riesgosQuimicos', 'riesgosFisicos', 'riesgosErgonomicos', 'riesgosMetabolicos', 'riesgosBiologicos'].forEach(name => {
        const checked = [];
        document.querySelectorAll(`input[name="${name}"]:checked`).forEach(cb => checked.push(cb.value));
        data[name] = checked.join(', ');
    });

    // New Fields: AHF, Vacunas (Individual Checkboxes)
    const checkInputs = [
        'ahf_diabetes', 'ahf_hipertension', 'ahf_cancer', 'ahf_cardiopatias',
        'vacuna_tetanos', 'vacuna_influenza', 'vacuna_hepatitis'
    ];
    checkInputs.forEach(id => {
        const el = document.getElementById(id) || document.querySelector(`input[name="${id}"]`);
        data[id] = (el && el.checked) ? 'SI' : 'NO';
    });

    // Aptitud
    data.aptitud_medica = document.getElementById('aptitud_medica').value;
    data.aptitud_restricciones = document.getElementById('aptitud_restricciones').value;
    data.seguimiento_fecha = document.getElementById('seguimiento_fecha').value;
    data.agudezaVisual = document.getElementById('agudezaVisual').value;
    data.agudezaAuditiva = document.getElementById('agudezaAuditiva').value;
    data.alergia_medicamentos = document.getElementById('alergia_medicamentos').value;
    data.ahf_otros = document.getElementById('ahf_otros').value;

    // Capturar detalles de AHF dinámicos
    const ahfDetailFields = ['ahf_diabetes_detalle', 'ahf_hipertension_detalle', 'ahf_cancer_detalle', 'ahf_cardiopatias_detalle'];
    ahfDetailFields.forEach(id => {
        const el = document.getElementById(id);
        data[id] = el ? el.value : '';
    });

    // --- NUEVO: Captura de Datos Paso 6 (Actividades Restringidas) ---
    data.restr_enfermedad_general = document.getElementById('restr_enfermedad_general').value;
    data.restr_riesgo_trabajo = document.getElementById('restr_riesgo_trabajo').value;

    const restrTipo = document.querySelector('input[name="restr_tipo"]:checked');
    data.restr_tipo = restrTipo ? restrTipo.value : '';

    data.restr_alta = document.getElementById('restr_alta').value;
    data.restr_fecha_inicio = document.getElementById('restr_fecha_inicio').value;
    data.restr_fecha_termino = document.getElementById('restr_fecha_termino').value;
    data.restr_motivo = document.getElementById('restr_motivo').value;
    data.restr_region_afectada = document.getElementById('restr_region_afectada').value;

    const restrLista = [];
    document.querySelectorAll('input[name="restr_lista"]:checked').forEach(cb => restrLista.push(cb.value));
    data.restr_lista = restrLista.join(', ');

    data.restr_otros = document.getElementById('restr_otros').value;
    // ----------------------------------------------------------------

    // --- DINÁMICOS: Hallazgos de Exploración y Evaluación ---
    const exploracionItems = [];
    document.querySelectorAll('#exploracionList > div').forEach(div => {
        const label = div.querySelector('strong').textContent.replace(':', '');
        const value = div.querySelector('input').value;
        exploracionItems.push({ item: label, detalle: value });
    });
    data.exploracionData = JSON.stringify(exploracionItems);

    const evaluacionItems = [];
    document.querySelectorAll('#evaluacionList > div').forEach(div => {
        const label = div.querySelector('strong').textContent.replace(':', '');
        const value = div.querySelector('input').value;
        evaluacionItems.push({ item: label, detalle: value });
    });
    data.evaluacionData = JSON.stringify(evaluacionItems);

    const payload = {
        ...data,
        action: currentAction,
        token: sessionStorage.getItem('sessionToken')
    };

    if (currentAction === 'update' && currentRowIndex) {
        payload.rowIndex = currentRowIndex;
    }

    // 2. Optimistic UI Reset
    const savedSearchId = currentSearchId; // Capture for later
    form.reset();
    showStep(0);

    showToast("💾 Guardando en segundo plano...", "processing");

    // 3. Background Request
    fetch(CONFIG.API_URL, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
    })
        .then(response => response.json())
        .then((data) => {
            if (data.success) {
                if (savedSearchId) {
                    localStorage.removeItem('hunter_cache_' + savedSearchId);
                    console.log("🧹 Caché invalidado para: " + savedSearchId);
                }
                localStorage.removeItem('hunter_draft'); // Clear draft on success
                activeStep = 0; // Reset active step
                showToast("✅ Registro guardado exitosamente.", "success");

            } else {
                throw new Error(data.error || "Error desconocido en el servidor.");
            }
        })
        .catch((error) => {
            console.error("Error Background Save:", error);
            showHunterModal("Error al Guardar", `No se pudo guardar el registro anterior. <br><strong>Error:</strong> ${error.message}<br>Por favor, intenta ingresarlo nuevamente.`, "error");
            showToast("❌ Falló el guardado.", "error");
        });
}

function searchEmployee() {
    const searchId = document.getElementById('searchId').value.trim();
    if (!searchId) {
        alert("Por favor ingresa un número de empleado.");
        return;
    }
    currentSearchId = searchId;
    const btn = document.querySelector('#step0 button');
    const originalText = btn.textContent;

    const cachedData = localStorage.getItem('hunter_cache_' + searchId);
    let cacheUsed = false;

    if (cachedData) {
        try {
            const parsed = JSON.parse(cachedData);
            if (parsed.found && parsed.results && parsed.results.length > 0) {
                renderHistory(parsed.results, true);
                showStep('History');
                cacheUsed = true;
            } else if (parsed.found && parsed.data) {
                startNewRecord(parsed.data);
                cacheUsed = true;
            }
        } catch (e) {
            localStorage.removeItem('hunter_cache_' + searchId);
        }
    }

    if (!cacheUsed) {
        btn.disabled = true;
        btn.innerHTML = "Buscando... <span style='font-size:0.8em'></span>";
    }

    fetch(CONFIG.API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
            action: 'search',
            id: searchId,
            token: sessionStorage.getItem('sessionToken')
        })
    })
        .then(response => response.json())
        .then(res => {
            btn.disabled = false;
            btn.textContent = originalText;

            // FIX: Only cache if found
            if (res.found) {
                localStorage.setItem('hunter_cache_' + searchId, JSON.stringify(res));
            } else {
                // If not found, ensure we don't have bad cache
                localStorage.removeItem('hunter_cache_' + searchId);
            }

            if (res.found && res.results && res.results.length > 0) {
                renderHistory(res.results);
                showStep('History');
            } else if (res.found && res.data) {
                startNewRecord(res.data);
            } else {
                if (cacheUsed && !res.found) {
                    alert("⚠️ El registro fue eliminado en el servidor.");
                    startNewRecord(null);
                    return;
                }
                if (!cacheUsed) {
                    showHunterConfirm(
                        "Empleado no encontrado",
                        `¿Deseas registrar un NUEVO empleado con ID <strong>${searchId}</strong>?`,
                        () => startNewRecord(null)
                    );
                }
            }
        })
        .catch(error => {
            console.error("Error Network:", error);
            btn.disabled = false;
            btn.textContent = originalText;
            if (!cacheUsed) {
                showHunterModal("Error de Conexión", error.message, "error");
            }
        });
}

function renderHistory(results, fromCache = false) {
    window.searchResults = results; // For PDF
    const container = document.getElementById('dashboardContent');
    container.innerHTML = '';

    const latest = results[0];
    const data = latest.data;

    // Header Construction
    const name = data.nombre || "Empleado";
    const id = data.num || "N/A";
    const genero = data.genero || "No especificado";
    const edad = data.edad ? `${data.edad} años` : "--";
    const puesto = data.puesto || "Puesto no registrado";
    const area = data.area || "Área no registrada";
    const planta = data.planta || "Planta no registrada";
    const turno = data.turno || "Turno no reg.";

    // Guardar para uso global
    lastKnownData.nombre = name;
    lastKnownData.genero = genero;

    // Warning Message (Cache)
    if (fromCache) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'cache-warning';
        warningDiv.style.cssText = `
            background-color: #fff7ed; 
            color: #c2410c; 
            padding: 1rem; 
            margin-bottom: 2rem; 
            border-radius: 12px; 
            border: 1px solid #fdba74; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            gap: 0.5rem; 
            font-weight: 500;
            box-shadow: 0 2px 4px rgba(234, 88, 12, 0.1);
        `;
        warningDiv.innerHTML = `<span>⚡</span> <span>Mostrando copia local... Verificando cambios...</span>`;
        container.appendChild(warningDiv);
    }

    // Profile Header HTML Construction
    // ... Simplified Visual Construction ...
    const profileHeader = document.createElement('div');
    profileHeader.className = 'profile-header';
    profileHeader.innerHTML = `
        <div class="profile-content" style="text-align: center; width: 100%;">
            <h2 class="profile-name" style="margin-bottom: 1.5rem; font-size: 1.8rem;">${name}</h2>
            <div class="profile-data-grid" style="justify-content: center;">
                
                <!-- Numero -->
                <div class="profile-data-item centered-item">
                    <div class="data-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0c0 .883-.393 1.627-1 1.948-.557.292 1.25.33 0 0 .557-.292.557-1.066.557-1.948zM5 6h14m-1 13v-4" />
                        </svg>
                    </div>
                    <div class="data-text">
                        <span class="data-label">NUMERO DE EMPLEADO</span>
                        <span class="data-value">${id}</span>
                    </div>
                </div>

                <!-- Genero / Edad -->
                <div class="profile-data-item centered-item">
                    <div class="data-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <div class="data-text">
                        <span class="data-label">GENERO Y EDAD</span>
                        <span class="data-value">${genero}, ${edad}</span>
                    </div>
                </div>

                <!-- Planta -->
                <div class="profile-data-item centered-item">
                    <div class="data-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8M5 21h14M5 21l1-9M19 21l-1-9M9 21v-6a2 2 0 012-2h2a2 2 0 012 2v6" />
                        </svg>
                    </div>
                    <div class="data-text">
                        <span class="data-label">PLANTA</span>
                        <span class="data-value">${planta}</span>
                    </div>
                </div>

                <!-- Puesto (Span 2) -->
                <div class="profile-data-item span-2-cols centered-item">
                    <div class="data-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div class="data-text">
                        <span class="data-label">PUESTO & ÁREA</span>
                        <span class="data-value">${puesto} - ${area}</span>
                    </div>
                </div>

                <!-- Turno -->
                <div class="profile-data-item centered-item">
                    <div class="data-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div class="data-text">
                        <span class="data-label">TURNO</span>
                        <span class="data-value">${turno}</span>
                    </div>
                </div>
            </div>
        </div>`;
    container.appendChild(profileHeader);

    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'section-title';
    sectionTitle.textContent = 'Historial de Evaluaciones';
    container.appendChild(sectionTitle);

    const grid = document.createElement('div');
    grid.className = 'history-grid';

    results.forEach((item, index) => {
        const dateObj = new Date(item.date);
        const dateStrRaw = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const dateStr = dateStrRaw.charAt(0).toUpperCase() + dateStrRaw.slice(1);
        const peso = item.data.peso ? `${item.data.peso} kg` : '--';
        const imc = (item.data.imc !== undefined && item.data.imc !== '') ? item.data.imc : '--';

        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `
            <div class="history-header">
                <div class="history-date">
                    <span class="history-date-value">${dateStr}</span>
                </div>
            </div>
            <div class="history-data-grid">
                <div class="data-cell data-peso"><span class="data-label">Peso</span><span class="data-value">${peso}</span></div>
                <div class="data-cell data-imc"><span class="data-label">IMC</span><span class="data-value">${imc}</span></div>
                <div class="data-cell data-presion"><span class="data-label">Presión</span><span class="data-value">${item.data.taSistolica || '--'}/${item.data.taDiastolica || '--'}</span></div>
                <div class="data-cell data-glucosa"><span class="data-label">Glucosa</span><span class="data-value">${item.data.glucometria || '--'}</span></div>
            </div>`;
        card.onclick = () => loadRecordForEdit(item);
        grid.appendChild(card);
    });

    const newCard = document.createElement('div');
    newCard.className = 'new-record-card';
    newCard.onclick = () => startNewRecord(latest.data);
    newCard.innerHTML = `<div class="new-record-icon">+</div><div class="new-record-text">Realizar Nuevo Registro</div>`;
    grid.appendChild(newCard);

    container.appendChild(grid);

    // Reports Section
    const reportsSection = document.createElement('div');
    reportsSection.style.marginTop = '3rem';
    reportsSection.innerHTML = `
        <h3 style="font-size:1.1rem; color:#1e293b; font-weight:600; margin-bottom:1rem;">Reportes Disponibles</h3>
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">
            <button type="button" onclick="openPDFModal()" class="pdf-btn">
                <span style="font-size:1.5rem;">📄</span>
                <div><span style="display:block; font-weight:600;">Expediente Completo</span><span style="display:block; font-size:0.8rem; color:#64748b;">Descargar PDF</span></div>
            </button>
        </div>`; // Simplified
    container.appendChild(reportsSection);
}

// Helper to set date inputs safely
function setDateValue(id, val) {
    const el = document.getElementById(id);
    if (!el || !val || val === 'N/A' || val === 'Sin datos') return;
    try {
        let d;
        if (typeof val === 'string' && val.includes('/') && val.length === 10) {
            const parts = val.split('/');
            d = new Date(parts[2], parts[1] - 1, parts[0]);
        } else {
            d = new Date(val);
        }
        if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            el.value = `${y}-${m}-${day}`;
        }
    } catch (e) {
        console.error("Date error:", e);
    }
}

function startNewRecord(preFillData = null) {
    if (!form) return;
    form.reset();
    currentAction = 'save';
    currentRowIndex = null;

    programasSelected.clear();
    renderProgramaTags();
    patologiasSelected.clear();
    renderPatologiasTags();
    document.getElementById('patologiasOtros').style.display = 'none';

    const habitosContainer = document.getElementById('habitosDetailsContainer');
    if (habitosContainer) habitosContainer.innerHTML = '';

    // Reset Tabs
    openTab({ currentTarget: document.createElement('div') }, 'tabQuimicos'); // Dummy event
    document.querySelectorAll('.tab-link').forEach(el => el.classList.remove('active'));

    ['area', 'puesto', 'turno', 'estadoCivil', 'supervisor', 'restriccionesContainer'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // Reset AHF/Vacunas checkboxes
    document.querySelectorAll('input[name^="ahf_"], input[name^="vacuna_"]').forEach(cb => cb.checked = false);

    // Reset Step 6 (Restricted Activities)
    document.querySelectorAll('input[name="restr_lista"], input[name="restr_tipo"]').forEach(cb => cb.checked = false);
    const btnAlta = document.getElementById('btnAlta');
    if (btnAlta) {
        document.getElementById('restr_alta').value = 'NO';
        btnAlta.textContent = 'ALTA OFF';
        btnAlta.style.background = '#f1f5f9';
        btnAlta.style.color = '64748b';
        btnAlta.style.border = '1px solid #cbd5e1';
    }

    if (preFillData) {
        document.getElementById('num').value = preFillData.num || currentSearchId || '';
        if (preFillData.nombre) document.getElementById('nombre').value = preFillData.nombre;
        setSelectOrManual('genero', null, preFillData.genero, null);
        if (preFillData.edad) document.getElementById('edad').value = preFillData.edad;
        if (preFillData.contacto) document.getElementById('contacto').value = preFillData.contacto;
        if (preFillData.lugarNacimiento) document.getElementById('lugarNacimiento').value = preFillData.lugarNacimiento;

        setSelectOrManual('escolaridad', null, preFillData.escolaridad, 'Otro');

        // Helper to check select - REPLACED BY GLOBAL setSelectOrManual

        setSelectOrManual('estadoCivilSelect', 'estadoCivil', preFillData.estadoCivil, 'Otro');
        // setSelectOrManual('escolaridadSelect', 'escolaridad', preFillData.escolaridad, 'Otro'); // Moved up

        setSelectOrManual('planta', null, preFillData.planta, null);
        setSelectOrManual('unidadNegocio', null, preFillData.unidadNegocio, null);

        setDateValue('fechaIngresoEmpresa', preFillData.fechaIngresoEmpresa);
        setDateValue('fechaIngresoPuesto', preFillData.fechaIngresoPuesto);

        document.getElementById('funcionesPuesto').value = preFillData.funcionesPuesto || '';

        // Restore seniority: Only use saved value if it's a valid text (not N/A or placeholder)
        const isValidSeniority = (val) => val && val !== 'N/A' && !val.includes('Calculado');

        if (isValidSeniority(preFillData.antiguedadPuesto)) {
            document.getElementById('antiguedadPuesto').value = preFillData.antiguedadPuesto;
        } else {
            calcularAntiguedad();
        }

        if (isValidSeniority(preFillData.antiguedadEmpresa)) {
            document.getElementById('antiguedadEmpresa').value = preFillData.antiguedadEmpresa;
        } else {
            calcularAntiguedadEmpresa();
        }

        setSelectOrManual('supervisorSelect', 'supervisor', preFillData.supervisor, 'Personalizar');
        setSelectOrManual('areaSelect', 'area', preFillData.area, 'Manual');
        setSelectOrManual('puestoSelect', 'puesto', preFillData.puesto, 'Manual');
        setSelectOrManual('turnoSelect', 'turno', preFillData.turno, 'Manual');

        document.getElementById('padecimiento').value = preFillData.padecimiento || '';
    } else {
        if (currentSearchId) document.getElementById('num').value = currentSearchId;
    }
    showStep(1);
}

function loadRecordForEdit(record) {
    startNewRecord(record.data); // Reuse logic for filling
    currentAction = 'update';
    currentRowIndex = record.rowIndex;
    const data = record.data;

    // Restore Array Data
    if (data.programasList) {
        String(data.programasList).split(',').forEach(item => {
            const c = item.trim();
            if (c) {
                programasSelected.add(c);
            }
        });
        renderProgramaTags();
    }

    if (data.patologiasLista) {
        String(data.patologiasLista).split(',').forEach(item => {
            const c = item.trim();
            if (c) {
                patologiasSelected.add(c);
                if (c === 'Otros') {
                    document.getElementById('patologiasOtros').style.display = 'block';
                    document.getElementById('patologiasOtros').value = data.patologiasOtros || '';
                }
            }
        });
        renderPatologiasTags();
    }

    // Restore Medical
    document.getElementById('peso').value = data.peso || '';
    document.getElementById('talla').value = data.talla || '';
    document.getElementById('imc').value = data.imc || '';
    document.getElementById('fat').value = data.fat || '';
    document.getElementById('musc').value = data.musc || '';
    document.getElementById('rmi').value = data.rmi || '';
    document.getElementById('bodyage').value = data.bodyage || '';
    document.getElementById('visc').value = data.visc || '';
    document.getElementById('taSistolica').value = data.taSistolica || '';
    document.getElementById('taDiastolica').value = data.taDiastolica || '';
    document.getElementById('pulso').value = data.pulso || '';
    document.getElementById('oximetria').value = data.oximetria || '';
    document.getElementById('glucometria').value = data.glucometria || '';
    document.getElementById('temperatura').value = data.temperatura || '';
    if (data.habito_Medicamentos_Cantidad) document.getElementById('habito_Medicamentos_Cantidad').value = data.habito_Medicamentos_Cantidad;
    if (data.habito_Medicamentos_Frecuencia) document.getElementById('habito_Medicamentos_Frecuencia').value = data.habito_Medicamentos_Frecuencia;

    // --- Hydrate Step 6 (Restricted Activities) ---
    if (data.restr_enfermedad_general) document.getElementById('restr_enfermedad_general').value = data.restr_enfermedad_general;
    setSelectOrManual('restr_riesgo_trabajo', null, data.restr_riesgo_trabajo, null);

    if (data.restr_tipo) {
        const radio = document.querySelector(`input[name="restr_tipo"][value="${data.restr_tipo}"]`);
        if (radio) radio.checked = true;
    }

    if (data.restr_alta === 'SI') {
        document.getElementById('restr_alta').value = 'SI';
        const btnAlta = document.getElementById('btnAlta');
        btnAlta.textContent = 'ALTA ON';
        btnAlta.style.background = '#10b981';
        btnAlta.style.color = 'white';
        btnAlta.style.border = '1px solid #059669';
    }

    if (data.restr_fecha_inicio) document.getElementById('restr_fecha_inicio').value = data.restr_fecha_inicio;
    if (data.restr_fecha_termino) document.getElementById('restr_fecha_termino').value = data.restr_fecha_termino;
    if (data.restr_motivo) document.getElementById('restr_motivo').value = data.restr_motivo;
    if (data.restr_region_afectada) document.getElementById('restr_region_afectada').value = data.restr_region_afectada;
    if (data.restr_otros) document.getElementById('restr_otros').value = data.restr_otros;

    if (data.restr_lista) {
        const restrItems = data.restr_lista.split(', ');
        restrItems.forEach(item => {
            const cb = document.querySelector(`input[name="restr_lista"][value="${item}"]`);
            if (cb) cb.checked = true;
        });
    }
    // ----------------------------------------------
    document.getElementById('agudezaVisual').value = data.agudezaVisual || '';
    document.getElementById('agudezaAuditiva').value = data.agudezaAuditiva || '';

    // Restore AHF / Vacunas
    const ahfFields = ['ahf_diabetes', 'ahf_hipertension', 'ahf_cancer', 'ahf_cardiopatias'];
    ['ahf_diabetes', 'ahf_hipertension', 'ahf_cancer', 'ahf_cardiopatias', 'vacuna_tetanos', 'vacuna_influenza', 'vacuna_hepatitis'].forEach(id => {
        const el = document.querySelector(`input[name="${id}"]`);
        if (el) {
            const wasChecked = (data[id] === 'SI' || data[id] === 'on' || data[id] === true);
            el.checked = wasChecked;
            // Si es un AHF y está marcado, disparar toggleAHF para crear el input
            if (id.startsWith('ahf_') && id !== 'ahf_otros' && wasChecked) {
                toggleAHF(el);
                // Rellenar el detalle si existe
                const detalleId = id + '_detalle';
                const detalleInput = document.getElementById(detalleId);
                if (detalleInput && data[detalleId]) {
                    detalleInput.value = data[detalleId];
                }
            }
        }
    });
    document.getElementById('ahf_otros').value = data.ahf_otros || '';
    document.getElementById('alergia_medicamentos').value = data.alergia_medicamentos || '';

    // Restore Aptitud
    const aptSelect = document.getElementById('aptitud_medica');
    if (aptSelect) {
        aptSelect.value = data.aptitud_medica || 'Apto';
        toggleRestricciones(aptSelect);
    }
    document.getElementById('aptitud_restricciones').value = data.aptitud_restricciones || '';
    setDateValue('seguimiento_fecha', data.seguimiento_fecha);

    if (data.antecedentes) document.getElementById('antecedentes').value = data.antecedentes;
    document.getElementById('musc').value = data.musc || '';
    document.getElementById('visc').value = data.visc || '';
    document.getElementById('bodyage').value = data.bodyage || '';
    document.getElementById('rmi').value = data.rmi || '';
    document.getElementById('taSistolica').value = data.taSistolica || '';
    document.getElementById('taDiastolica').value = data.taDiastolica || '';
    document.getElementById('pulso').value = data.pulso || '';
    document.getElementById('oximetria').value = data.oximetria || '';
    document.getElementById('glucometria').value = data.glucometria || '';
    document.getElementById('temperatura').value = data.temperatura || '';
    document.getElementById('notas').value = data.notas || '';

    // Restore Padecimiento Select
    const pSelect = document.getElementById('padecimientoSelect');
    if (pSelect && data.padecimiento) {
        let found = false;
        for (let i = 0; i < pSelect.options.length; i++) {
            if (pSelect.options[i].value === data.padecimiento) {
                pSelect.selectedIndex = i;
                found = true;
                break;
            }
        }
        if (!found) {
            pSelect.value = 'Otros';
            document.getElementById('padecimiento').style.display = 'block';
        }
    }

    // Restore Checkboxes
    const restoreCheckboxes = (listStr, containerId) => {
        if (!listStr) return;
        const container = document.getElementById(containerId);
        if (!container) return;
        container.querySelectorAll('input[type="checkbox"]').forEach(inp => {
            if (String(listStr).includes(inp.value)) {
                inp.checked = true;
            }
        });
    };
    restoreCheckboxes(data.riesgosQuimicos, 'tabQuimicos');
    restoreCheckboxes(data.riesgosFisicos, 'tabFisicos');
    restoreCheckboxes(data.riesgosErgonomicos, 'tabErgonomicos');
    restoreCheckboxes(data.riesgosMetabolicos, 'tabMetabolicos');
    restoreCheckboxes(data.riesgosBiologicos, 'tabBiologicos');

    showStep(1);
}

// Additional Modal Functions
function openAvisoModal() { document.getElementById('avisoPrivacidadModal').style.display = 'flex'; }
function closeAvisoModal() { document.getElementById('avisoPrivacidadModal').style.display = 'none'; }
function openReferenciasModal() { document.getElementById('referenciasModal').style.display = 'flex'; }
function closeReferenciasModal() { document.getElementById('referenciasModal').style.display = 'none'; }

// ============================================
// NUEVAS FUNCIONES: FORMULARIO MÉDICO V6
// ============================================

// 1. Toggle Gineco
function toggleGinecoFields() {
    const genero = document.getElementById('genero').value;
    const container = document.getElementById('antecedentesGinecoContainer');
    const inputs = container.querySelectorAll('input, select');

    if (genero === 'Femenino') {
        container.style.display = 'block';
        container.style.opacity = '1';
        inputs.forEach(input => input.disabled = false);
    } else {
        // No es Femenino -> Ocultar completamente
        container.style.display = 'none';
        inputs.forEach(input => {
            input.disabled = true;
            input.value = ''; // Limpiar
        });
    }
}

// 1.25 Toggle AHF Details (Dinámico)
function toggleAHF(checkbox) {
    const container = document.getElementById('ahfDetailsContainer');
    const type = checkbox.name.replace('ahf_', ''); // diabetes, hipertension, cancer, cardiopatias
    const idBase = 'ahf_' + type + '_detalle';

    if (checkbox.checked) {
        // Crear input de detalle
        const div = document.createElement('div');
        div.id = idBase + '_wrapper';
        div.className = 'grid-2';
        div.style.marginTop = '0.5rem';
        div.style.padding = '0.5rem';
        div.style.backgroundColor = '#f0fdf4';
        div.style.borderRadius = '8px';
        div.style.border = '1px solid #bbf7d0';

        const labelText = checkbox.value; // Diabetes, Hipertension, etc.
        div.innerHTML = `
            <div class="form-group full-width">
                <label style="font-weight:600; color:#166534;">Detalle de ${labelText}:</label>
                <input type="text" id="${idBase}" name="${idBase}" placeholder="Ej: Padre, Madre, Abuelos..." style="margin-top: 0.25rem;">
            </div>
        `;
        container.appendChild(div);
    } else {
        // Remover input de detalle
        const existing = document.getElementById(idBase + '_wrapper');
        if (existing) existing.remove();
    }
}

// 1.5 Toggle Restricciones
function toggleRestricciones(select) {
    const container = document.getElementById('restriccionesContainer');
    if (!container) return;
    if (select.value === 'Apto con Restricciones' || select.value === 'No Apto') {
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
        const txt = container.querySelector('textarea');
        if (txt) txt.value = '';
    }
}

// 2. Dynamic Exploracion
function addExploracionItem() {
    const select = document.getElementById('exploracionSelect');
    const val = select.value;
    if (!val) return;

    const list = document.getElementById('exploracionList');
    // Check duplicates
    if (document.getElementById(`row_exp_${val}`)) {
        alert("Ya agregaste ese elemento.");
        return;
    }

    const key = 'exploracion_' + val.toLowerCase().replace(/ /g, '_').replace(/\./g, '');

    const div = document.createElement('div');
    div.id = `row_exp_${val}`;
    div.style.cssText = "display: flex; gap: 0.5rem; align-items: center; background: white; padding: 0.5rem; border-radius: 6px; border: 1px solid #e2e8f0;";
    div.innerHTML = `
        <strong style="min-width: 140px; color: #334155;">${val}:</strong>
        <input type="text" name="${key}" placeholder="Observación..." required style="flex-grow: 1; padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px;">
        <button type="button" onclick="this.parentElement.remove()" style="color: #ef4444; background: none; border: none; cursor: pointer; font-weight: bold; font-size: 1.2rem;">&times;</button>
    `;
    list.appendChild(div);
    select.value = "";
}

// 3. Dynamic Evaluacion
function addEvaluacionItem() {
    const select = document.getElementById('evaluacionSelect');
    const val = select.value;
    if (!val) return;

    const list = document.getElementById('evaluacionList');
    if (document.getElementById(`row_eval_${val}`)) {
        alert("Ya agregaste ese elemento.");
        return;
    }

    const key = 'eval_' + val.toLowerCase().replace(/ /g, '_').replace(/\./g, '');

    const div = document.createElement('div');
    div.id = `row_eval_${val}`;
    div.style.cssText = "display: flex; gap: 0.5rem; align-items: center; background: white; padding: 0.5rem; border-radius: 6px; border: 1px solid #e2e8f0;";
    div.innerHTML = `
        <strong style="min-width: 140px; color: #334155;">${val}:</strong>
        <input type="text" name="${key}" placeholder="Observación..." required style="flex-grow: 1; padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px;">
        <button type="button" onclick="this.parentElement.remove()" style="color: #ef4444; background: none; border: none; cursor: pointer; font-weight: bold; font-size: 1.2rem;">&times;</button>
    `;
    list.appendChild(div);
    select.value = "";
}

// Inicializar estado al cargar
document.addEventListener('DOMContentLoaded', () => {
    // Si ya hay género seleccionado (ej. edición), validar estado inicial
    const genero = document.getElementById('genero');
    if (genero && genero.value) toggleGinecoFields();
});


// Dashboard Update Logic (F5 Behavior with Persistence)
function triggerDashboardUpdate() {
    sessionStorage.setItem('openDashboardOnLoad', 'true');
    window.location.reload();
}
