# Fondos Dinámicos Diarios

Este sistema cambia automáticamente el fondo de la aplicación cada día del mes.

## Cómo Funciona

- El sistema detecta el día del mes actual (1-31)
- Carga automáticamente la imagen correspondiente de la carpeta `backgrounds/`
- Ejemplo: Si hoy es 28 de enero, cargará `backgrounds/28.jpg`

## Configuración de Imágenes

### Nombres de Archivo
Las imágenes deben nombrarse con números del 1 al 31:
```
1.jpg
2.jpg
3.jpg
...
28.jpg
29.jpg
30.jpg
31.jpg
```

### Dimensiones Recomendadas
- **Resolución:** 1920 x 1080 píxeles (Full HD)
- **Proporción:** 16:9
- **Formato:** JPG o WebP
- **Peso:** 200-500 KB (optimizado)
- **Calidad:** 75-85%

### Alternativas de Resolución
- **2K:** 2560 x 1440 px (mejor calidad, archivos más pesados)
- **Responsive:** 1920 x 1200 px (mejor adaptación a diferentes pantallas)

## Optimización de Imágenes

Antes de subir las imágenes, optimízalas con:
- **TinyPNG:** https://tinypng.com/
- **Squoosh:** https://squoosh.app/
- **ImageOptim:** (para Mac)

## Notas Importantes

1. **Todas las imágenes deben estar en formato JPG** (o cambiar la extensión en el código)
2. **Deben existir 31 imágenes** para cubrir todos los días del mes
3. Si falta una imagen, el navegador mostrará el color de fondo por defecto
4. Las imágenes se cargan con un overlay oscuro (80% de opacidad) para mejorar la legibilidad del texto

## Cambiar el Formato de Imagen

Si prefieres usar PNG o WebP, edita la línea 38 en `index.html`:
```javascript
const backgroundUrl = `url('backgrounds/${dayOfMonth}.png')`;  // Para PNG
const backgroundUrl = `url('backgrounds/${dayOfMonth}.webp')`; // Para WebP
```

## Ejemplo de Estructura
```
/Gestion y Seguimiento Nutricional/
  ├── backgrounds/
  │   ├── 1.jpg
  │   ├── 2.jpg
  │   ├── 3.jpg
  │   ...
  │   ├── 29.jpg
  │   ├── 30.jpg
  │   └── 31.jpg
  ├── index.html
  └── index.css
```
