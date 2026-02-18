/**
 * --- GOOGLE APPS SCRIPT: BACKEND V6 (DYNAMIC ENGINE) ---
 * Motor Dinámico de Mapeo de Columnas.
 * Se adapta automáticamente al orden de columnas en el Excel.
 * Crea columnas faltantes si es necesario.
 */

// 🗺️ MAPEO DE CAMPOS (Clave Frontend -> Nombre Columna Excel)
// Si cambias el nombre en el Excel, actualízalo aquí.
const FIELD_MAP = {
  // Metadatos
  'timestamp': 'Fecha Registro',
  
  // Datos Personales
  'programasList': 'Programas',
  'num': 'Núm',
  'nombre': 'Nombre',
  'genero': 'Género',
  'edad': 'Edad',
  'contacto': 'Contacto',
  'lugarNacimiento': 'Lugar Nacimiento',
  'estadoCivil': 'Estado Civil',
  'escolaridad': 'Escolaridad',
  
  // Trabajo
  'supervisor': 'Supervisor',
  'planta': 'Planta',
  'area': 'Área',
  'puesto': 'Puesto',
  'turno': 'Turno',
  'unidadNegocio': 'Unidad de Negocio',
  'fechaIngresoPuesto': 'Fecha Ingreso Puesto',
  'antiguedadPuesto': 'Antigüedad Puesto',
  'fechaIngresoEmpresa': 'Fecha Ingreso Empresa',
  'antiguedadEmpresa': 'Antigüedad Empresa',
  'funcionesPuesto': 'Funciones Puesto',

  // Biometría
  'peso': 'Peso',
  'talla': 'Talla',
  'imc': 'IMC',
  'fat': '% FAT',
  'musc': '% MUSC',
  'rmi': 'RMI',
  'bodyage': 'Body Age',
  'visc': 'Grasa Visceral',
  'taSistolica': 'TA Sistólica',
  'taDiastolica': 'TA Diastólica',
  'pulso': 'Pulso',
  'oximetria': 'Oximetría',
  'glucometria': 'Glucometría',
  'temperatura': 'Temperatura',
  'agudezaVisual': 'Agudeza Visual',
  'agudezaAuditiva': 'Agudeza Auditiva',
  'padecimiento': 'Padecimiento',
  'antecedentes': 'Antecedentes',

  // Hábitos, Vacunas y AHF
  'habitosLista': 'Lista Habitos',
  'vacuna_tetanos': 'Vacuna Tétanos',
  'vacuna_influenza': 'Vacuna Influenza',
  'vacuna_hepatitis': 'Vacuna Hepatitis',
  'alergia_medicamentos': 'Alergias Medicamentos',
  'ahf_diabetes': 'AHF Diabetes',
  'ahf_hipertension': 'AHF Hipertensión',
  'ahf_cancer': 'AHF Cáncer',
  'ahf_cardiopatias': 'AHF Cardiopatías',
  'ahf_otros': 'AHF Otros',
  'ahf_diabetes_detalle': 'AHF Diabetes Detalle',
  'ahf_hipertension_detalle': 'AHF Hipertensión Detalle',
  'ahf_cancer_detalle': 'AHF Cáncer Detalle',
  'ahf_cardiopatias_detalle': 'AHF Cardiopatías Detalle',
  
  'habito_Alcohol_Tipo': 'Alcohol Tipo',
  'habito_Alcohol_Cantidad': 'Alcohol Cantidad',
  'habito_Alcohol_Frecuencia': 'Alcohol Frecuencia',
  'habito_Tabaco_Tipo': 'Tabaco Tipo',
  'habito_Tabaco_Cantidad': 'Tabaco Cantidad',
  'habito_Tabaco_Frecuencia': 'Tabaco Frecuencia',
  'habito_Drogas_Tipo': 'Drogas Tipo',
  'habito_Drogas_Cantidad': 'Drogas Cantidad',
  'habito_Drogas_Frecuencia': 'Drogas Frecuencia',
  'habito_Medicamentos_Tipo': 'Medicamentos Tipo',
  'habito_Medicamentos_Cantidad': 'Medicamentos Cantidad',
  'habito_Medicamentos_Frecuencia': 'Medicamentos Frecuencia',

  // Patologías y Riesgos
  'patologiasLista': 'Lista Patologias',
  'patologiasOtros': 'Patologias Otros',
  'riesgosQuimicos': 'Riesgos Quimicos',
  'riesgosFisicos': 'Riesgos Fisicos',
  'riesgosErgonomicos': 'Riesgos Ergonomicos',
  'riesgosMetabolicos': 'Riesgos Metabolicos',
  'riesgosBiologicos': 'Riesgos Biologicos',
  
  // Antecedentes Ginecológicos
  'gineco_menarca': 'Menarca',
  'gineco_fum': 'FUM',
  'gineco_gestas': 'Gestas',
  'gineco_partos': 'Partos',
  'gineco_cesareas': 'Cesáreas',
  'gineco_abortos': 'Abortos',
  'gineco_planificacion': 'Planificación',
  'gineco_papanicolau': 'Papanicolau',
  'gineco_mastografia': 'Mastografía',

  // Evaluación Médica / Exploración (Unified V6.1)
  'eval_craneo': 'Exp. Cráneo',
  'eval_cara': 'Exp. Cara',
  'eval_cuello': 'Exp. Cuello',
  'eval_abdomen': 'Exp. Abdomen',
  'eval_msts': 'Exp. MsTs',
  'eval_msps': 'Exp. MsPs',
  'eval_articulaciones': 'Exp. Articulaciones',
  'eval_columna_vertebral': 'Exp. Columna',
  'eval_reflejos_ot': 'Exp. Reflejos',
  'eval_varices': 'Exp. Várices',
  'eval_tatuajes': 'Exp. Tatuajes',
  'evaluacionData': 'Evaluación Detallada',
  
  // Conclusión y Aptitud
  'aptitud_medica': 'Aptitud Médica',
  'aptitud_restricciones': 'Restricciones Médicas',
  'seguimiento_fecha': 'Fecha Seguimiento',

  // Evaluación Médica (Sistemas)
  'eval_organos_y_sentidos': 'Eval. Órganos',
  'eval_piel': 'Eval. Piel',
  'eval_cabello': 'Eval. Cabello',
  'eval_ojos': 'Eval. Ojos',
  'eval_oidos': 'Eval. Oídos',
  'eval_nariz': 'Eval. Nariz',
  'eval_boca': 'Eval. Boca',
  'eval_faringe': 'Eval. Faringe',
  // 'eval_cuello': 'Eval. Cuello (Med)', // Duplicado manejado por Exp. Cuello arriba
  'eval_aparato_respiratorio': 'Eval. Respiratorio',
  'eval_aparato_cardiovascular': 'Eval. Cardio',
  'eval_aparato_digestivo': 'Eval. Digestivo',
  'eval_aparato_genitourinario': 'Eval. Genitourinario',
  'eval_aparato_locomotor_marcha': 'Eval. Locomotor',
  'eval_columna': 'Eval. Columna (Med)',
  'eval_sistema_linfatico': 'Eval. Linfático',
  'eval_sistema_nervioso': 'Eval. Nervioso',
  
  // Actividades Restringidas (Paso 6)
  'restr_enfermedad_general': 'Enfermedad General',
  'restr_riesgo_trabajo': 'Riesgo Trabajo',
  'restr_tipo': 'Tipo Restricción',
  'restr_alta': 'Alta',
  'restr_fecha_inicio': 'Fecha Inicio Restr.',
  'restr_fecha_termino': 'Fecha Término Restr.',
  'restr_motivo': 'Motivo Restricción',
  'restr_region_afectada': 'Región Afectada',
  'restr_lista': 'Lista Restricciones',
  'restr_otros': 'Otras Restricciones',
  
  // Observaciones y Cierre
  'notas': 'Observaciones'
};

