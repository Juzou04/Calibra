# Calibra · prototipo navegable

Prototipo de validación de Calibra: 14 pantallas, sin backend, sin cuentas y sin pagos. La aplicación entera vive en `index.html`; el contenido de las materias vive en `contenido/`.

1. **Abrirlo.** Doble clic en `index.html`. No necesita servidor, internet ni instalar nada. Si no hay internet, la letra cambia y nada más.
2. **Publicarlo con GitHub Pages.** Sube la carpeta a un repositorio, entra en Settings, Pages, y elige la rama `main` con la carpeta raíz. La URL queda lista en un par de minutos.
3. **Publicarlo con Netlify Drop.** Arrastra la carpeta a [app.netlify.com/drop](https://app.netlify.com/drop). Da una URL al instante y no pide cuenta.
4. **Recoger correos.** Busca `const FORM_ENDPOINT = "";` al inicio del `<script>` y pega ahí la URL de tu formulario de Formspree. Vacío, la demo agradece igual y no envía nada.
5. **Cambiar materias o preguntas.** No se editan en `index.html`: viven en `contenido/`, un archivo Markdown por materia. Se llenan ahí y se corre `node contenido/convertir.js --escribir`. Las instrucciones están en `contenido/README.md`.
6. **Explorar sin hacer la prueba.** Desde el inicio se puede ir directo a la lista de monitores y filtrar por materia, subtema, precio y nivel. La prueba dejó de ser obligatoria.
7. **Crear perfil de monitor.** Quien certifica arma su perfil y aparece de inmediato en la lista que ve el estudiante.
8. **Verificarlo.** `verificar.cmd` recorre los dos flujos en Chromium a 390x844, guarda las capturas en `capturas/` y falla si algo se rompe. Última corrida: 368 de 368.

## Tres cosas que se apartan del brief

Las tres son de accesibilidad y se decidieron con el contraste medido, no a ojo:

- Las etiquetas van a 14px. El brief pide 13px en la sección 5 y prohíbe bajar de 14px en la sección 4, así que gana el mínimo.
- El texto suave pasa de `#6B7789` a `#636F81`. El original da 4,46:1 sobre el fondo crema y WCAG AA pide 4,5:1.
- El rojo y el verde conservan los hex del brief como relleno de barra, donde el umbral es 3:1 y sí pasan. Para texto se usan `#C62A2F` y `#0B7A44`, porque `#E5484D` da 3,84:1 y `#0F9D58` da 3,45:1.

Queda sin corregir el borde `#DDE3EC`, que da 1,27:1 contra el fondo. Arreglarlo cambiaría el sistema visual entero.

## Lo que no está probado

La verificación corre sobre Chromium, que es el único navegador descargado en esta máquina. A 390x844 emula el tamaño de un iPhone, no el motor de Safari. Antes de la sustentación conviene abrirlo una vez en un iPhone real.
