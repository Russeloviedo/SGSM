# CHANGELOG - Gestión y Seguimiento Nutricional

## [2026-02-05] - V6.1 Medical Expansion & Dynamic Forms

### Backend (Code.gs)
- FIELD_MAP massive update (40+ new columns)
- Dynamic Column Creation verified for:
    - Antecedentes Ginecológicos
    - Exploración Física (Listas dinámicas)
    - Actividades Adicionales
    - Evaluación Médica (Listas dinámicas)

### Frontend (index.html & app.js)
- **Antecedentes Ginecológicos**: Auto-bloqueo para género "Masculino".
- **Exploración Física**: UI dinámica para agregar observaciones por zona (Cráneo, Abdomen, etc.)
- **Evaluación Médica**: UI dinámica para agregar observaciones por sistema (Ojos, Piel, etc.)
- **Actividades**: Nuevos campos de oficio y ortopedia.

### Configuration
- New Deployment URL updated in `js/config.js`.

---

## [2026-02-04] - Motor Dinámico V6

### Backend (Code.gs)
- FIELD_MAP: Mapeo dinámico de columnas
- syncHeaders: Auto-crea columnas faltantes
- applyColumnFormats: Auto-repara formatos
- getDashboardData: Agregado fechaRegistro y glucometria
- processForm: Fecha con hora (dd/MM/yyyy - hh:mm am/pm)
- doOptions/include: Funciones de infraestructura restauradas

### Dashboard (js/dashboard.js)
- Fix: glucosa → glucometria
- Fix: String() wrapper para .trim()
- Filtros de fecha (Desde/Hasta)

### Frontend (index.html)  
- Inputs de fecha en Dashboard filters
- Columnas reordenadas: Empresa junto a Puesto

---

## [Fechas anteriores] - Historial Completo

### Refactor Codebase
- Estructura js/ y css/ creada
- Extraídos: data.js, auth.js, dashboard.js, pdf.js, ai.js, app.js
- index.html limpiado

### History Cards
- Agregado presión arterial y glucometría

### PDF Print View
- Fix XML tags inválidos en CSS
- Reglas @media print corregidas

### Profile Header
- SVG icons restaurados en app.js

### Program Selection Bug
- programasList restaurado en loadRecordForEdit

### Habits Section
- Estilos risk-card aplicados

### Admission Date Field
- Campo "Fecha de ingreso a la empresa" agregado
- Función updateFechaEmpresa creada
- Campos reordenados (Puesto primero)

### Company Seniority Field
- "Antigüedad en la Empresa" agregado
- Lógica de cálculo refactorizada

### Session Persistence
- checkSession() en DOMContentLoaded

### Search Feedback & Navigation
- "Orange Warning" restaurado
- Fix loop History → History

### Brigadistas Option
- Opción agregada a programaSelect

### Optimistic Save UI
- handleFormSubmit fire-and-forget
- UI reset inmediato

### Record Counter
- Total Records div agregado
- fetchRecordCount implementado

---

## Configuración
- `.agent/rules.md`: Reglas del proyecto
- Deployment actual: AKfycbxmeM_KDReSvWdBMDStPuDogPaZ7...

## Pendientes
- [ ] Contador de registros visible en header
- [ ] DSL de locks (opcional)