// Configuración de URL
function doGet(e) {
  return ContentService.createTextOutput("✅ Servidor V6 (DINÁMICO) ACTIVO.\n\nEl sistema ahora es capaz de detectar y crear columnas automáticamente.")
      .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const contents = e.postData.contents;
    const data = JSON.parse(contents);
    let result;

    // 🔓 Acciones PÚBLICAS (Sin token - Para QR y acceso externo)
    if (data.action === 'login') {
       setupAuthDatabase();
       result = validateLogin(data.user, data.passHash);
    } else if (data.action === 'changePassword') {
       result = changePassword(data.user, data.oldHash, data.newHash);
    } else if (data.action === 'resetPassword') {
       result = resetPassword(data.userOrEmail);
    } else {
       const token = data.token;
       if (!token) return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Token requerido" })).setMimeType(ContentService.MimeType.JSON);
       
       if (data.action !== 'search' && data.action !== 'getProfile') renewSession(token);

       if (data.action === 'keepAlive') result = { success: true, message: "Session Renewed" };
       else if (data.action === 'getAiSuggestion') result = getAiSuggestion(data);
       else if (data.action === 'getDashboardData') result = getDashboardData();
       else if (data.action === 'updateExcelDashboard') {
          createDashboard();
          result = { success: true, message: "Dashboard Updated" };
       }
       else if (data.action === 'search') result = searchEmployee(data.id);
       else if (data.action === 'getProfile') result = getProfile(data.id);
       else if (data.action === 'save' || data.action === 'update') {
          const lock = LockService.getScriptLock();
          if (lock.tryLock(30000)) {
            try {
              result = processForm(data); // LLAMADA AL NUEVO PROCESADOR
            } finally { lock.releaseLock(); }
          } else {
             return ContentService.createTextOutput(JSON.stringify({success:false, error:"Servidor ocupado."})).setMimeType(ContentService.MimeType.JSON);
          }
       } else if (data.action === 'getRecordCount') {
          const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Registro');
          result = { success: true, count: s ? Math.max(0, s.getLastRow() - 1) : 0 };
       } else {
          result = { success: false, error: "Acción desconocida: " + data.action };
       }
    }
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  } 
}

/**
 * 🛠️ HELPER: Obtener encabezados actuales y Mapeo de Índices
 */
function getSheetHeaders(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return { headers: [], map: {} };
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const map = {};
  headers.forEach((h, i) => map[h] = i); // Nombre -> Índice (0-based)
  return { headers, map, lastCol };
}

/**
 * 🛠️ HELPER: Sincronizar columnas (Crea las que falten)
 */
function syncHeaders(sheet) {
  let { headers } = getSheetHeaders(sheet);
  const requiredHeaders = Object.values(FIELD_MAP).filter( val => val !== null ); // Solo valores no nulos
  
  const missing = requiredHeaders.filter(h => !headers.includes(h));
  
  if (missing.length > 0) {
    // Agregar columnas faltantes al final
    sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
    // Dar formato
    sheet.getRange(1, headers.length + 1, 1, missing.length).setFontWeight('bold').setBackground('#eff6ff'); /* Azulito claro para distinguir nuevas */
    return true; // Hubo cambios
  }
  return false;
}

/**
 * 🛠️ HELPER: Auto-Corregir Formatos (Repara daños por mover columnas)
 */
function applyColumnFormats(sheet, map) {
  // 1. Formatos de Texto (@)
  const textFields = ['Programas', 'Nombre', 'Género', 'Contacto', 'Lugar Nacimiento', 
                      'Estado Civil', 'Escolaridad', 'Supervisor', 'Planta', 'Área', 
                      'Puesto', 'Funciones Puesto', 'Padecimiento', 'Notas', 'Alcohol Tipo', 
                      'Tabaco Tipo', 'Drogas Tipo', 'Medicamentos Tipo'];
  
  textFields.forEach(f => {
     if (map[f]) sheet.getRange(2, map[f] + 1, sheet.getLastRow(), 1).setNumberFormat("@");
  });

  // 2. Formatos de Número Entero (0)
  const intFields = ['Edad', 'Antigüedad Puesto', 'Antigüedad Empresa', 'TA Sistólica', 
                     'TA Diastólica', 'Pulso', 'Body Age', 'Glucometría', 'Oximetría'];
  
  intFields.forEach(f => {
     if (map[f]) sheet.getRange(2, map[f] + 1, sheet.getLastRow(), 1).setNumberFormat("0");
  });

  // 3. Formatos de Número Decimal (0.00)
  const decFields = ['Peso', 'Talla', 'IMC', '% FAT', '% MUSC', 'RMI', 'Grasa Visceral', 'Temperatura'];
  
  decFields.forEach(f => {
     if (map[f]) sheet.getRange(2, map[f] + 1, sheet.getLastRow(), 1).setNumberFormat("0.0");
  });

  // 4. Formatos de Fecha (dd/MM/yyyy)
  const dateFields = ['Fecha Ingreso Puesto', 'Fecha Ingreso Empresa'];
  
  dateFields.forEach(f => {
     if (map[f]) sheet.getRange(2, map[f] + 1, sheet.getLastRow(), 1).setNumberFormat("dd/MM/yyyy");
  });
  
  // 5. Fecha Registro (Con hora)
  if (map['Fecha Registro']) {
     sheet.getRange(2, map['Fecha Registro'] + 1, sheet.getLastRow(), 1).setNumberFormat("dd/MM/yyyy - hh:mm am/pm");
  }
}

/**
 * 🔥 PROCESS FORM V6: DINÁMICO
 */
