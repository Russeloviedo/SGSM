/**
 * supervisores.js — Portal de Supervisores (SGSM Hunter)
 * Conecta el teclado numérico con el backend GAS para
 * obtener los datos de restricciones del empleado.
 */

// Estado del PIN / Número de empleado
let currentPin = '';

// --- TECLADO NUMÉRICO ---

function pressKey(num) {
    if (currentPin.length < 10) {
        currentPin += num;
        updateDisplay();
    }
}

function backspace() {
    currentPin = currentPin.slice(0, -1);
    updateDisplay();
}

function clearAll() {
    currentPin = '';
    updateDisplay();
}

function updateDisplay() {
    const display = document.getElementById('pinDisplay');
    display.innerText = currentPin;

    const btn = document.getElementById('btnConsult');
    btn.disabled = currentPin.length === 0;
}

// --- BÚSQUEDA REAL ---

async function handleSearch() {
    if (currentPin.length === 0) return;

    const loadingMsg = document.getElementById('loadingMsg');
    const btnConsult = document.getElementById('btnConsult');
    loadingMsg.style.display = 'block';
    btnConsult.disabled = true;

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'supervisorSearch',
                token: sessionStorage.getItem('sessionToken') || localStorage.getItem('sessionToken'),
                id: currentPin
            })
        });

        const result = await response.json();

        if (!result.success) {
            alert('Error al consultar: ' + (result.error || 'Error desconocido'));
            loadingMsg.style.display = 'none';
            btnConsult.disabled = false;
            return;
        }

        if (!result.found) {
            showEmployeeErrorModal(currentPin);
            loadingMsg.style.display = 'none';
            btnConsult.disabled = false;
            return;
        }

        // Datos encontrados — poblar la credencial
        populateCard(result.record);

        // Cambiar vista
        loadingMsg.style.display = 'none';
        document.getElementById('viewSearch').style.display = 'none';
        document.getElementById('viewID').style.display = 'block';

        // Re-init lucide icons (para los nuevos elementos)
        if (typeof lucide !== 'undefined') lucide.createIcons();

    } catch (err) {
        alert('Error de conexión con el servidor. Intente de nuevo.\n' + err.message);
        loadingMsg.style.display = 'none';
        btnConsult.disabled = false;
    }
}

// --- POBLAR TARJETA ---

