// --- AUTH SYSTEM LOGIC ---

/**
 * Toggles the visibility of a password input field
 * @param {string} inputId - ID of the input field
 * @param {HTMLElement} btn - The button that triggered the toggle
 */
function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    const svg = btn.querySelector('svg');

    if (input.type === 'password') {
        input.type = 'text';
        btn.title = 'Ocultar contraseña';
        // Change icon to eye-off
        svg.innerHTML = `
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 1.225 0 2.37.221 3.425.625m4.34 4.34A10.038 10.038 0 0121.542 12c-1.274 4.057-5.064 7-9.542 7-1.225 0-2.37-.221-3.425-.625m10.156-10.156L3 3m18 18L3 3" />
        `;
    } else {
        input.type = 'password';
        btn.title = 'Ver contraseña';
        // Change icon to eye
        svg.innerHTML = `
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        `;
    }
}

// 1. SHA-256 Helper (Client Side)
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// 2. Handle Login Submit
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

            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const storage = isMobile ? localStorage : sessionStorage;

            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'login', user: user, passHash: passHash }),
                headers: { "Content-Type": "text/plain;charset=utf-8" }
            });

            const result = await response.json();

            if (result.success) {
                // BLOCK SUPERVISORS FROM THE MAIN APP (Case-insensitive check)
                const role = (result.role || '').trim().toLowerCase();
                if (role === 'supervisor') {
                    throw new Error("Acceso Denegado: Esta cuenta solo está autorizada para el Portal de Supervisores.");
                }

                storage.setItem('sessionToken', result.token);
                storage.setItem('currentUser', user);

                // Show the liquid loader overlay
                const loaderOverlay = document.getElementById('dashboardLoaderOverlay');
                if (loaderOverlay) {
                    loaderOverlay.style.display = 'flex';
                }

                // Hide the login overlay
                document.getElementById('loginOverlay').style.display = 'none';

                // After 2.5 seconds, hide the loader
                setTimeout(() => {
                    if (loaderOverlay) {
                        loaderOverlay.style.display = 'none';
                    }
                }, 2500);

                // Check if default password (12345) OR Temporary (CDC-...) -> Prompt Change
                // Hash of 12345 ends in 'fc5'
                if (passHash === '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5' || pass.startsWith('CDC-')) {
                    document.getElementById('changePasswordModal').style.display = 'flex';
                }

            } else {
                throw new Error(result.error || "Credenciales inválidas");
            }

        } catch (err) {
            loginError.textContent = err.message;
            loginError.style.display = 'block';
            // Shake Effect
            const input = document.getElementById('loginPass');
            input.classList.add('error-shake');
            setTimeout(() => input.classList.remove('error-shake'), 500);
        } finally {
            loginBtn.textContent = 'Ingresar Sistema';
            loginBtn.disabled = false;
        }
    };
}

// 3. Reset Password Logic
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

// 4. Change Password Logic
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

// Protected Access Logic (Admin Password)
function openRegistrosProtected(e) {
    e.preventDefault();
    const modal = document.getElementById('passwordModal');
    const input = document.getElementById('adminPassword');
    modal.style.display = 'flex';
    input.value = '';
    setTimeout(() => input.focus(), 100); // Focus after render
}

function closePasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
}

function confirmPassword() {
    const input = document.getElementById('adminPassword');
    const pass = input.value;

    if (pass === "9090") {
        closePasswordModal();
        window.open("https://docs.google.com/spreadsheets/d/1I9KkIWTUfzpHqzK0XvP930DA9DEQfGb0VjEj_0i_Th0/edit?gid=1109282972#gid=1109282972", "_blank");
    } else {
        input.style.borderColor = '#ef4444';
        input.classList.add('error-shake');
        setTimeout(() => {
            input.style.borderColor = ''; // Reset
            input.classList.remove('error-shake');
        }, 500);
    }
}

// Logout Function
function logout() {
    if (confirm("¿Seguro que deseas cerrar sesión?")) {
        sessionStorage.clear();
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('hunter_draft'); // Clear persistence draft on intentional logout
        window.location.reload();
    }
}

// 5. Session Persistence Check
function checkSession() {
    const token = sessionStorage.getItem('sessionToken') || localStorage.getItem('sessionToken');
    if (token) {
        document.getElementById('loginOverlay').style.display = 'none';
        console.log("✅ Sesión restaurada.");
    }
}

// Check on load
window.addEventListener('DOMContentLoaded', checkSession);