function processForm(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Registro');
  
  // 1. Crear Hoja si no existe
  if (!sheet) {
    sheet = ss.insertSheet('Registro');
    // Inicializar con TODOS los headers definidos en el mapa
    const initialHeaders = Object.values(FIELD_MAP).filter(v => v);
    sheet.appendRow(initialHeaders);
    sheet.getRange(1, 1, 1, initialHeaders.length).setFontWeight('bold').setBackground('#e2e8f0');
    sheet.setFrozenRows(1);
    createDashboard();
  }

  // 2. Sincronizar Headers (Por si agregas columnas nuevas en el código)
  syncHeaders(sheet);
  
  // 3. Obtener Mapa Actualizado
  const { headers, map } = getSheetHeaders(sheet);
  
  // ⚡ AUTO-REPARAR FORMATOS (Desactivado para mejorar velocidad - instantáneo)
  // applyColumnFormats(sheet, map);
  
  // 4. Preparar Fila de Datos
  let rowData;
  const lastRow = sheet.getLastRow();
  const isUpdate = (data.rowIndex && data.action === 'update');
  
  if (isUpdate) {
    const targetRow = parseInt(data.rowIndex);
    // Obtener valores actuales para no perder datos de pasos no enviados
    rowData = sheet.getRange(targetRow, 1, 1, headers.length).getValues()[0];
  } else {
    rowData = new Array(headers.length).fill('');
  }
  
  // 5. Llenar / Mezclar datos
  for (const [key, value] of Object.entries(data)) {
    const headerName = FIELD_MAP[key];
    if (headerName && map.hasOwnProperty(headerName)) {
       const colIndex = map[headerName];
       
       let finalValue = value;
       
       // 🛠️ FIX: Formatear JSON de Evaluación / Exploración a Texto Legible
       if ((key === 'evaluacionData' || key === 'exploracionData') && value && value.startsWith('[')) {
          try {
             const items = JSON.parse(value);
             if (Array.isArray(items) && items.length > 0) {
                finalValue = items.map(i => `• ${i.item}: ${i.detalle}`).join('\n');
             }
          } catch(e) {
             // Si falla, dejar valor original
          }
       }

       // Si el usuario envió algo vacío, ponemos "N/A"
       if (finalValue === '' || finalValue === null || finalValue === undefined) {
         finalValue = 'N/A';
       }
       
       rowData[colIndex] = finalValue;
    }
  }

  // Final Pass: Asegurar que celdas vacías (especialmente en nuevos registros) tengan "N/A"
  // Esto evita que queden huecos si un paso no se envió.
  for (let i = 0; i < rowData.length; i++) {
    const hName = headers[i];
    // Excluimos la fecha de registro para que se llene correctamente abajo
    if (hName === 'Fecha Registro') continue;
    
    if (rowData[i] === '' || rowData[i] === null || rowData[i] === undefined) {
      rowData[i] = 'N/A';
    }
  }
  
  // 6. Campos Especiales (Calculados o Timestamp)
  // Timestamp
  if (map['Fecha Registro'] !== undefined) {
    // Si estamos actualizando, tratamos de preservar la fecha original
    // Pero si es nuevo registro, fecha nueva
    // La lógica de update vs create maneja esto abajo
    rowData[map['Fecha Registro']] = new Date(); 
  }

  // IMC Cálculo (Numeric)
  let p = parseFloat(data.peso);
  let t = parseFloat(data.talla);
  const rawImc = parseFloat(data.imc);
  
  if (t > 3) t = t/100;
  
  let finalImcVal = 0;
  if (p > 0 && t > 0) {
    finalImcVal = Number((p/(t*t)).toFixed(1));
  } else if (!isNaN(rawImc)) {
    finalImcVal = Number(rawImc.toFixed(1));
  }
  
  if (map['IMC'] !== undefined) {
    rowData[map['IMC']] = (finalImcVal > 0) ? finalImcVal : 'N/A';
  }

  // Antecedentes Ginecológicos: Si no hay fecha, poner "Sin datos"
  const ginecoDateFields = ['FUM', 'Papanicolau', 'Mastografía'];
  ginecoDateFields.forEach(field => {
    if (map[field] !== undefined && (rowData[map[field]] === '' || rowData[map[field]] === null || rowData[map[field]] === undefined)) {
      rowData[map[field]] = 'Sin datos';
    }
  });

  // 7. Escribir
  
  if (data.rowIndex && data.action === 'update') {
     const rowIndex = parseInt(data.rowIndex);
     if (rowIndex < 2 || rowIndex > lastRow + 1) throw new Error("Índice inválido");
     
     // Preservar fecha original
     if (map['Fecha Registro'] !== undefined) {
        const existingDate = sheet.getRange(rowIndex, map['Fecha Registro'] + 1).getValue();
        if (existingDate) rowData[map['Fecha Registro']] = existingDate;
     }

     // Update Block
     sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
     
      // Formato de Fecha con Hora
      if (map['Fecha Registro'] !== undefined) {
         sheet.getRange(rowIndex, map['Fecha Registro'] + 1).setNumberFormat("dd/MM/yyyy - hh:mm am/pm");
      }
      
      // Formato IMC (Prevent Date Conversion)
      if (map['IMC'] !== undefined) {
         sheet.getRange(rowIndex, map['IMC'] + 1).setNumberFormat("0.0");
      }

     createDashboard(); // ✅ REACTIVADO: Dashboard Inteligente con Nuevas Gráficas
     return { success: true, rowIndex: rowIndex };
  } else {
     // Create Block
     const newRow = lastRow + 1;
     sheet.getRange(newRow, 1, 1, rowData.length).setValues([rowData]);
     
      // Formato de Fecha con Hora
      if (map['Fecha Registro'] !== undefined) {
         sheet.getRange(newRow, map['Fecha Registro'] + 1).setNumberFormat("dd/MM/yyyy - hh:mm am/pm");
      }
      
      // Formato IMC (Prevent Date Conversion)
      if (map['IMC'] !== undefined) {
         sheet.getRange(newRow, map['IMC'] + 1).setNumberFormat("0.0");
      }

     createDashboard(); // ✅ REACTIVADO: Dashboard Inteligente con Nuevas Gráficas
     return { success: true, rowIndex: newRow };
  }
}

/**
 * 🔥 READ FUNCTION V6: SEARCH (Lectura Dinámica)
 */
