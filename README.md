# Calibra · prototipo navegable

Prototipo de validación de Calibra: 15 pantallas, sin cuentas y sin pagos. La base de datos es Supabase y hay una Edge Function para el correo de confirmación. La aplicación entera vive en `index.html`; el contenido de las materias vive en `contenido/`.

1. **Abrirlo.** Doble clic en `index.html`. No necesita servidor ni instalar nada. Sin credenciales de Supabase o sin internet usa los datos del archivo (la letra cambia y nada más); con credenciales lee y escribe en Supabase.
2. **Publicarlo con GitHub Pages.** Sube la carpeta a un repositorio, entra en Settings, Pages, y elige la rama `main` con la carpeta raíz. La URL queda lista en un par de minutos.
3. **Publicarlo con Netlify Drop.** Arrastra la carpeta a [app.netlify.com/drop](https://app.netlify.com/drop). Da una URL al instante y no pide cuenta.
4. **Recoger correos.** Con Supabase conectado, cada correo se guarda en la tabla `leads`, y reservar una hora crea la cita en `citas`. `FORM_ENDPOINT` sigue existiendo como canal alterno: vacío, no envía nada.
5. **Cambiar materias o preguntas.** No se editan en `index.html`: viven en `contenido/`, un archivo Markdown por materia. Se llenan ahí y se corre `node contenido/convertir.js --escribir`. Las instrucciones están en `contenido/README.md`.
6. **Explorar sin hacer la prueba.** Desde el inicio se puede ir directo a la lista de monitores y filtrar por materia, subtema, precio y nivel. La prueba dejó de ser obligatoria.
7. **Crear perfil de monitor.** Quien certifica arma su perfil y aparece de inmediato en la lista que ve el estudiante.
8. **Verificarlo.** `verificar.cmd` recorre los dos flujos en Chromium a 390x844, guarda las capturas en `capturas/` y falla si algo se rompe. Última corrida completa: 522 comprobaciones el 21 de septiembre; el cambio de franjas de ese día todavía no se ha probado con el arnés.

## Base de datos (Supabase)

El MVP mueve la persistencia a Supabase: materias, subtemas, preguntas y sus errores, monitores, resultados de diagnóstico, los correos capturados y la agenda (estudiantes, franjas de los monitores y citas). El esquema completo y las instrucciones están en **[`supabase/README.md`](supabase/README.md)**; el contrato de datos, en [`esquema.md`](esquema.md).

**Credenciales.** La `Project URL` y la `anon public key` las tiene quien creó el proyecto en la Parte 1. La `Project URL` y la `publishable key` ya están en `supabase/README.md` y en `index.html`: son públicas por diseño y van al repo a propósito. La llave secreta (`sb_secret_…`, solo la necesita `contenido/convertir.js` y la Edge Function) se reparte por chat privado y no va al repositorio.

## Tres cosas que se apartan del brief

Las tres son de accesibilidad y se decidieron con el contraste medido, no a ojo:

- Las etiquetas van a 14px. El brief pide 13px en la sección 5 y prohíbe bajar de 14px en la sección 4, así que gana el mínimo.
- El texto suave pasa de `#6B7789` a `#636F81`. El original da 4,46:1 sobre el fondo crema y WCAG AA pide 4,5:1.
- El rojo y el verde conservan los hex del brief como relleno de barra, donde el umbral es 3:1 y sí pasan. Para texto se usan `#C62A2F` y `#0B7A44`, porque `#E5484D` da 3,84:1 y `#0F9D58` da 3,45:1.

Queda sin corregir el borde `#DDE3EC`, que da 1,27:1 contra el fondo. Arreglarlo cambiaría el sistema visual entero.

## Lo que no está probado

La verificación corre sobre Chromium, que es el único navegador descargado en esta máquina. A 390x844 emula el tamaño de un iPhone, no el motor de Safari. Antes de la sustentación conviene abrirlo una vez en un iPhone real.
