
# Guía para la Definición de Programas Médicos

Para que los flujos de la aplicación sean fáciles de entender y modificar, podemos dejar de usar "números de pasos" y empezar a usar **nombres lógicos**. Esto permitirá dar instrucciones mucho más claras y evitar errores al contar pasos.

## 1. Mapa de Pasos Disponibles

He definido estos nombres para cada sección del formulario:

| Nombre del Paso | Contenido del Formulario |
| :--- | :--- |
| `IDENTIDAD` | Número de empleado y búsqueda (Paso 0) |
| `PROGRAMA` | Selección del programa a realizar (Paso 1) |
| `PERSONALES` | Nombre, edad, género, contacto, aviso de privacidad (Paso 2) |
| `LABORAL` | Planta, puesto, antigüedad, supervisor, unidad de negocio (Paso 3) |
| `MEDICO` | Peso, talla, TA, IMC, Glucometría, Ginecología (Paso 4) |
| `HISTORIA` | Hábitos, antecedentes familiares, riesgos laborales (Paso 5) |
| `RESTRICCIONES`| Fechas, motivo y lista de actividades prohibidas (Paso 6) |
| `OBSERVACIONES`| Comentarios finales y firma del médico staff (Paso 7) |

---

## 2. Cómo dar instrucciones claras

Cuando necesites cambiar un programa o crear uno nuevo, simplemente dime qué nombres de la lista anterior debe llevar. 

**Ejemplo de instrucción ideal:**
> "Para el programa **Nuevo Ingreso**, necesito que pidas: PERSONALES, LABORAL, MEDICO, HISTORIA y OBSERVACIONES."

---

## 3. Mejora Técnica Propuesta

Si me das el visto bueno, puedo actualizar el código (`app.js`) para que use estos nombres internos. Esto hará que el sistema sea mucho más profesional:

```javascript
// Ejemplo de cómo quedaría el código mejorado:
const PROGRAM_REQUIREMENTS = {
    'Brigadistas': [S.PERSONALES, S.MEDICO, S.OBSERVACIONES],
    'Actividades restringidas': [S.PERSONALES, S.LABORAL, S.RESTRICCIONES, S.OBSERVACIONES]
};
```

**¿Te gustaría que aplique este cambio al código para que tus futuras instrucciones sean procesadas con mayor precisión?**