function searchEmployee(id) {
  const SS_ID = "1I9KkIWTUfzpHqzK0XvP930DA9DEQfGb0VjEj_0i_Th0"; 
  const ss = SpreadsheetApp.openById(SS_ID);
  const sheet = ss.getSheetByName('Registro');
  if (!sheet) return { success: true, found: false, results: [] };

  const { headers, map, lastCol } = getSheetHeaders(sheet);
  
  // Validar que exista columna Núm
  if (map['Núm'] === undefined) return { success: false, error: "Columna 'Núm' no encontrada en Excel" };
  const colIndexID = map['Núm']; // 0-based

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: true, found: false, results: [] };

  // Leer todo (Optimizado)
  const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const results = [];
  const targetId = String(id).trim();

  // Mapa Inverso: Header -> Key (Para reconstruir el objeto)
  const reverseMap = {};
  for (const [key, header] of Object.entries(FIELD_MAP)) {
     if (header) reverseMap[header] = key;
  }

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (String(row[colIndexID]).trim() === targetId) {
       // Construir objeto dinámicamente
       const recordData = {};
       
       headers.forEach((h, idx) => {
          const key = reverseMap[h];
          if (key) {
             recordData[key] = row[idx];
          }
       });
       
       results.push({
         rowIndex: i + 2, // 1-based + header
         date: recordData.timestamp || row[0],
         data: recordData
       });
    }
  }
  
  results.sort((a, b) => new Date(b.date) - new Date(a.date));
  return { success: true, found: results.length > 0, results: results };
}

/**
 * 🔥 GET PROFILE: Recupera solo los datos de identidad más recientes.
 * Se usa para rellenar registros pendientes con 100% de precisión.
 */
function getProfile(id) {
  const result = searchEmployee(id);
  if (result.success && result.found && result.results.length > 0) {
    // Tomar el más reciente (ya vienen ordenados por fecha desc en searchEmployee)
    const latest = result.results[0].data;
    return {
      success: true,
      found: true,
      data: {
        num: latest.num,
        nombre: latest.nombre,
        genero: latest.genero,
        edad: latest.edad,
        estadoCivil: latest.estadoCivil,
        planta: latest.planta,
        area: latest.area,
        puesto: latest.puesto,
        turno: latest.turno,
        supervisor: latest.supervisor
      }
    };
  }
  return { success: true, found: false };
}


/**
 * 🔥 DASHBOARD V6: Indices Dinámicos
 */
function getDashboardData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Registro');
    if (!sheet) return { success: false, error: "No sheet" };
    
    const { map } = getSheetHeaders(sheet);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: true, records: [] };
    
    // Leer todo
    const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    
    // Helper índices
    const idx = (name) => map[name]; 
    
    const records = data.map(row => {
      let imc = row[idx('IMC')];
      // Recálculo fallback
      if (!imc || imc === "") {
         let p = parseFloat(row[idx('Peso')] || 0);
         let t = parseFloat(row[idx('Talla')] || 0);
         if (t > 3) t/=100;
         if (p>0 && t>0) imc = (p/(t*t)).toFixed(1);
      }
      return {
        fechaRegistro: row[idx('Fecha Registro')] || '',
        numEmpleado: row[idx('Núm')] || '',
        nombre: row[idx('Nombre')] || '',
        programas: row[idx('Programas')] || '',
        genero: row[idx('Género')] || '',
        edad: row[idx('Edad')] || 0,
        planta: row[idx('Planta')] || '',
        area: row[idx('Área')] || '',
        turno: row[idx('Turno')] || '',
        peso: row[idx('Peso')] || 0,
        talla: row[idx('Talla')] || 0,
        imc: imc,
        fat: row[idx('% FAT')] || 0,
        musc: row[idx('% MUSC')] || 0,
        visc: row[idx('Grasa Visceral')] || 0,
        taSistolica: row[idx('TA Sistólica')] || 0,
        taDiastolica: row[idx('TA Diastólica')] || 0,
        glucometria: row[idx('Glucometría')] || 0,
        padecimiento: row[idx('Padecimiento')] || ''
      };
    });
    
    return { success: true, records: records };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Crea o actualiza el Dashboard Nutricional "Premium".
 * Se ejecuta automáticamente al guardar nuevos datos.
 * ⚡ OPTIMIZADO V6.2: Lógica "Smart Update" para evitar reconstrucción.
 */
/**
 * Crea o actualiza el Dashboard Nutricional "Premium".
 * Se ejecuta automáticamente al guardar nuevos datos.
 * ⚡ OPTIMIZADO V6.5: Lógica "Smart Update" y Nuevas Gráficas Organizacionales.
 */
function createDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dataSheet = ss.getSheetByName('Registro');
  try {
    if (!dataSheet || dataSheet.getLastRow() < 2) return; 
    
    let calcSheet = ss.getSheetByName('Calculos_Aux');
    if (!calcSheet) {
      calcSheet = ss.insertSheet('Calculos_Aux');
      calcSheet.hideSheet();
    }
    calcSheet.clear();
    
    // --- A. PROCESAMIENTO DE DATOS ---
    const headers = dataSheet.getRange(1, 1, 1, dataSheet.getLastColumn()).getValues()[0];
    const dataRowRange = dataSheet.getRange(2, 1, dataSheet.getLastRow() - 1, dataSheet.getLastColumn());
    const data = dataRowRange.getValues();
    
    const iIMC = headers.indexOf('IMC');
    const iTASis = headers.indexOf('TA Sistólica');
    const iTADias = headers.indexOf('TA Diastólica');
    const iEdad = headers.indexOf('Edad');
    const iBodyAge = headers.indexOf('Body Age');
    const iFat = headers.indexOf('% FAT');
    const iMusc = headers.indexOf('% MUSC');
    const iPadecimiento = headers.indexOf('Padecimiento');
    const iAptitud = headers.indexOf('Aptitud Médica');
    const iUnidad = headers.indexOf('Unidad de Negocio');
    const iArea = headers.indexOf('Área');

    // Hallazgos clínicos (Sistemas Paso 5)
    const clinicalHeaders = [
      'Exp. Cráneo', 'Exp. Cara', 'Exp. Cuello', 'Exp. Abdomen', 'Exp. MsTs', 'Exp. MsPs', 
      'Exp. Articulaciones', 'Exp. Columna', 'Exp. Reflejos', 'Exp. Várices', 'Eval. Órganos', 
      'Eval. Piel', 'Eval. Respiratorio', 'Eval. Cardio', 'Eval. Digestivo', 'Eval. Genitourinario'
    ];
    const clinicalIndices = clinicalHeaders.map(h => headers.indexOf(h)).filter(idx => idx > -1);

    const processedData = [['ID', 'Score', 'IMC_Clasif', 'Cardio', 'Aptitud', 'Unidad', 'Area']];
    const buRestrictions = {}; // Unidad -> Contador Restricciones
    const fitnessCounts = { 'Apto': 0, 'Apto con Restr.': 0, 'No Apto': 0, 'N/A': 0 };
    const systemAnomalies = {}; // Sistema -> Contador "Anormal"

    data.forEach((row, index) => {
      let score = 100;
      
      // 1. IMC & Cardio (Sigue lógica original)
      const imc = (iIMC > -1) ? (parseFloat(row[iIMC]) || 0) : 0;
      let clasif = imc >= 30 ? 'Obesidad' : (imc >= 25 ? 'Sobrepeso' : 'Normal');
      if (imc >= 30) score -= 20;

      const sis = (iTASis > -1) ? (parseInt(row[iTASis]) || 0) : 0;
      const dias = (iTADias > -1) ? (parseInt(row[iTADias]) || 0) : 0;
      let cardio = (sis >= 140 || dias >= 90) ? 'Riesgo Alto' : 'Normal';
      if (cardio === 'Riesgo Alto') score -= 30;

      // 2. Aptitud & Unidad (NUEVO)
      const aptitud = (iAptitud > -1) ? String(row[iAptitud] || 'N/A') : 'N/A';
      const unidad = (iUnidad > -1) ? String(row[iUnidad] || 'Sin Unidad') : 'Sin Unidad';
      
      // Contadores para gráficas
      if (aptitud.includes('Restr')) {
        buRestrictions[unidad] = (buRestrictions[unidad] || 0) + 1;
        fitnessCounts['Apto con Restr.']++;
      } else if (aptitud.includes('No Apto')) {
        fitnessCounts['No Apto']++;
      } else if (aptitud.includes('Apto')) {
        fitnessCounts['Apto']++;
      } else {
        fitnessCounts['N/A']++;
      }

      // 3. Hallazgos Sistemas (NUEVO)
      clinicalIndices.forEach(idx => {
        const val = String(row[idx] || '').toLowerCase();
        if (val.includes('anormal')) {
          const sysName = headers[idx];
          systemAnomalies[sysName] = (systemAnomalies[sysName] || 0) + 1;
        }
      });

      processedData.push([`E-${index+1}`, score, clasif, cardio, aptitud, unidad, (iArea > -1 ? row[iArea] : '')]);
    });

    // --- B. TABLAS DE AGREGACIÓN EN CALCULOS_AUX ---
    
    // Tabla 1: Restricciones por Unidad
    const buTable = [['Unidad de Negocio', 'Restricciones']];
    Object.entries(buRestrictions).forEach(([k, v]) => buTable.push([k, v]));
    calcSheet.getRange(1, 1, buTable.length, 2).setValues(buTable);

    // Tabla 2: Aptitud General
    const fitTable = [['Estado', 'Cantidad']];
    Object.entries(fitnessCounts).forEach(([k, v]) => fitTable.push([k, v]));
    calcSheet.getRange(1, 4, fitTable.length, 2).setValues(fitTable);

    // Tabla 3: Hallazgos por Sistema
    const sysTable = [['Sistema', 'Hallazgos Anormales']];
    Object.entries(systemAnomalies).sort((a,b) => b[1]-a[1]).slice(0, 8).forEach(([k, v]) => sysTable.push([k, v]));
    calcSheet.getRange(1, 7, sysTable.length, 2).setValues(sysTable);

    // --- C. DASHBOARD VISUAL ---
    let dashSheet = ss.getSheetByName('Dashboard');
    let isUpdateMode = false;

    if (dashSheet) {
      const check = dashSheet.getRange('B2').getValue();
      const version = dashSheet.getRange('M32').getValue();
      // Si el título coincide Y la versión es la actual, entramos en modo rápido
      if (check === 'Dashboard Nutricional - Vista Ejecutiva' && version === 'V6.5') {
        isUpdateMode = true;
      } else {
        dashSheet.clear(); // Si la versión es vieja o no existe, borrar para reconstruir con nuevas gráficas
      }
    } else {
      dashSheet = ss.insertSheet('Dashboard');
    }

    const totalEval = data.length;
    const avgScore = (processedData.slice(1).reduce((s, r) => s + r[1], 0) / totalEval).toFixed(0);

    if (isUpdateMode) {
       dashSheet.getRange('B6').setValue(totalEval);
       dashSheet.getRange('E6').setValue(avgScore);
       dashSheet.getRange('B32').setValue("Actualización Automática: " + new Date().toLocaleString());
       return; // Los gráficos se refrescan solos
    }

    // MODO CONSTRUCCIÓN (Primera vez)
    dashSheet.setHiddenGridlines(true);
    [1,3,4,6,7,9,10,12].forEach(c => dashSheet.setColumnWidth(c, 25));
    [2,5,8,11].forEach(c => dashSheet.setColumnWidth(c, 200));

    dashSheet.getRange('B2:M3').merge().setValue('Dashboard Nutricional - Vista Ejecutiva')
      .setHorizontalAlignment('center').setVerticalAlignment('middle')
      .setFontFamily('Montserrat').setFontSize(20).setFontWeight('bold')
      .setBackground('#0f172a').setFontColor('#ffffff');

    createKpiCard(dashSheet, 'B', 5, 'Evaluaciones', totalEval, '#3b82f6');
    createKpiCard(dashSheet, 'E', 5, 'Score Salud', avgScore, '#10b981');

    // --- GRÁFICAS ---
    
    // 1. Restricciones por Unidad (Barras)
    const chartBU = dashSheet.newChart()
      .setChartType(Charts.ChartType.BAR)
      .addRange(calcSheet.getRange(1, 1, buTable.length, 2))
      .setPosition(10, 2, 0, 0)
      .setOption('title', 'Restricciones por Unidad de Negocio')
      .setOption('colors', ['#ef4444'])
      .setOption('legend', {position: 'none'})
      .setOption('width', 400).setOption('height', 300)
      .build();
    dashSheet.insertChart(chartBU);

    // 2. Aptitud General (Dona)
    const chartFit = dashSheet.newChart()
      .setChartType(Charts.ChartType.PIE)
      .addRange(calcSheet.getRange(1, 4, fitTable.length, 2))
      .setPosition(10, 8, 0, 0)
      .setOption('title', 'Estado de Aptitud Médica')
      .setOption('pieHole', 0.5)
      .setOption('colors', ['#10b981', '#f59e0b', '#ef4444', '#94a3b8'])
      .setOption('width', 400).setOption('height', 300)
      .build();
    dashSheet.insertChart(chartFit);

    // 3. Sistemas con más Hallazgos (Barras)
    const chartSys = dashSheet.newChart()
      .setChartType(Charts.ChartType.COLUMN)
      .addRange(calcSheet.getRange(1, 7, sysTable.length, 2))
      .setPosition(27, 2, 0, 0)
      .setOption('title', 'Top Hallazgos Clínicos (Paso 5)')
      .setOption('colors', ['#6366f1'])
      .setOption('legend', {position: 'none'})
      .setOption('width', 850).setOption('height', 300)
      .build();
    dashSheet.insertChart(chartSys);

    dashSheet.getRange('B32').setValue("Dashboard configurado el: " + new Date().toLocaleString());
    dashSheet.getRange('M32').setValue("V6.5");
  } catch(e) { /* Silencioso en guardado */ }
}

/**
 * Helper para crear tarjetas bonitas en celdas
 */
