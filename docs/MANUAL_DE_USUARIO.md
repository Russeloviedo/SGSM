# Manual de Usuario
## Sistema de Gestión y Seguimiento Nutricional
### Industrias Hunter, S. de R.L. de C.V.

---

## 1. Información General

### 1.1 ¿Qué es este sistema?
Es una aplicación web diseñada para el **registro, seguimiento y análisis de datos de salud ocupacional** de los empleados de Industrias Hunter. Permite capturar información antropométrica, generar observaciones clínicas automatizadas y visualizar estadísticas poblacionales.

### 1.2 Características Principales
| Función | Descripción |
|---------|-------------|
| Registro de Pacientes | Captura completa de datos personales, laborales y de salud |
| Evaluación Antropométrica | Peso, talla, IMC, composición corporal |
| Signos Vitales | Presión arterial, glucosa, temperatura, oximetría |
| Algoritmo Inteligente | Generación automática de observaciones clínicas |
| Dashboard Analítico | Gráficas y KPIs de la población |
| Exportación PDF | Ficha técnica individual del paciente |
| Cumplimiento Legal | Aviso de privacidad integrado (LFPDPPP) |

### 1.3 Requisitos Técnicos
- Navegador web moderno (Chrome, Edge, Firefox)
- Conexión a internet
- Resolución mínima: 1024x768 px

### 1.4 URL de Acceso
```
https://seguimientocronicodegenerativos.web.app
```

---

## 2. Acceso al Sistema

### 2.1 Inicio de Sesión
1. Abrir la URL en el navegador.
2. Ingresar **correo electrónico** autorizado.
3. Ingresar **contraseña**.
4. Hacer clic en **"Iniciar Sesión"**.

### 2.2 Sesión Activa
- La sesión permanece activa durante el uso.
- Se recomienda cerrar sesión al terminar (`Cerrar Sesión`).
- Por seguridad, la sesión puede expirar tras inactividad prolongada.

---

## 3. Registro de Pacientes (Formulario Principal)

El formulario está dividido en **6 pasos** para facilitar la captura ordenada de información.

---

### PASO 1: Identificación y Programa

| Campo | Descripción | Obligatorio |
|-------|-------------|-------------|
| Buscar Empleado | Búsqueda por nombre o número | Sí |
| Programas | Tipo de evaluación (Nuevo Ingreso, Rutinario, etc.) | Sí |

**Programas disponibles:**
- **Nuevo Ingreso:** Primera evaluación del empleado.
- **Rutinario:** Seguimiento periódico.
- **Enfermedad Crónica:** Pacientes con diagnósticos previos.
- **Vigilancia por Actividad de Trabajo:** Exposición a riesgos laborales.
- **Reintegro al Trabajo:** Post-incapacidad.
- **Aptitud Post Incapacidad:** Validación de capacidad laboral.

---

### PASO 2: Datos Personales

| Campo | Descripción | Formato |
|-------|-------------|---------|
| Núm. Empleado | Identificador único | Solo lectura |
| Nombre Completo | Nombre y apellidos | Texto |
| Género | Masculino / Femenino / Otro | Selector |
| Edad | Años cumplidos | Número (18-100) |
| Contacto | Teléfono o email | Texto |
| Lugar de Nacimiento | Ciudad, Estado | Texto |
| Estado Civil | Soltero, Casado, etc. | Selector |
| Escolaridad | Nivel de estudios | Selector |

#### Declaración del Operador (Obligatorio)
Antes de continuar, el operador **debe confirmar** que el paciente firmó el Aviso de Privacidad físico. Este checkbox es obligatorio y bloquea el avance si no se marca.

> **Texto del checkbox:**  
> "Confirmo que el paciente ha leído y firmado físicamente el Aviso de Privacidad, y ha otorgado su consentimiento expreso para la recolección de sus datos sensibles de salud."

**Enlace "Aviso de Privacidad":** Al hacer clic, se abre una ventana modal con el texto completo del aviso para consulta.

---

### PASO 3: Información Laboral

| Campo | Descripción |
|-------|-------------|
| Supervisor | Nombre del supervisor directo |
| Planta | Planta 1, 2, 3 o 4 |
| Área | Departamento o área de trabajo |
| Turno | Matutino, Vespertino, Nocturno, Mixto |
| Puesto | Cargo del empleado |
| Antigüedad | Tiempo en la empresa (años/meses) |

---

### PASO 4: Evaluación Nutricional y Médica

#### 4.1 Datos Antropométricos

| Campo | Unidad | Descripción |
|-------|--------|-------------|
| Peso | kg | Peso corporal |
| Altura | cm | Estatura |
| IMC | kg/m² | Calculado automáticamente |
| Circunferencia de Cintura | cm | Perímetro abdominal |
| Circunferencia de Cadera | cm | Perímetro de cadera |
| % Grasa Corporal | % | Medido con báscula de bioimpedancia |
| % Masa Muscular | % | Medido con báscula de bioimpedancia |
| Nivel Grasa Visceral | 1-59 | Indicador de grasa abdominal interna |

