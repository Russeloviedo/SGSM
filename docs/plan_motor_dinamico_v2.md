# Plan Técnico: Motor de Flujo Dinámico V2

Este documento detalla la arquitectura y el plan de implementación para hacer que el sistema de gestión nutricional sea 100% dinámico y adaptable a cada programa médico.

## 1. Nomenclatura de Etiquetas (data-programs)

Cada campo (`form-group`) en el HTML tendrá un atributo `data-programs` que especifica para qué programas es visible.

| Código | Programa |
| :--- | :--- |
| **`cd`** | Cronico Degenerativos |
| **`so`** | Salud Ocupacional |
| **`ar`** | Actividades restringidas |
| **`b`**  | Brigadistas |
| **`ni`** | Nuevo ingreso |
| **`*`**  | Universal (Visible en todos los programas activos) |

**Ejemplo de implementación:**
```html
<div class="form-group" data-programs="cd ni">
    <label>Glucometría (mg/dL)</label>
    <input type="number" name="glucometria">
</div>
```

---

## 2. Re-numeración Dinámica de Pasos

El sistema eliminará los saltos en la barra de progreso. Si un programa usa los pasos técnicos (IDs) 0, 2 y 6, el usuario verá en la interfaz:
- **Paso 0** (Inicio)
- **Paso 1** (Selección)
- **Paso 2** (Datos Personales) -> *ID Técnico 2*
- **Paso 3** (Restricciones) -> *ID Técnico 6*
- **Paso 4** (Observaciones) -> *ID Técnico 7*

---

## 3. Lógica de Visualización (app.js)

### Filtro de Pasos
La función `getEnabledSteps()` continuará identificando qué secciones (clases `.form-step`) deben habilitarse según la selección del usuario.

### Filtro de Campos (Deep Filtering)
Al mostrar un paso mediante `showStep()`, el sistema ejecutará:
1. Identificar el código del programa actual (ej: `ar`).
2. Recorrer todos los elementos con la clase `.form-group` dentro del paso actual.
3. Si el elemento tiene `data-programs` y el código actual no está incluido (y no es `*`), se aplica `display: none`.
4. En caso contrario, se aplica `display: block`.

---

## 4. Beneficios Esperados
- **Interfaz Limpia**: El usuario solo ve los campos estrictamente necesarios para el programa que está trabajando.
- **Flujo Fluido**: No hay confusión por "saltos" de paso (ej. pasar del 3 al 6).
- **Escalabilidad**: Para añadir un nuevo programa, solo se define su código y se etiqueta el HTML, sin tocar la lógica central del programa.

---
**Estado del Plan:** Aprobado por el usuario.
**Implementación:** Pendiente (A realizar en una fase futura).