function createKpiCard(sheet, colLetter, row, title, value, color) {
  const range = sheet.getRange(`${colLetter}${row}:${String.fromCharCode(colLetter.charCodeAt(0)+2)}${row+2}`);
  range.merge()
       .setBackground('#ffffff')
       .setBorder(true, true, true, true, null, null, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID)
       .setHorizontalAlignment('center').setVerticalAlignment('middle');
       
  sheet.getRange(`${colLetter}${row}`).setValue(title).setFontSize(10).setFontWeight('bold').setFontColor('#64748b').setHorizontalAlignment('center');
  sheet.getRange(`${colLetter}${row+1}`).setValue(value).setFontSize(28).setFontWeight('bold').setFontColor(color).setHorizontalAlignment('center');
}

// -----------------------------------------------------------
// FUNCIONES AUXILIARES (Auth, AI, etc.) - RESTAURADAS COMPLETAS
// -----------------------------------------------------------

function setupAuthDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Usuarios');
  if (!sheet) {
    sheet = ss.insertSheet('Usuarios');
    sheet.appendRow(['Usuario', 'PasswordHash', 'Email', 'Salt', 'LastLogin']);
    sheet.getRange('A1:E1').setFontWeight('bold').setBackground('#cbd5e1');
  }

  // Lista Oficial de Usuarios (Se agregan si no existen)
  const defaultUsers = [
    { u: 'Socorro.Lozano', e: 'Socorro.Lozano@hunter.global' },
    { u: 'serviciomedico.tijuana', e: 'serviciomedico.tijuana@hunterindustries.com' },
    { u: 'Socorro.Quintanilla', e: 'Socorro.Quintanilla@hunter.global' },
    { u: 'Patricia.Sanchez', e: 'Patricia.Sanchez@hunter.global' },
    { u: 'maria.alatorre', e: 'maria.alatorre@hunter.global' },
    { u: 'rodrigo.flores', e: 'rodrigo.flores@hunter.global' },
    { u: 'Ana.Osuna', e: 'Ana.Osuna@hunter.global' },
    { u: 'Russel.Oviedo', e: 'Russel.Oviedo@hunter.global' },
    { u: 'Admin', e: 'jorge.russel@gmail.com' } 
  ];

  const DEFAULT_HASH = '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5'; // 12345
  
  const existingData = sheet.getDataRange().getValues();
  const existingUsers = new Set();
  for(let i=1; i<existingData.length; i++) {
     existingUsers.add(String(existingData[i][0]).toLowerCase().trim());
     existingUsers.add(String(existingData[i][2]).toLowerCase().trim());
  }

  defaultUsers.forEach(user => {
      if (!existingUsers.has(user.u.toLowerCase()) && !existingUsers.has(user.e.toLowerCase())) {
          sheet.appendRow([user.u, DEFAULT_HASH, user.e, 'init', new Date()]);
      }
  });
}

function validateLogin(user, passHash) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Usuarios');
  if (!sheet) return { success: false, error: 'Error de sistema: BD Usuarios no encontrada' };
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const dbUser = String(row[0]).trim().toLowerCase();
    const dbEmail = String(row[2]).trim().toLowerCase();
    const input = String(user).trim().toLowerCase();

    if (dbUser === input || dbEmail === input) {
      if (row[1] === passHash) {
         const token = Utilities.getUuid();
         CacheService.getScriptCache().put(token, row[0], 21600); 
         return { success: true, token: token };
      } else {
         return { success: false, error: 'Contraseña incorrecta' };
      }
    }
  }
  return { success: false, error: 'Usuario no encontrado' };
}

function changePassword(user, oldHash, newHash) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Usuarios');
  const lock = LockService.getScriptLock();
  if (lock.tryLock(10000)) {
    try {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).toLowerCase() === String(user).toLowerCase()) {
           if (data[i][1] === oldHash) {
              sheet.getRange(i+1, 2).setValue(newHash);
              return { success: true, message: 'Contraseña actualizada.' };
           }
           return { success: false, error: 'Contraseña anterior incorrecta.' };
        }
      }
      return { success: false, error: 'Usuario no encontrado.' };
    } finally { lock.releaseLock(); }
  }
  return { success: false, error: 'Servidor ocupado.' };
}

function resetPassword(userOrEmail) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Usuarios');
  const lock = LockService.getScriptLock();
  if (lock.tryLock(10000)) {
    try {
      const data = sheet.getDataRange().getValues();
      let foundRow = -1;
      let email = '';
      let user = '';
      for (let i = 1; i < data.length; i++) {
        const u = String(data[i][0]).toLowerCase();
        const e = String(data[i][2]).toLowerCase();
        const target = String(userOrEmail).toLowerCase();
        if (u === target || e === target) {
           foundRow = i + 1; user = data[i][0]; email = data[i][2]; break;
        }
      }
      if (foundRow !== -1) {
         const tempPass = 'CDC-' + Math.floor(100000 + Math.random() * 900000).toString();
         const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, tempPass);
         let txtHash = '';
         for (let j = 0; j < rawHash.length; j++) {
            let hashVal = rawHash[j]; if (hashVal < 0) hashVal += 256;
            if (hashVal.toString(16).length == 1) txtHash += '0'; txtHash += hashVal.toString(16);
         }
         sheet.getRange(foundRow, 2).setValue(txtHash);
         MailApp.sendEmail({ to: email, subject: "Restablecimiento - SGSM", body: `Hola ${user}, tu clave temporal es: ${tempPass}`});
         return { success: true, message: 'Correo enviado.' };
      }
      return { success: false, error: 'Usuario no encontrado.' };
    } finally { lock.releaseLock(); }
  }
  return { success: false, error: 'Servidor ocupado.' };
}

function renewSession(token) {
   const c = CacheService.getScriptCache();
   const u = c.get(token);
   if (u) c.put(token, u, 21600);
}

// 🧠 AI ENGINE (Preservado Exactamente)
/**
 * --- SMART CLINICAL GENERATOR (Logic Based) ---
 * Genera una observación basada en reglas médicas estrictas.
 */