#### 4.2 Signos Vitales

| Campo | Unidad | Rango Normal |
|-------|--------|--------------|
| T/A Sistólica | mmHg | < 120 |
| T/A Diastólica | mmHg | < 80 |
| Glucometría | mg/dL | 70-99 |
| Temperatura | °C | 36.1 - 37.2 |
| Oximetría | % | 95-100 |
| Pulso | lpm | 60-100 |

#### Clasificación Automática del IMC
El sistema clasifica automáticamente según la OMS:

| Rango IMC | Clasificación | Color |
|-----------|---------------|-------|
| < 18.5 | Bajo Peso | Azul |
| 18.5 - 24.9 | Peso Normal | Verde |
| 25.0 - 29.9 | Sobrepeso | Amarillo |
| 30.0 - 34.9 | Obesidad Grado I | Naranja |
| 35.0 - 39.9 | Obesidad Grado II | Rojo |
| ≥ 40 | Obesidad Grado III | Rojo Oscuro |

---

### PASO 5: Hábitos y Riesgos

#### 5.1 Hábitos Nocivos

| Hábito | Opciones |
|--------|----------|
| Tabaquismo | Sí / No / Ex-fumador |
| Alcoholismo | Nunca / Ocasional / Frecuente |
| Drogas | Sí / No |
| Actividad Física | Sedentario / Moderado / Activo |

#### 5.2 Antecedentes Patológicos

Selección múltiple de enfermedades diagnosticadas:
- Alergias, Asma, Bronquitis
- Diabetes Mellitus I / II
- Hipertensión
- Neoplasias, Convulsiones
- TB, ITS, Covid-19
- Hepatitis, Tifoidea
- Cirugías previas, Quemaduras
- Otros (especificar)

#### 5.3 Factores de Riesgo Laboral

**Riesgos Físicos:**
- Ruido, Temperaturas extremas, Radiaciones, Vibraciones, Polvo

**Riesgos Químicos:**
- Solventes, Gases, Vapores, Humos metálicos, Pesticidas

**Riesgos Biológicos:**
- Exámenes de laboratorio requeridos según exposición

---

### PASO 6: Observaciones

#### Campo de Notas
Área de texto libre para observaciones adicionales del operador.

#### Botón "Ver Referencias Médicas"
Abre una ventana modal con las **fuentes científicas** utilizadas para las clasificaciones:

| Criterio | Fuente |
|----------|--------|
| IMC | Organización Mundial de la Salud (OMS) |
| Presión Arterial | American Heart Association (AHA) |
| Glucosa | American Diabetes Association (ADA) |
| Grasa Corporal | American Council on Exercise (ACE) |
| Grasa Visceral | Tanita Corporation |
| Masa Muscular | Journal of Applied Physiology |

#### Guardar Registro
Al finalizar, hacer clic en **"Guardar Registro"** para enviar los datos a la base de datos.

---

## 4. Algoritmo Inteligente de Observaciones

### 4.1 ¿Qué es?
Es un **sistema de apoyo a la decisión clínica (SADC)** que genera observaciones automáticas basándose en los datos ingresados.

### 4.2 ¿Cómo funciona?
1. El algoritmo analiza: IMC, presión arterial, glucosa, grasa corporal, masa muscular y grasa visceral.
2. Compara los valores contra **tablas médicas internacionales**.
3. Genera un texto con **hallazgos** y **recomendaciones**.

### 4.3 Criterios de Evaluación

#### Presión Arterial (AHA 2017)
| Sistólica | Diastólica | Estado |
|-----------|------------|--------|
| < 120 | < 80 | Normal |
| 120-129 | < 80 | Elevada |
| 130-139 | 80-89 | Hipertensión Etapa 1 |
| ≥ 140 | ≥ 90 | Hipertensión Etapa 2 |

#### Glucosa en Ayunas (ADA 2024)
| Valor (mg/dL) | Estado |
|---------------|--------|
| < 100 | Normal |
| 100-125 | Prediabetes |
| ≥ 126 | Diabetes |

#### Grasa Corporal (ACE)
Varía por **edad** y **género**. Ejemplo para hombres 18-39 años:
| % Grasa | Estado |
|---------|--------|
| < 8 | Bajo (Atleta) |
| 8-19 | Saludable |
| 20-24 | Aceptable |
| ≥ 25 | Alto |

#### Grasa Visceral (Tanita)
| Nivel | Estado |
|-------|--------|
| 1-9 | Normal |
| 10-14 | Alto |
| ≥ 15 | Muy Alto |

### 4.4 Ejemplo de Salida
> "Paciente de 35 años. Hallazgos: IMC Obesidad I (32.5), Hipertensión Etapa 1 (135/85), Grasa Corp. Alto (28%). Se sugiere reducción de peso, dieta baja en sodio, actividad física regular. Seguimiento mensual recomendado."

