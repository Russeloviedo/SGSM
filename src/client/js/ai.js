// --- AI ASSISTANT FUNCTIONS ---

function triggerAiSuggestion() {
    const modal = document.getElementById('aiSuggestionModal');
    const loading = document.getElementById('aiLoading');
    const result = document.getElementById('aiResult');
    const textarea = document.getElementById('aiSuggestionText');

    modal.style.display = 'flex';
    loading.style.display = 'block';
    result.style.display = 'none';

    // Gather Data from DOM
    const formData = {
        edad: document.getElementById('edad').value,
        genero: document.getElementById('genero').value,
        imc: document.getElementById('imc').value,
        glucometria: document.getElementById('glucometria').value,
        taSistolica: document.getElementById('taSistolica').value,
        taDiastolica: document.getElementById('taDiastolica').value,
        fat: document.getElementById('fat').value,
        musc: document.getElementById('musc').value,
        visc: document.getElementById('visc').value,
        riesgosQuimicos: document.getElementById('riesgosQuimicos') ? (document.getElementById('riesgosQuimicos').checked ? "Sí" : "") : ""
    };

    // Call Backend via FETCH (since we are not in Apps Script context)
    const payload = {
        action: 'getAiSuggestion',
        token: sessionStorage.getItem('authToken') || "temp-token-" + Date.now(), // Fallback ensuring token exists
        ...formData
    };

    fetch(CONFIG.API_URL, {
        method: 'POST',
        mode: 'cors', // Important for cross-origin
        body: JSON.stringify(payload)
    })
        .then(response => response.json())
        .then(data => {
            loading.style.display = 'none';
            result.style.display = 'block';

            // Logic: data is the result. If string, it's the text. If object with error, show error.
            if (data && typeof data === 'string') {
                textarea.value = data;
            } else if (data && data.error) {
                textarea.value = "Error del Servidor: " + data.error;
            } else {
                // Fallback
                textarea.value = JSON.stringify(data);
            }
        })
        .catch(err => {
            loading.style.display = 'none';
            result.style.display = 'block';
            textarea.value = "Error de conexión (Posible bloqueo CORS o Red): " + err.message;
        });
}

function closeAiSuggestion() {
    document.getElementById('aiSuggestionModal').style.display = 'none';
}

function useAiSuggestion() {
    const aiText = document.getElementById('aiSuggestionText').value;
    const mainNotes = document.getElementById('notas');

    if (mainNotes.value) {
        mainNotes.value += "\n\n" + aiText; // Append if exists
    } else {
        mainNotes.value = aiText;
    }
    // Auto-resize textarea logic if exists, otherwise just set value
    closeAiSuggestion();
}