// ⚙️ BASE DE DATOS DE REGLAS MÉDICAS (COMPLETA)
const MEDICAL_RULES = {
  // 1. PORCENTAJE DE GRASA CORPORAL (%)
  grasa_corporal: {
    hombre: [
      {
        min_edad: 18, max_edad: 39,
        rangos: [
          { max: 8, estado: "Bajo (Atleta)", sugerencia: "Asegurar ingesta calórica suficiente para el rendimiento" },
          { max: 19, estado: "Saludable", sugerencia: "Mantener rutina de ejercicio y dieta balanceada" },
          { max: 24, estado: "Sobrepeso", sugerencia: "Déficit calórico ligero y aumentar cardio" },
          { max: 100, estado: "Obesidad", sugerencia: "Plan nutricional hipocalórico estricto y supervisión" }
        ]
      },
      {
        min_edad: 40, max_edad: 59,
        rangos: [
          { max: 11, estado: "Bajo", sugerencia: "Revisar nutrición, evitar catabolismo muscular" },
          { max: 21, estado: "Saludable", sugerencia: "Excelente estado para el rango de edad" },
          { max: 27, estado: "Sobrepeso", sugerencia: "Reducir carbohidratos simples y alcohol" },
          { max: 100, estado: "Obesidad", sugerencia: "Actividad física de bajo impacto y dieta" }
        ]
      },
      {
        min_edad: 60, max_edad: 120,
        rangos: [
          { max: 13, estado: "Bajo", sugerencia: "Riesgo de fragilidad. Aumentar densidad nutricional" },
          { max: 24, estado: "Saludable", sugerencia: "Mantener movilidad y fuerza" },
          { max: 29, estado: "Sobrepeso", sugerencia: "Controlar peso sin perder masa muscular" },
          { max: 100, estado: "Obesidad", sugerencia: "Evaluación cardiovascular prioritaria" }
        ]
      }
    ],
    mujer: [
      {
        min_edad: 18, max_edad: 39,
        rangos: [
          { max: 21, estado: "Bajo (Atleta)", sugerencia: "Monitorear salud hormonal (ciclo menstrual)" },
          { max: 32, estado: "Saludable", sugerencia: "Mantener estilo de vida actual" },
          { max: 38, estado: "Sobrepeso", sugerencia: "Aumentar actividad física diaria (NEAT)" },
          { max: 100, estado: "Obesidad", sugerencia: "Consultar especialista en nutrición" }
        ]
      },
      {
        min_edad: 40, max_edad: 59,
        rangos: [
          { max: 23, estado: "Bajo", sugerencia: "Asegurar ingesta de grasas saludables" },
          { max: 33, estado: "Saludable", sugerencia: "Buen control metabólico" },
          { max: 39, estado: "Sobrepeso", sugerencia: "Cuidar índice glucémico de los alimentos" },
          { max: 100, estado: "Obesidad", sugerencia: "Plan integral de pérdida de peso" }
        ]
      },
      {
        min_edad: 60, max_edad: 120,
        rangos: [
          { max: 24, estado: "Bajo", sugerencia: "Evaluar densidad ósea (riesgo osteoporosis)" },
          { max: 35, estado: "Saludable", sugerencia: "Mantener ingesta de calcio y proteínas" },
          { max: 41, estado: "Sobrepeso", sugerencia: "Caminatas diarias y control de porciones" },
          { max: 100, estado: "Obesidad", sugerencia: "Reducción de peso gradual supervisada" }
        ]
      }
    ]
  },

  // 2. MASA MUSCULAR (%)
  masa_muscular: {
    hombre: [
      {
        min_edad: 18, max_edad: 39,
        rangos: [
          { max: 33.2, estado: "Bajo", sugerencia: "Entrenamiento de fuerza e hipertrofia" },
          { max: 39.3, estado: "Normal", sugerencia: "Mantenimiento de fuerza" },
          { max: 100, estado: "Alto (Fuerte)", sugerencia: "Excelente condición muscular" }
        ]
      },
      {
        min_edad: 40, max_edad: 59,
        rangos: [
          { max: 33.0, estado: "Bajo", sugerencia: "Aumentar ingesta proteica (1.2g-1.5g/kg)" },
          { max: 39.1, estado: "Normal", sugerencia: "Ejercicio de resistencia regular" },
          { max: 100, estado: "Alto", sugerencia: "Muy buena protección metabólica" }
        ]
      },
      {
        min_edad: 60, max_edad: 120,
        rangos: [
          { max: 32.8, estado: "Bajo", sugerencia: "Riesgo de Sarcopenia. Prioridad: pesas/resistencia" },
          { max: 38.9, estado: "Normal", sugerencia: "Actividad física moderada" },
          { max: 100, estado: "Alto", sugerencia: "Excelente envejecimiento activo" }
        ]
      }
    ],
    mujer: [
      {
        min_edad: 18, max_edad: 39,
        rangos: [
          { max: 24.2, estado: "Bajo", sugerencia: "Incluir rutinas de fuerza 3 veces por semana" },
          { max: 30.3, estado: "Normal", sugerencia: "Equilibrio saludable" },
          { max: 100, estado: "Alto (Fuerte)", sugerencia: "Condición atlética destacada" }
        ]
      },
      {
        min_edad: 40, max_edad: 59,
        rangos: [
          { max: 24.0, estado: "Bajo", sugerencia: "Entrenamiento de fuerza para salud ósea" },
          { max: 30.1, estado: "Normal", sugerencia: "Mantener vida activa" },
          { max: 100, estado: "Alto", sugerencia: "Excelente tono muscular" }
        ]
      },
      {
        min_edad: 60, max_edad: 120,
        rangos: [
          { max: 23.8, estado: "Bajo", sugerencia: "Prevención de caídas y fracturas. Ejercicio de fuerza" },
          { max: 29.9, estado: "Normal", sugerencia: "Estilo de vida saludable" },
          { max: 100, estado: "Alto", sugerencia: "Condición física superior al promedio" }
        ]
      }
    ]
  },

  // 3. GRASA VISCERAL (NIVEL 1-59) - UNIVERSAL
  grasa_visceral: {
    universal: [
      { max: 9, estado: "Normal", sugerencia: "Nivel saludable. Mantener ejercicio cardiovascular" },
      { max: 14, estado: "Alto", sugerencia: "Riesgo cardiovascular elevado. Reducir grasas saturadas" },
      { max: 59, estado: "Muy Alto", sugerencia: "Peligro metabólico. Intervención médica urgente" }
    ]
  }
};

// 🧠 FUNCIÓN LÓGICA (El cerebro del sistema)
function evaluarPaciente(tipoAnalisis, valor, genero, edad) {
  const data = MEDICAL_RULES[tipoAnalisis];
  
  if (!valor || !data) return null;

  let grupoReglas = [];
  
  if (data.universal) {
    grupoReglas = data.universal;
  } else {
    // Normalizar género
    const generoKey = (genero && (genero.toLowerCase() === 'masculino' || genero.toLowerCase() === 'hombre' || genero.toLowerCase() === 'm')) ? 'hombre' : 'mujer';
    
    // Buscar el grupo de edad
    const grupoEdad = data[generoKey].find(g => edad >= g.min_edad && edad <= g.max_edad);
    
    // Si no encuentra rango exacto (ej: >120 años o <18), usa el último disponible o retorna null
    if (!grupoEdad) return null;
    grupoReglas = grupoEdad.rangos;
  }

  // Buscar el rango donde cae el valor
  const resultado = grupoReglas.find(r => valor <= r.max);

  if (resultado) {
    return {
      metric: tipoAnalisis,
      estado: resultado.estado,
      sugerencia: resultado.sugerencia
    };
  } 
  return null;
}