function populateCard(record) {
    // === FRENTE (Identidad) ===
    const nombreCompleto = record.nombre || 'Sin Nombre';
    const partes = nombreCompleto.split(' ');

    // Intentar separar nombre y apellido inteligentemente
    let firstName, lastName;
    if (partes.length <= 2) {
        firstName = partes[0] || '';
        lastName = partes.slice(1).join(' ') || '';
    } else {
        // Nombres compuestos: primeras 2 palabras = nombre, resto = apellido
        firstName = partes.slice(0, 2).join(' ');
        lastName = partes.slice(2).join(' ');
    }

    document.getElementById('dispNameFirst').innerText = firstName;
    document.getElementById('dispNameLast').innerText = lastName;
    document.getElementById('dispIdLarge').innerText = record.num || currentPin;
    document.getElementById('dispBarcode').innerText = 'ID-' + (record.num || currentPin);

    // Supervisor y Unidad de Negocio
    document.getElementById('dispSupervisor').innerText = record.supervisor || 'No asignado';
    document.getElementById('dispUnidad').innerText = record.unidad_negocio || 'No especificada';
    lucide.createIcons(); // Re-render icons for the new elements

    // === REVERSO (Restricciones) ===
    const hasRestrictions = (record.lista_restricciones || '').trim().length > 0 || (record.otras_restricciones || '').trim().length > 0;

    // Motivo
    document.getElementById('dispMotiv').innerText = record.motivo || (hasRestrictions ? 'No especificado' : 'Ninguno');

    // Región Afectada
    document.getElementById('dispReg').innerText = record.region_afectada || (hasRestrictions ? 'No especificado' : 'Ninguna');

    // Tipo de Restricción
    const tipoEl = document.getElementById('dispType');
    const tipo = record.tipo_restriccion || (hasRestrictions ? 'N/A' : 'Sin restricción');
    tipoEl.innerText = tipo;
    tipoEl.style.fontWeight = '700';

    // Vigencia (Fechas)
    const fechaTermino = formatDate(record.fecha_termino);

    if (fechaTermino) {
        document.getElementById('dispFecha').innerText = fechaTermino;
    } else if (tipo.toLowerCase().includes('permanent')) {
        document.getElementById('dispFecha').innerText = 'Indefinido';
    } else {
        document.getElementById('dispFecha').innerText = hasRestrictions ? 'Sin fecha' : 'Vigencia Normal';
    }

    // Estado de Alta
    const statusEl = document.getElementById('highStatus');
    const altaValue = (record.alta || '').toUpperCase().trim();

    if (altaValue === 'SI' || altaValue === 'SÍ' || altaValue === 'YES') {
        statusEl.innerText = 'ALTA MÉDICA';
        statusEl.style.background = '#dcfce7'; // Verde claro
        statusEl.style.color = '#16a34a'; // Verde oscuro
    } else if (!hasRestrictions) {
        statusEl.innerText = 'SIN RESTRICCIONES';
        statusEl.style.background = '#e0f2fe'; // Azul claro
        statusEl.style.color = '#0369a1'; // Azul oscuro
    } else {
        statusEl.innerText = 'RESTRICCIÓN ACTIVA';
        statusEl.style.background = '#fee2e2'; // Rojo claro
        statusEl.style.color = '#dc2626'; // Rojo oscuro
    }

    // Lista de Actividades Restringidas
    const listEl = document.getElementById('restrList');
    listEl.innerHTML = '';

    const listaRaw = record.lista_restricciones || '';
    const otrasRaw = record.otras_restricciones || '';

    // La lista viene separada por comas o saltos de línea
    let actividades = [];

    if (listaRaw) {
        actividades = listaRaw.split(/[,\n]+/).map(s => s.trim()).filter(s => s.length > 0);
    }

    if (otrasRaw && otrasRaw.trim()) {
        actividades.push(otrasRaw.trim());
    }

    if (actividades.length > 0) {
        actividades.forEach(act => {
            const li = document.createElement('li');
            li.innerHTML = '<div class="dot"></div> ' + escapeHtml(act);
            listEl.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.innerHTML = '<div class="dot"></div> Sin restricciones registradas';
        listEl.appendChild(li);
    }

    // --- ALERTA: REVISIÓN MÉDICA ---
    const alertRevisionEl = document.getElementById('dispAlertRevision');
    if (alertRevisionEl) {
        alertRevisionEl.style.display = 'none'; // Ocultar por defecto

        // Verificar si la restricción sigue ACTIVA (No tiene alta médica explícita)
        const isRestrictedActively = hasRestrictions && (altaValue !== 'SI' && altaValue !== 'SÍ' && altaValue !== 'YES');

        if (isRestrictedActively && record.fecha_termino) {
            const termDate = new Date(record.fecha_termino);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Ignorar la hora, comparar solo el día

            // Si la fecha de término ya pasó (ayer o antes)
            if (!isNaN(termDate.getTime()) && termDate < today) {
                alertRevisionEl.style.display = 'block';
            }
        }
    }
}

// --- UTILIDADES ---

function formatDate(dateVal) {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal); // Si no es fecha válida, mostrar el texto crudo
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return day + '/' + month + '/' + year;
}

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// --- RESET ---

function reset() {
    document.getElementById('viewID').style.display = 'none';
    document.getElementById('viewSearch').style.display = 'block';
    clearAll();
    document.getElementById('flipCard').classList.remove('is-flipped');
}

// --- AUTH SYSTEM LOGIC ---

function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    const svg = btn.querySelector('svg') || btn.querySelector('i'); // Support for lucide via i tag

    if (input.type === 'password') {
        input.type = 'text';
        btn.title = 'Ocultar contraseña';
        if (svg.tagName.toLowerCase() === 'i') {
            svg.setAttribute('data-lucide', 'eye-off');
            lucide.createIcons();
        }
    } else {
        input.type = 'password';
        btn.title = 'Ver contraseña';
        if (svg.tagName.toLowerCase() === 'i') {
            svg.setAttribute('data-lucide', 'eye');
            lucide.createIcons();
        }
    }
}

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

const loginForm = document.getElementById('customLoginForm');
const loginBtn = document.getElementById('loginSubmitBtn');
const loginError = document.getElementById('loginError');