---

## 5. Dashboard Analítico

### 5.1 Acceso
Hacer clic en el botón **"Dashboard"** desde el menú principal.

### 5.2 Filtros Disponibles
| Filtro | Opciones |
|--------|----------|
| Planta | Todas, Planta 1-4 |
| Programa | Todos, Nuevo Ingreso, Rutinario, etc. |
| Género | Todos, Masculino, Femenino |

### 5.3 KPIs (Indicadores Clave)
- **Total de Registros**
- **Promedio de IMC**
- **% Obesidad**
- **% Hipertensión**

### 5.4 Gráficas
| Gráfica | Tipo | Descripción |
|---------|------|-------------|
| Distribución IMC | Dona | Categorías de peso |
| Por Género | Barras | Masculino vs Femenino |
| Por Programa | Barras horizontales | Distribución de programas |
| Por Planta | Barras | Comparativa entre plantas |
| Por Edad | Área | Distribución etaria |
| Glucosa | Dona | Normal/Prediabetes/Diabetes |
| Presión Arterial | Dona | Categorías de PA |
| Patologías | Barras | Enfermedades más frecuentes |

---

## 6. Exportación de PDF

### 6.1 Ficha Técnica del Paciente
Al visualizar un registro, se puede generar un **PDF** con:
- Datos personales
- Información laboral
- Medidas antropométricas
- Signos vitales
- Observaciones clínicas
- Fecha y hora de generación

### 6.2 Uso
1. Seleccionar un paciente.
2. Hacer clic en **"Generar PDF"**.
3. El archivo se descarga automáticamente.

---

## 7. Cumplimiento Legal

### 7.1 Aviso de Privacidad
El sistema incluye un **Aviso de Privacidad** conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).

**Responsable:** Industrias Hunter, S. de R.L. de C.V.  
**Domicilio:** C. Nordika #8615, Parque Industrial Nordica, Ejido Lazaro Cardenas, 22640 Tijuana, B.C.  
**Contacto ARCO:** serviciomedico.tijuana@hunter.global

### 7.2 Procedimiento de Consentimiento
1. El paciente lee y firma el Aviso de Privacidad **impreso**.
2. El operador archiva la hoja firmada en el **expediente físico**.
3. El operador marca el **checkbox de declaración** en el sistema.
4. Solo entonces se permite la captura de datos.

### 7.3 Datos Sensibles Recolectados
- Peso, talla, IMC
- Porcentaje de grasa corporal y masa muscular
- Nivel de grasa visceral
- Presión arterial, glucosa
- Antecedentes patológicos
- Hábitos personales

---

## 8. Preguntas Frecuentes (FAQ)

### ¿El sistema diagnostica enfermedades?
**No.** El sistema genera **observaciones de apoyo** basadas en criterios médicos. El diagnóstico final corresponde a un profesional de la salud.

### ¿Dónde se guardan los datos?
En una base de datos segura en Google Cloud (Google Sheets + Apps Script).

### ¿Quién tiene acceso a los datos?
Solo el personal autorizado del Servicio Médico de Industrias Hunter.

### ¿Qué hago si el sistema no carga?
1. Verificar conexión a internet.
2. Limpiar caché del navegador (Ctrl + Shift + Del).
3. Recargar la página (Ctrl + F5).
4. Si persiste, contactar al administrador del sistema.

### ¿Por qué no puedo avanzar al Paso 3?
Verifique que marcó el checkbox de "Declaración del Operador" en el Paso 2.

---

## 9. Glosario de Términos

| Término | Definición |
|---------|------------|
| **IMC** | Índice de Masa Corporal. Peso (kg) / Altura² (m). |
| **Bioimpedancia** | Técnica para medir composición corporal mediante corriente eléctrica. |
| **Grasa Visceral** | Grasa almacenada alrededor de órganos internos. |
| **T/A** | Tensión Arterial. Presión de la sangre en las arterias. |
| **Sistólica** | Presión cuando el corazón se contrae. |
| **Diastólica** | Presión cuando el corazón se relaja. |
| **Glucometría** | Medición de glucosa en sangre. |
| **Oximetría** | Medición de saturación de oxígeno en sangre. |
| **ARCO** | Derechos de Acceso, Rectificación, Cancelación y Oposición. |
| **LFPDPPP** | Ley Federal de Protección de Datos Personales en Posesión de los Particulares. |
| **SADC** | Sistema de Apoyo a la Decisión Clínica. |

---

## 10. Contacto y Soporte

**Administrador del Sistema:**  
📧 serviciomedico.tijuana@hunter.global

**Soporte Técnico:**  
Reportar errores o solicitar funciones nuevas al correo anterior.

---

**Versión del Manual:** 1.0  
**Fecha de Actualización:** Febrero 2026  
**Aplicación:** Sistema de Gestión y Seguimiento Nutricional - Industrias Hunter