/**
 * --- SMART CLINICAL GENERATOR (Logic Based v2) ---
 * Genera una observación basada en reglas médicas estrictas + Composición Corporal Avanzada.
 */
function getAiSuggestion(data) {
  // ⚙️ REGLAS BÁSICAS (Presión, Glucosa, IMC Simple)
  console.log("DEBUG: Datos recibidos en getAiSuggestion:", JSON.stringify(data));
  const BASIC_RULES = {
    imc: {
      obesidad: { min: 30, texto: "Obesidad", sugerencia: "plan nutricional hipocalórico estricto" },
      sobrepeso: { min: 25, texto: "Sobrepeso", sugerencia: "reducir ingesta de carbohidratos simples" }
    },
    tension: {
      alta: { sys: 140, dia: 90, texto: "Hipertensión", sugerencia: "monitoreo diario y referencia médica" },
      limitrofe: { sys: 130, dia: 85, texto: "Presión Limítrofe", sugerencia: "reducir consumo de sodio" }
    },
    glucosa: {
      diabetes: { min: 126, texto: "Posible Diabetes", sugerencia: "solicitar HbA1c confirmatoria" },
      alterada: { min: 100, texto: "Glucosa Alterada", sugerencia: "evitar azúcares refinados" }
    }
  };

  try {
    let findings = [];
    let recommendations = [];

    // Parsear datos numéricos
    const imc = parseFloat(data.imc) || 0;
    const sys = parseFloat(data.taSistolica) || 0;
    const dia = parseFloat(data.taDiastolica) || 0;
    const glu = parseFloat(data.glucometria) || 0;
    const edad = parseInt(data.edad) || 0;
    const genero = data.genero || 'Masculino'; // Default

    const fat = parseFloat(data.fat);
    const musc = parseFloat(data.musc);
    const visc = parseFloat(data.visc);
    
    // --- 1. EVALUACIÓN BÁSICA ---

    // Peso / IMC (Solo si NO hay grasa corporal medida, como fallback, o complementario)
    // Nota: Si tenemos grasa corporal precisa, el IMC pasa a segundo plano, pero lo dejaremos como screening.
    if (imc >= BASIC_RULES.imc.obesidad.min) {
        findings.push(`${BASIC_RULES.imc.obesidad.texto} (IMC ${imc.toFixed(1)})`);
        if(!recommendations.includes(BASIC_RULES.imc.obesidad.sugerencia)) recommendations.push(BASIC_RULES.imc.obesidad.sugerencia);
    } else if (imc >= BASIC_RULES.imc.sobrepeso.min) {
        findings.push(`${BASIC_RULES.imc.sobrepeso.texto} (IMC ${imc.toFixed(1)})`);
        if(!recommendations.includes(BASIC_RULES.imc.sobrepeso.sugerencia)) recommendations.push(BASIC_RULES.imc.sobrepeso.sugerencia);
    }

    // Presión Arterial
    if (sys >= BASIC_RULES.tension.alta.sys || dia >= BASIC_RULES.tension.alta.dia) {
        findings.push(`${BASIC_RULES.tension.alta.texto} (TA ${sys}/${dia})`);
        recommendations.push(BASIC_RULES.tension.alta.sugerencia);
    } else if (sys >= BASIC_RULES.tension.limitrofe.sys || dia >= BASIC_RULES.tension.limitrofe.dia) {
        findings.push(`${BASIC_RULES.tension.limitrofe.texto} (TA ${sys}/${dia})`);
        recommendations.push(BASIC_RULES.tension.limitrofe.sugerencia);
    }

    // Glucosa
    if (glu >= BASIC_RULES.glucosa.diabetes.min) {
        findings.push(`${BASIC_RULES.glucosa.diabetes.texto} (Glucosa ${glu} mg/dL)`);
        recommendations.push(BASIC_RULES.glucosa.diabetes.sugerencia);
    } else if (glu >= BASIC_RULES.glucosa.alterada.min) {
        findings.push(`${BASIC_RULES.glucosa.alterada.texto} (Glucosa ${glu} mg/dL)`);
        recommendations.push(BASIC_RULES.glucosa.alterada.sugerencia);
    }

    // --- 2. EVALUACIÓN AVANZADA (COMPOSICIÓN CORPORAL) ---
    
    // Grasa Corporal
    if (fat) {
        const res = evaluarPaciente("grasa_corporal", fat, genero, edad);
        if (res && res.estado !== "Saludable" && res.estado !== "Normal") {
            findings.push(`Grasa Corp. ${res.estado} (${fat}%)`);
            if(!recommendations.includes(res.sugerencia)) recommendations.push(res.sugerencia);
        }
    }

    // Masa Muscular
    if (musc) {
        const res = evaluarPaciente("masa_muscular", musc, genero, edad);
        if (res && res.estado === "Bajo") { // Solo reportamos si es bajo, o si el usuario quiere saber si es "Alto" también
            findings.push(`Masa Muscular Baja (${musc}%)`);
            if(!recommendations.includes(res.sugerencia)) recommendations.push(res.sugerencia);
        }
    }

    // Grasa Visceral
    if (visc) {
        const res = evaluarPaciente("grasa_visceral", visc, genero, edad);
        if (res && (res.estado === "Alto" || res.estado === "Muy Alto")) {
            findings.push(`Grasa Visceral ${res.estado} (Nvl ${visc})`);
            if(!recommendations.includes(res.sugerencia)) recommendations.push(res.sugerencia);
        }
    }

    // 4. Riesgos Químicos
    if (data.riesgosQuimicos && data.riesgosQuimicos.length > 2 && data.riesgosQuimicos !== "Ninguno") {
        findings.push(`Exp. Químicos: ${data.riesgosQuimicos}`);
    }

    // --- CONSTRUCCIÓN DEL TEXTO ---
    
    if (findings.length === 0) {
        return `Paciente ${genero.toLowerCase()} de ${edad} años. Signos vitales y composición corporal dentro de rangos normales. Se recomienda mantener estilos de vida saludables.`;
    } else {
        const findingText = findings.join(", ");
        // Eliminar duplicados de recomendaciones
        const uniqueRecs = [...new Set(recommendations)];
        const recText = uniqueRecs.length > 0 
            ? " Se sugiere " + uniqueRecs.join(", ") + "." 
            : "";
            
        return `Paciente de ${edad} años. Hallazgos: ${findingText}.${recText} Seguimiento mensual recomendado.`;
    }

  } catch (e) {
    return "Error generando nota: " + e.toString();
  }
}

// --------- FIN CÓDIGO V6 ---------

// ==========================================
// 🔌 FUNCIONES DE INFRAESTRUCTURA (CORS/HTML)
// ==========================================

function doOptions(e) {
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT).setHeaders(headers);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}