if (loginForm) {
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const user = document.getElementById('loginUser').value.trim();
        const pass = document.getElementById('loginPass').value.trim();

        if (!user || !pass) return;

        loginBtn.textContent = 'Verificando...';
        loginBtn.disabled = true;
        loginError.style.display = 'none';

        try {
            const passHash = await sha256(pass);

            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'login', user: user, passHash: passHash }),
                headers: { "Content-Type": "text/plain;charset=utf-8" }
            });

            const result = await response.json();

            if (result.success) {
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                const storage = isMobile ? localStorage : sessionStorage;

                storage.setItem('sessionToken', result.token);
                storage.setItem('currentUser', user);

                document.getElementById('loginOverlay').style.display = 'none';

                // UNCOVER THE PLATFORM SECURELY
                document.getElementById('mainPlatformScene').style.display = 'block';
                document.getElementById('topNavControls').style.display = 'flex';

                if (passHash === '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5' || pass.startsWith('CDC-')) {
                    document.getElementById('changePasswordModal').style.display = 'flex';
                }

            } else {
                throw new Error(result.error || "Credenciales inválidas");
            }

        } catch (err) {
            loginError.textContent = err.message;
            loginError.style.display = 'block';
        } finally {
            loginBtn.textContent = 'Autorizar Acceso';
            loginBtn.disabled = false;
        }
    };
}

function openResetPasswordModal(e) {
    if (e) e.preventDefault();
    document.getElementById('resetPasswordModal').style.display = 'flex';
}

function closeResetPasswordModal() {
    document.getElementById('resetPasswordModal').style.display = 'none';
    document.getElementById('resetMsg').textContent = '';
}

async function handleResetPassword() {
    const input = document.getElementById('resetInput').value.trim();
    const btn = document.getElementById('btnResetSend');
    const msg = document.getElementById('resetMsg');

    if (!input) return;

    btn.disabled = true;
    btn.textContent = 'Enviando...';
    msg.textContent = '';

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'resetPassword', userOrEmail: input }),
            headers: { "Content-Type": "text/plain;charset=utf-8" }
        });
        const result = await response.json();

        if (result.success) {
            msg.style.color = '#10b981';
            msg.textContent = result.message;
        } else {
            msg.style.color = '#ef4444';
            msg.textContent = result.error || "Error al procesar solicitud.";
        }
    } catch (e) {
        msg.style.color = '#ef4444';
        msg.textContent = "Error de conexión.";
    } finally {
        btn.disabled = false;
        btn.textContent = 'Enviar Correo';
    }
}

async function handleChangePassword() {
    const oldPass = document.getElementById('chgOldPass').value.trim();
    const new1 = document.getElementById('chgNewPass1').value.trim();
    const new2 = document.getElementById('chgNewPass2').value.trim();
    const msg = document.getElementById('chgMsg');
    const btn = document.getElementById('btnChangePass');
    const storage = sessionStorage.getItem('sessionToken') ? sessionStorage : localStorage;
    const user = storage.getItem('currentUser');

    if (!oldPass || !new1 || !new2) {
        msg.textContent = "Todos los campos son obligatorios.";
        return;
    }

    if (new1 !== new2) {
        msg.textContent = "Las nuevas contraseñas no coinciden.";
        return;
    }

    if (new1.length < 5) {
        msg.textContent = "La contraseña debe tener al menos 5 caracteres.";
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Actualizando...';

    try {
        const oldHash = await sha256(oldPass);
        const newHash = await sha256(new1);

        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'changePassword', user: user, oldHash: oldHash, newHash: newHash }),
            headers: { "Content-Type": "text/plain;charset=utf-8" }
        });

        const result = await response.json();

        if (result.success) {
            alert("Contraseña actualizada con éxito. Por favor inicia sesión de nuevo.");
            sessionStorage.clear();
            location.reload();
        } else {
            msg.textContent = result.error || "Error al actualizar.";
        }

    } catch (e) {
        msg.textContent = "Error de conexión.";
    } finally {
        btn.disabled = false;
        btn.textContent = 'Actualizar Contraseña';
    }
}

function logout() {
    if (confirm("¿Seguro que deseas cerrar sesión?")) {
        sessionStorage.clear();
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('currentUser');
        window.location.reload();
    }
}

// --- ERROR MODAL LOGIC ---

function showEmployeeErrorModal(id) {
    const modal = document.getElementById('errorModal');
    const text = document.getElementById('errorModalText');
    if (modal && text) {
        text.innerText = `El empleado ${id} no se encuentra en la base de datos.`;
        modal.style.display = 'flex';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

function closeErrorModal() {
    const modal = document.getElementById('errorModal');
    if (modal) modal.style.display = 'none';
    clearAll();
}

function checkSession() {
    const token = sessionStorage.getItem('sessionToken') || localStorage.getItem('sessionToken');
    if (token) {
        document.getElementById('loginOverlay').style.display = 'none';
        // UNCOVER THE PLATFORM SECURELY
        document.getElementById('mainPlatformScene').style.display = 'block';
        document.getElementById('topNavControls').style.display = 'flex';
        console.log("✅ Sesión restaurada.");
    }
}

window.addEventListener('DOMContentLoaded', checkSession);
