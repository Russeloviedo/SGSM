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
  'fecha_actualizacion': 'Última Actualización', // <-- NUEVO CAMPO AÑADIDO
  
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

  // Historia Ocupacional
  'historial_empresa_1': 'Historial Empresa 1',
  'historial_ocupacion_1': 'Historial Ocupación 1',
  'historial_tiempo_1': 'Historial Tiempo 1',
  'expo_quimicos_1': 'Exposicion quimico 1',
  'expo_quimicos_1_detalle': 'Exposicion quimico detalle 1',
  'expo_fisicos_1': 'Exposicion Fisicos 1',
  'expo_fisicos_1_detalle': 'Exposicion Fisico Dtalle 1',
  'expo_carga_fisica_1': 'Exposicion Carga fisica 1',
  'expo_carga_fisica_1_detalle': 'Exposicion Carga fisica detalle 1',
  'expo_ergonomicos_1': 'Exposicion Ergonomico 1',
  'expo_ergonomicos_1_detalle': 'Exposicion Ergonomico detalle 1',
  'expo_epp_1': 'Exposicion EPP 1',
  'expo_epp_1_detalle': 'Exposicion EPP detalle 1',

  'historial_empresa_2': 'Historial Empresa 2',
  'historial_ocupacion_2': 'Historial Ocupación 2',
  'historial_tiempo_2': 'Historial Tiempo 2',
  'expo_quimicos_2': 'Exposicion quimico 2',
  'expo_quimicos_2_detalle': 'Exposicion quimico detalle 2',
  'expo_fisicos_2': 'Exposicion Fisicos 2',
  'expo_fisicos_2_detalle': 'Exposicion Fisico Dtalle 2',
  'expo_carga_fisica_2': 'Exposicion Carga fisica 2',
  'expo_carga_fisica_2_detalle': 'Exposicion Carga fisica detalle 2',
  'expo_ergonomicos_2': 'Exposicion Ergonomico 2',
  'expo_ergonomicos_2_detalle': 'Exposicion Ergonomico detalle 2',
  'expo_epp_2': 'Exposicion EPP 2',
  'expo_epp_2_detalle': 'Exposicion EPP detalle 2',

  'historial_empresa_3': 'Historial Empresa 3',
  'historial_ocupacion_3': 'Historial Ocupación 3',
  'historial_tiempo_3': 'Historial Tiempo 3',
  'expo_quimicos_3': 'Exposicion quimico 3',
  'expo_quimicos_3_detalle': 'Exposicion quimico detalle 3',
  'expo_fisicos_3': 'Exposicion Fisicos 3',
  'expo_fisicos_3_detalle': 'Exposicion Fisico Dtalle 3',
  'expo_carga_fisica_3': 'Exposicion Carga fisica 3',
  'expo_carga_fisica_3_detalle': 'Exposicion Carga fisica detalle 3',
  'expo_ergonomicos_3': 'Exposicion Ergonomico 3',
  'expo_ergonomicos_3_detalle': 'Exposicion Ergonomico detalle 3',
  'expo_epp_3': 'Exposicion EPP 3',
  'expo_epp_3_detalle': 'Exposicion EPP detalle 3',

  // EPP (Equipo de Protección Personal)
  'epp_lista': 'EPP Lista',
  'epp_otros': 'EPP Otros Detalle',

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
  'ahf_cardiopatias': 'AHF Cardiopatias',
  'ahf_psiquiatricos': 'AHF Psiquiátricos',
  'ahf_epilepticos': 'AHF Epilépticos',
  'ahf_alergias': 'AHF Alergias',
  'ahf_asma': 'AHF Asma',
  'ahf_otros': 'AHF Otros',
  'ahf_diabetes_detalle': 'AHF Diabetes Detalle',
  'ahf_hipertension_detalle': 'AHF Hipertensión Detalle',
  'ahf_cancer_detalle': 'AHF Cáncer Detalle',
  'ahf_cardiopatias_detalle': 'AHF Cardiopatias Detalle',
  'ahf_psiquiatricos_detalle': 'AHF Psiquiátricos Detalle',
  'ahf_epilepticos_detalle': 'AHF Epilépticos Detalle',
  'ahf_alergias_detalle': 'AHF Alergias Detalle',
  'ahf_asma_detalle': 'AHF Asma Detalle',
  
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

  // Actividades Adicionales (Paso 5)
  'oficio_externo': '¿Qué oficio realiza o alguna otra actividad fuera de la empresa?',
  'ortopedico': '¿Utiliza algún aparato ortopédico?',
  'lateralidad': 'Lateralidad',
  'deporte': '¿Practica deporte?',
  'deporte_actividad': 'Deporte o Actividad fisica',

  // Ley Silla (Insuficiencia Venosa)
  'leysilla_int': 'Ley Silla - Interrogatorio',
  'leysilla_exp': 'Ley Silla - Exploración física',

  // Evaluación Médica / Exploración (Unified V6.1) - Columnas Originales
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
  'exploracionData': 'Exploración Detallada',
  
  // Conclusión y Aptitud
  'aptitud_medica': 'Aptitud Médica',
  'aptitud_restricciones': 'Restricciones Mèdicas',
  'seguimiento_fecha': 'Fecha Seguimiento',
  'restr_enfermedad_general': 'Enfermedad General',
  'restr_riesgo_trabajo': 'Riesgo Trabajo',
  'tipo_riesgo': 'Tipo Riesgo',

  // Evaluación Médica (Sistemas) - Columnas Originales
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

  // NUEVO: Hallazgos Detallados (Paso 5 - Doble Columna)
  'eval_craneo_hallazgo': 'Hallazgo: Cráneo',
  'eval_craneo_obs': 'Observación: Cráneo',
  'eval_cara_hallazgo': 'Hallazgo: Cara',
  'eval_cara_obs': 'Observación: Cara',
  'eval_ojos_hallazgo': 'Hallazgo: Ojos',
  'eval_ojos_obs': 'Observación: Ojos',
  'eval_oidos_hallazgo': 'Hallazgo: Oídos',
  'eval_oidos_obs': 'Observación: Oídos',
  'eval_nariz_hallazgo': 'Hallazgo: Nariz',
  'eval_nariz_obs': 'Observación: Nariz',
  'eval_boca_hallazgo': 'Hallazgo: Boca',
  'eval_boca_obs': 'Observación: Boca',
  'eval_faringe_hallazgo': 'Hallazgo: Faringe',
  'eval_faringe_obs': 'Observación: Faringe',
  'eval_abdomen_hallazgo': 'Hallazgo: Abdomen',
  'eval_abdomen_obs': 'Observación: Abdomen',
  'eval_columna_hallazgo': 'Hallazgo: Columna',
  'eval_columna_obs': 'Observación: Columna',
  'eval_respiratorio_hallazgo': 'Hallazgo: Respiratorio',
  'eval_respiratorio_obs': 'Observación: Respiratorio',
  'eval_cardio_hallazgo': 'Hallazgo: Cardio',
  'eval_cardio_obs': 'Observación: Cardio',
  'eval_digestivo_hallazgo': 'Hallazgo: Digestivo',
  'eval_digestivo_obs': 'Observación: Digestivo',
  'eval_genitourinario_hallazgo': 'Hallazgo: Genitourinario',
  'eval_genitourinario_obs': 'Observación: Genitourinario',
  'eval_msts_hallazgo': 'Hallazgo: MsTs',
  'eval_msts_obs': 'Observación: MsTs',
  'eval_msps_hallazgo': 'Hallazgo: MsPs',
  'eval_msps_obs': 'Observación: MsPs',
  'eval_articulaciones_hallazgo': 'Hallazgo: Articulaciones',
  'eval_articulaciones_obs': 'Observación: Articulaciones',
  'eval_marcha_hallazgo': 'Hallazgo: Marcha',
  'eval_marcha_obs': 'Observación: Marcha',
  'eval_reflejos_hallazgo': 'Hallazgo: Reflejos',
  'eval_reflejos_obs': 'Observación: Reflejos',
  'eval_piel_hallazgo': 'Hallazgo: Piel',
  'eval_piel_obs': 'Observación: Piel',
  'eval_cabello_hallazgo': 'Hallazgo: Cabello',
  'eval_cabello_obs': 'Observación: Cabello',
  'eval_sentidos_hallazgo': 'Hallazgo: Org. Sentidos',
  'eval_sentidos_obs': 'Observación: Org. Sentidos',
  'eval_linfatico_hallazgo': 'Hallazgo: Linfático',
  'eval_linfatico_obs': 'Observación: Linfático',
  'eval_nervioso_hallazgo': 'Hallazgo: Nervioso',
  'eval_nervioso_obs': 'Observación: Nervioso',
  'eval_varices_hallazgo': 'Hallazgo: Várices',
  'eval_varices_obs': 'Observación: Várices',
  'eval_tatuajes_hallazgo': 'Hallazgo: Tatuajes',
  'eval_tatuajes_obs': 'Observación: Tatuajes',
  
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

    // 🔓 Acciones PÚBLICAS (Sin token - Para QR, búsqueda y acceso externo)
    if (data.action === 'login') {
       setupAuthDatabase();
       result = validateLogin(data.user, data.passHash);
    } else if (data.action === 'changePassword') {
       result = changePassword(data.user, data.oldHash, data.newHash);
    } else if (data.action === 'resetPassword') {
       result = resetPassword(data.userOrEmail);
    } else if (data.action === 'search') {
       result = searchEmployee(data.id);
    } else if (data.action === 'getProfile') {
       result = getProfile(data.id);
    } else if (data.action === 'supervisorSearch') {
       result = getSupervisorRecord(data.id);
    } else {
       const token = data.token;
       if (!token) return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Token requerido" })).setMimeType(ContentService.MimeType.JSON);
       
       renewSession(token);

       if (data.action === 'keepAlive') result = { success: true, message: "Session Renewed" };
       else if (data.action === 'getAiSuggestion') result = getAiSuggestion(data);
       else if (data.action === 'getDashboardData') result = getDashboardData();
       else if (data.action === 'updateExcelDashboard') {
          result = { success: true, message: "Dashboard Update Disabled" };
       }
       else if (data.action === 'save' || data.action === 'update') {
          const lock = LockService.getScriptLock();
          if (lock.tryLock(30000)) {
            try {
              result = processForm(data);
            } finally { lock.releaseLock(); }
          } else {
             return ContentService.createTextOutput(JSON.stringify({success:false, error:"Servidor ocupado."})).setMimeType(ContentService.MimeType.JSON);
          }
       } else if (data.action === 'getRecordCount') {
          const s = getRegistroSheet();
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
function normalizeHeader(str) {
  if (!str) return '';
  return String(str)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * 🛠️ HELPER: Obtener encabezados actuales y Mapeo de Índices
 */
function getSheetHeaders(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return { headers: [], map: {}, normalizedMap: {} };
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const map = {};
  const normalizedMap = {};
  headers.forEach((h, i) => {
    map[h] = i;
    const norm = normalizeHeader(h);
    if (norm && normalizedMap[norm] === undefined) {
      normalizedMap[norm] = i;
    }
  });
  return { headers, map, normalizedMap, lastCol };
}

/**
 * 🛠️ HELPER: Sincronizar columnas (Crea las que falten de forma inteligente)
 */
function syncHeaders(sheet) {
  let { headers, map, normalizedMap } = getSheetHeaders(sheet);
  const requiredKeys = Object.keys(FIELD_MAP);
  
  const missing = [];
  requiredKeys.forEach(key => {
    const headerName = FIELD_MAP[key];
    if (headerName && findColIndex(key, map, normalizedMap) === undefined) {
       missing.push(headerName);
    }
  });
  
  if (missing.length > 0) {
    sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
    sheet.getRange(1, headers.length + 1, 1, missing.length).setFontWeight('bold').setBackground('#eff6ff');
    return true;
  }
  return false;
}

/**
 * 🛠️ HELPER: Auto-Corregir Formatos (Repara daños por mover columnas)
 */
function applyColumnFormats(sheet, map) {
  const textFields = ['Programas', 'Nombre', 'Género', 'Contacto', 'Lugar Nacimiento', 
                      'Estado Civil', 'Escolaridad', 'Supervisor', 'Planta', 'Área', 
                      'Puesto', 'Funciones Puesto', 'Padecimiento', 'Notas', 'Alcohol Tipo', 
                      'Tabaco Tipo', 'Drogas Tipo', 'Medicamentos Tipo'];
  
  textFields.forEach(f => {
     if (map[f]) sheet.getRange(2, map[f] + 1, sheet.getLastRow(), 1).setNumberFormat("@");
  });

  const intFields = ['Edad', 'Antigüedad Puesto', 'Antigüedad Empresa', 'TA Sistólica', 
                     'TA Diastólica', 'Pulso', 'Body Age', 'Glucometría', 'Oximetría'];
  
  intFields.forEach(f => {
     if (map[f]) sheet.getRange(2, map[f] + 1, sheet.getLastRow(), 1).setNumberFormat("0");
  });

  const decFields = ['Peso', 'Talla', 'IMC', '% FAT', '% MUSC', 'RMI', 'Grasa Visceral', 'Temperatura'];
  
  decFields.forEach(f => {
     if (map[f]) sheet.getRange(2, map[f] + 1, sheet.getLastRow(), 1).setNumberFormat("0.0");
  });

  const dateFields = ['Fecha Ingreso Puesto', 'Fecha Ingreso Empresa'];
  
  dateFields.forEach(f => {
     if (map[f]) sheet.getRange(2, map[f] + 1, sheet.getLastRow(), 1).setNumberFormat("dd/MM/yyyy");
  });
  
  if (map['Fecha Registro']) {
     sheet.getRange(2, map['Fecha Registro'] + 1, sheet.getLastRow(), 1).setNumberFormat("dd/MM/yyyy - hh:mm am/pm");
  }
}

/**
 * 🛠️ HELPER: Buscar la hoja 'Registro' de forma tolerante a espacios y mayúsculas
 */
function getRegistroSheet(ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Registro');
  if (!sheet) {
    const sheets = ss.getSheets();
    sheet = sheets.find(s => s.getName().trim().toLowerCase() === 'registro');
  }
  return sheet;
}


const FIELD_ALIASES = {
  'num': ['Núm', 'Num', 'No', 'ID', 'Número', 'No. Empleado', 'Num Empleado', 'Número Empleado', 'No. de Empleado'],
  'epp_lista': ['EPP Lista', 'EPP', 'Equipo de Protección Personal', 'EPP Utilizado', 'Lista EPP'],
  'epp_otros': ['EPP Otros Detalle', 'EPP Otros', 'Otros EPP'],

  'expo_quimicos_1': ['Exposicion quimico 1', 'Exposición Químicos 1', 'Exposicion Quimica 1', 'Exposicion quimicos 1', 'Riesgo Quimico 1', 'Quimicos 1'],
  'expo_quimicos_1_detalle': ['Exposicion quimico detalle 1', 'Exposición Químicos Detalle 1', 'Exposicion quimica detalle 1', 'Detalle Quimicos 1'],
  'expo_fisicos_1': ['Exposicion Fisicos 1', 'Exposición Físicos 1', 'Exposicion Fisico 1', 'Riesgo Fisico 1', 'Fisicos 1'],
  'expo_fisicos_1_detalle': ['Exposicion Fisico Dtalle 1', 'Exposicion Fisico Detalle 1', 'Exposición Físicos Detalle 1', 'Detalle Fisicos 1'],
  'expo_carga_fisica_1': ['Exposicion Carga fisica 1', 'Exposición Carga Física 1', 'Carga Fisica 1'],
  'expo_carga_fisica_1_detalle': ['Exposicion Carga fisica detalle 1', 'Exposición Carga Física Detalle 1', 'Carga Fisica Detalle 1'],
  'expo_ergonomicos_1': ['Exposicion Ergonomico 1', 'Exposición Ergonómicos 1', 'Exposicion Ergonomicos 1', 'Ergonomicos 1'],
  'expo_ergonomicos_1_detalle': ['Exposicion Ergonomico detalle 1', 'Exposición Ergonómicos Detalle 1', 'Ergonomicos Detalle 1'],
  'expo_epp_1': ['Exposicion EPP 1', 'Exposición EPP 1', 'EPP 1'],
  'expo_epp_1_detalle': ['Exposicion EPP detalle 1', 'Exposición EPP Detalle 1', 'EPP Detalle 1'],

  'expo_quimicos_2': ['Exposicion quimico 2', 'Exposición Químicos 2', 'Exposicion Quimica 2', 'Exposicion quimicos 2', 'Riesgo Quimico 2', 'Quimicos 2'],
  'expo_quimicos_2_detalle': ['Exposicion quimico detalle 2', 'Exposición Químicos Detalle 2', 'Exposicion quimica detalle 2', 'Detalle Quimicos 2'],
  'expo_fisicos_2': ['Exposicion Fisicos 2', 'Exposición Físicos 2', 'Exposicion Fisico 2', 'Riesgo Fisico 2', 'Fisicos 2'],
  'expo_fisicos_2_detalle': ['Exposicion Fisico Dtalle 2', 'Exposicion Fisico Detalle 2', 'Exposición Físicos Detalle 2', 'Detalle Fisicos 2'],
  'expo_carga_fisica_2': ['Exposicion Carga fisica 2', 'Exposición Carga Física 2', 'Carga Fisica 2'],
  'expo_carga_fisica_2_detalle': ['Exposicion Carga fisica detalle 2', 'Exposición Carga Física Detalle 2', 'Carga Fisica Detalle 2'],
  'expo_ergonomicos_2': ['Exposicion Ergonomico 2', 'Exposición Ergonómicos 2', 'Exposicion Ergonomicos 2', 'Ergonomicos 2'],
  'expo_ergonomicos_2_detalle': ['Exposicion Ergonomico detalle 2', 'Exposición Ergonómicos Detalle 2', 'Ergonomicos Detalle 2'],
  'expo_epp_2': ['Exposicion EPP 2', 'Exposición EPP 2', 'EPP 2'],
  'expo_epp_2_detalle': ['Exposicion EPP detalle 2', 'Exposición EPP Detalle 2', 'EPP Detalle 2'],

  'expo_quimicos_3': ['Exposicion quimico 3', 'Exposición Químicos 3', 'Exposicion Quimica 3', 'Exposicion quimicos 3', 'Riesgo Quimico 3', 'Quimicos 3'],
  'expo_quimicos_3_detalle': ['Exposicion quimico detalle 3', 'Exposición Químicos Detalle 3', 'Exposicion quimica detalle 3', 'Detalle Quimicos 3'],
  'expo_fisicos_3': ['Exposicion Fisicos 3', 'Exposición Físicos 3', 'Exposicion Fisico 3', 'Riesgo Fisico 3', 'Fisicos 3'],
  'expo_fisicos_3_detalle': ['Exposicion Fisico Dtalle 3', 'Exposicion Fisico Detalle 3', 'Exposición Físicos Detalle 3', 'Detalle Fisicos 3'],
  'expo_carga_fisica_3': ['Exposicion Carga fisica 3', 'Exposición Carga Física 3', 'Carga Fisica 3'],
  'expo_carga_fisica_3_detalle': ['Exposicion Carga fisica detalle 3', 'Exposición Carga Física Detalle 3', 'Carga Fisica Detalle 3'],
  'expo_ergonomicos_3': ['Exposicion Ergonomico 3', 'Exposición Ergonómicos 3', 'Exposicion Ergonomicos 3', 'Ergonomicos 3'],
  'expo_ergonomicos_3_detalle': ['Exposicion Ergonomico detalle 3', 'Exposición Ergonómicos Detalle 3', 'Ergonomicos Detalle 3'],
  'expo_epp_3': ['Exposicion EPP 3', 'Exposición EPP 3', 'EPP 3'],
  'expo_epp_3_detalle': ['Exposicion EPP detalle 3', 'Exposición EPP Detalle 3', 'EPP Detalle 3']
};

function findColIndex(key, map, normalizedMap) {
  const primaryHeader = FIELD_MAP[key];
  if (primaryHeader) {
     if (map[primaryHeader] !== undefined) return map[primaryHeader];
     const normPrimary = normalizeHeader(primaryHeader);
     if (normalizedMap[normPrimary] !== undefined) return normalizedMap[normPrimary];
  }
  
  const aliases = FIELD_ALIASES[key] || [];
  for (let i = 0; i < aliases.length; i++) {
     const alias = aliases[i];
     if (map[alias] !== undefined) return map[alias];
     const normAlias = normalizeHeader(alias);
     if (normalizedMap[normAlias] !== undefined) return normalizedMap[normAlias];
  }

  const normKey = normalizeHeader(key);
  if (normalizedMap[normKey] !== undefined) return normalizedMap[normKey];

  return undefined;
}

/**
 * 🛠️ HELPER: Buscar la hoja 'Registro' o cualquier hoja activa de forma ultra-tolerante
 */
function getRegistroSheet(ss) {
  if (!ss) {
    try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) {}
  }
  if (!ss) {
    try {
      const SS_ID = "1I9KkIWTUfzpHqzK0XvP930DA9DEQfGb0VjEj_0i_Th0";
      ss = SpreadsheetApp.openById(SS_ID);
    } catch (e) {}
  }
  if (!ss) return null;

  let sheet = ss.getSheetByName('Registro');
  if (!sheet) {
    const sheets = ss.getSheets();
    sheet = sheets.find(s => s.getName().trim().toLowerCase() === 'registro');
    if (!sheet && sheets.length > 0) sheet = sheets[0];
  }
  return sheet;
}

/**
 * 🔥 PROCESS FORM V6: DINÁMICO
 */
function processForm(data) {
  let ss;
  try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) {}
  if (!ss) {
    const SS_ID = "1I9KkIWTUfzpHqzK0XvP930DA9DEQfGb0VjEj_0i_Th0";
    ss = SpreadsheetApp.openById(SS_ID);
  }
  let sheet = getRegistroSheet(ss);
  
  // 1. Crear Hoja si no existe
  if (!sheet) {
    sheet = ss.insertSheet('Registro');
    const initialHeaders = Object.values(FIELD_MAP).filter(v => v);
    sheet.appendRow(initialHeaders);
    sheet.getRange(1, 1, 1, initialHeaders.length).setFontWeight('bold').setBackground('#e2e8f0');
    sheet.setFrozenRows(1);
  }

  syncHeaders(sheet);
  const { headers, map, normalizedMap } = getSheetHeaders(sheet);
  
  let rowData;
  const lastRow = sheet.getLastRow();
  const isUpdate = (data.rowIndex && data.action === 'update');
  
  if (isUpdate) {
    const targetRow = parseInt(data.rowIndex);
    rowData = sheet.getRange(targetRow, 1, 1, headers.length).getValues()[0];
  } else {
    rowData = new Array(headers.length).fill('');
  }
  
  // 5. Llenar / Mezclar datos
  for (const [key, value] of Object.entries(data)) {
    const colIndex = findColIndex(key, map, normalizedMap);
    if (colIndex !== undefined) {
       let finalValue = value;
       if (finalValue === '' || finalValue === null || finalValue === undefined) {
         finalValue = 'N/A';
       }
       rowData[colIndex] = finalValue;
    }
  }

  // Final Pass: Asegurar que celdas vacías (especialmente en nuevos registros) tengan "N/A"
  for (let i = 0; i < rowData.length; i++) {
    const hName = headers[i];
    if (hName === 'Fecha Registro') continue;
    if (hName === 'Última Actualización') continue;
    
    if (rowData[i] === '' || rowData[i] === null || rowData[i] === undefined) {
      rowData[i] = 'N/A';
    }
  }
  
  // 6. Campos Especiales (Calculados o Timestamp)
  if (map['Fecha Registro'] !== undefined) {
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
     
     if (map['Fecha Registro'] !== undefined) {
        const existingDate = sheet.getRange(rowIndex, map['Fecha Registro'] + 1).getValue();
        if (existingDate) rowData[map['Fecha Registro']] = existingDate;
     }

     if (map['Última Actualización'] !== undefined) {
        rowData[map['Última Actualización']] = new Date();
     }

     sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
     
      if (map['Fecha Registro'] !== undefined) {
         sheet.getRange(rowIndex, map['Fecha Registro'] + 1).setNumberFormat("dd/MM/yyyy - hh:mm am/pm");
      }
      if (map['Última Actualización'] !== undefined) {
         sheet.getRange(rowIndex, map['Última Actualización'] + 1).setNumberFormat("dd/MM/yyyy - hh:mm am/pm");
      }
      if (map['IMC'] !== undefined) {
         sheet.getRange(rowIndex, map['IMC'] + 1).setNumberFormat("0.0");
      }

     return { success: true, rowIndex: rowIndex };
  } else {
     const newRow = lastRow + 1;
     
     if (map['Última Actualización'] !== undefined) {
        rowData[map['Última Actualización']] = new Date();
     }

     sheet.getRange(newRow, 1, 1, rowData.length).setValues([rowData]);
     
      if (map['Fecha Registro'] !== undefined) {
         sheet.getRange(newRow, map['Fecha Registro'] + 1).setNumberFormat("dd/MM/yyyy - hh:mm am/pm");
      }
      if (map['Última Actualización'] !== undefined) {
         sheet.getRange(newRow, map['Última Actualización'] + 1).setNumberFormat("dd/MM/yyyy - hh:mm am/pm");
      }
      if (map['IMC'] !== undefined) {
         sheet.getRange(newRow, map['IMC'] + 1).setNumberFormat("0.0");
      }

     return { success: true, rowIndex: newRow };
  }
}


/**
 * 🔥 READ FUNCTION V6: SEARCH (Lectura Dinámica Multi-Hoja & Tolerante a Formato)
 */
function searchEmployee(id) {
  let ss;
  try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) {}
  if (!ss) {
    try {
      const SS_ID = "1I9KkIWTUfzpHqzK0XvP930DA9DEQfGb0VjEj_0i_Th0";
      ss = SpreadsheetApp.openById(SS_ID);
    } catch (e) {}
  }
  if (!ss) return { success: false, error: "No se pudo acceder a la hoja de cálculo." };

  const targetId = String(id).trim();
  if (!targetId) return { success: true, found: false, results: [] };

  const sheetsToSearch = ss.getSheets();
  const results = [];

  sheetsToSearch.forEach(sheet => {
    const { headers, map, normalizedMap, lastCol } = getSheetHeaders(sheet);
    const colIndexID = findColIndex('num', map, normalizedMap);
    if (colIndexID === undefined) return;

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return;

    const colValues = sheet.getRange(2, colIndexID + 1, lastRow - 1, 1).getValues();
    colValues.forEach((rVal, idx) => {
      const cellVal = String(rVal[0]).trim();
      if (cellVal === targetId) {
        const rowIndex = idx + 2;
        const rowValues = sheet.getRange(rowIndex, 1, 1, lastCol).getValues()[0];
        
        const recordData = {};
        for (const key of Object.keys(FIELD_MAP)) {
          const cIdx = findColIndex(key, map, normalizedMap);
          if (cIdx !== undefined && cIdx < rowValues.length) {
            recordData[key] = rowValues[cIdx];
          }
        }

        results.push({
          rowIndex: rowIndex,
          sheetName: sheet.getName(),
          date: recordData.timestamp || rowValues[0],
          data: recordData
        });
      }
    });
  });

  if (results.length === 0) return { success: true, found: false, results: [] };

  // Siempre poner el último registro hasta arriba (Orden Descendente)
  results.sort((a, b) => new Date(b.date) - new Date(a.date));
  return { success: true, found: true, results: results };
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
 * 🔥 GET SUPERVISOR RECORD: Recupera datos de identidad + restricciones (Paso 6).
 * Siempre devuelve el registro MÁS RECIENTE del empleado.
 */
function getSupervisorRecord(id) {
  try {
    // Reutilizamos la búsqueda optimizada (YA TIENE SORT POR FECHA DESC)
    const result = searchEmployee(id);
    
    if (!result.success) return result;
    if (!result.found) return { success: true, found: false };

    // El primer resultado ya es el más reciente debido al sort en searchEmployee
    const latest = result.results[0].data;

    // Helper para extraer valor seguro
    const val = (key) => {
      const v = latest[key];
      return (v === 'N/A' || v === null || v === undefined) ? '' : String(v);
    };

    // Construir respuesta limpia usando las llaves del FIELD_MAP
    const record = {
      nombre: val('nombre'),
      num: val('num'),
      supervisor: val('supervisor'),
      unidad_negocio: val('unidadNegocio'),
      // Restricciones (Paso 6)
      enfermedad_general: val('restr_enfermedad_general'),
      riesgo_trabajo: val('restr_riesgo_trabajo'),
      tipo_restriccion: val('restr_tipo'),
      alta: val('restr_alta'),
      fecha_inicio: val('restr_fecha_inicio'),
      fecha_termino: val('restr_fecha_termino'),
      motivo: val('restr_motivo'),
      region_afectada: val('restr_region_afectada'),
      lista_restricciones: val('restr_lista'),
      otras_restricciones: val('restr_otros'),
      // Fecha del registro
      fecha_registro: val('timestamp')
    };

    return { success: true, found: true, record: record };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
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

// [ELIMINADO]: createDashboard() y createKpiCard() fueron removidos para evitar el consumo excesivo de cuotas de Google Sheets y mejorar drásticamente el tiempo de respuesta. El Dashboard ahora se maneja exclusivamente en el Frontend (App Web).


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
         // Obtenemos el Rol de la columna F (índice 5)
         const userRole = row[5] || 'Usuario'; 
         CacheService.getScriptCache().put(token, row[0], 21600); 
         
         // Devolvemos exitosamente con el Token y el Rol
         return { success: true, token: token, role: userRole };
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
