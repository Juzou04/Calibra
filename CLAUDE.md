# Calibra

Prototipo web del curso ISIS2007 (Diseño de Productos, Uniandes, 2026-20). Conecta estudiantes de pregrado con monitores de materias de ciclo básico. El diferenciador es una prueba de opción múltiple calibrada: cada opción incorrecta delata un error conceptual, así que el resultado dice en qué subtema falla el estudiante y le da al monitor un brief de la sesión.

Equipo: Lorenzo, Juan David Acevedo (GitHub `UsuarioGithubJD-Acevedo`), Juan David Chávez (`Juzou`) y David (`dvarela5101`). Repositorio: `github.com/dvarela5101/Calibra`.

Primera entrega con jurados: miércoles 23 de septiembre de 2026, 11:59 a. m. Exige link público funcional, video demo de máximo 2 minutos y evidencia de entrevistas.

## Antes de tocar nada

Lee, en este orden: `esquema.md` (arquitectura y decisiones, rama `main`), `tareas/integracion-final.md` (qué falta para publicar) y `BRIEF.md` (especificación original del producto, textos de pantalla incluidos).

## Ramas

| Rama | Qué tiene |
| --- | --- |
| `main` | La rama de producción y la rama por defecto en GitHub. Al 17 de septiembre tenía todo: Partes 1 a 4, el arreglo responsive y los teléfonos con el correo de confirmación (PR #6 y #7). Desde entonces trae también el diagnóstico por knowledge components (`prueba-cuestionario`) y los bloques de código de Introducción a la Programación. El trabajo del 21 de septiembre (agenda, documentos) sigue sin commitear en `dvarela5101`. |
| `juzou` | La rama de trabajo de Juan David Chávez, al día con `main`. Antes se llamaba `juzouy`; al renombrarla, `origin/juzouy` quedó borrada y `origin/juzou` apuntando a una foto vieja de `main`, lo que se arregló el 17 de septiembre. Todo lo suyo ya está en `main`. |
| `dvarela5101` | La Parte 2: `contenido/convertir.js --supabase`. Ya está dentro de `main`. |
| `prueba-cuestionario` | Diagnóstico por knowledge components. **Ya está fusionada en `main`** (comprobado el 21 de septiembre con `git merge-base --is-ancestor`). |

## Cómo está armado

- `index.html` es la app entera: HTML, CSS y JS en un solo archivo, sin build ni frameworks. Se abre con doble clic.
- `contenido/*.md` tiene las materias, una por archivo. `contenido/convertir.js` las vuelca al arreglo `MATERIAS` dentro de `index.html` (`--escribir`) o a Supabase (`--supabase`, ya en `main`). Las preguntas no se editan en el HTML. Lee `contenido/README.md` para el formato.
- `supabase/schema.sql` es el contrato de la base: 13 tablas (las 10 de contenido, monitores y captura, más `estudiantes`, `franjas` y `citas`), RLS y privilegios. Los archivos sueltos `supabase-schema.sql` y `supabase-seed-data.sql` que aparecen en algunas copias locales son un borrador viejo con otras columnas; no se usan.
- `verificar.js` es el arnés de pruebas con Playwright. Recorre los flujos a 390x844 y hizo 522 comprobaciones el 21 de septiembre (1 falla de red, la misma que sale en `HEAD`), antes del cambio de franjas: ver "Citas y franjas".

## Comandos

```bash
verificar.cmd                     # arnés completo; sale con 1 si algo falla
verificar.cmd --solo=supabase     # un bloque: fuente, capturas, oraculo, monitor, adaptativo, barajado, buscar, perfil, robustez, supabase
node contenido/convertir.js       # revisa el contenido sin escribir nada
```

`verificar.cmd` apunta a un Playwright 1.61.1 global en `%APPDATA%\npm\node_modules`, que **no existe** en esta máquina (comprobado el 21 de septiembre), así que tal cual no corre. Hay una copia en `%LOCALAPPDATA%\Temp\calibra-mate\node_modules`: en PowerShell, `$env:NODE_PATH = "$env:LOCALAPPDATA\Temp\calibra-mate\node_modules"; node verificar.js`. No hay `@playwright/test` y solo está descargado Chromium. El bloque de Supabase necesita internet para bajar `supabase-js` del CDN.

## Supabase en `index.html`

- Credenciales en `SUPABASE_URL` y `SUPABASE_ANON_KEY`, bloque "1b. Supabase" al inicio del `<script>`. Desde el 17 de septiembre están puestas: proyecto `uotlhaitdkfroavqkvee` y una `publishable key` (`sb_publishable_…`, el reemplazo de la anon key en el sistema nuevo de llaves). Son públicas por diseño. Vacías, la app no toca la red y usa los datos del archivo. La llave secreta (`sb_secret_…`) nunca va en el repo.
- Estado en `window.__calibraSupabaseEstado`: `demo`, `cargando`, `conectado` o `sin-conexion`.
- Al arrancar lee 9 tablas con un tope de 8 s: las 5 de siempre (`materias`, `subtemas`, `preguntas`, `opciones`, `monitores`), las 3 del diagnóstico por knowledge components y `franjas` (esta última tolerante: si falla no tumba el resto). Si falla, sigue con el archivo. Las materias se emparejan por `codigo`.
- Escribe en `leads` (cada correo), `monitores` (publicar perfil) y `resultados_diagnostico` (fin de la prueba), y llama a las RPC `reservar_franja` (crea el estudiante y la cita) y `publicar_franjas` (ver "Citas y franjas"). Los inserts van sin `.select()`: RLS no deja leer `leads` ni `resultados_diagnostico`, y pedir la fila de vuelta haría fallar el insert.
- Teléfonos y correo de confirmación (17 de septiembre): `leads` lleva `telefono`, `monitor_id`, `sesion_id` y `correo_enviado_en`; `resultados_diagnostico` lleva `sesion_id`; `monitores` lleva `clave`. `estado.sesionId` es un uuid de `crypto.randomUUID()` que ata el diagnóstico con el correo que la misma persona deja después. El teléfono del monitor NO va en `monitores` (tiene lectura pública y quedaría descargable con la llave del HTML): va en `leads`, y se llega a él por `monitores.clave` = `leads.sesion_id` con `rol = 'monitor'`.
- El correo de confirmación lo manda la Edge Function `supabase/functions/enviar-correo`, disparada por un Database Webhook en `insert` sobre `citas` (antes era `leads`; hay que borrar o mover el webhook viejo). Tiene que vivir fuera de `index.html`: la llave del navegador es anónima y no puede leer `leads` ni `resultados_diagnostico`. Es la única pieza con backend del proyecto.
- `leads.rol` solo admite `estudiante` y `monitor`. La app manda `monitor-evaluacion` como `monitor`, y no guarda los correos del canal profesor.
- Las pruebas simulan un proyecto con `window.__calibraSupabase = { url, anonKey }` e interceptan la API REST. Con credenciales reales, el arnés deja pasar las lecturas pero retiene las escrituras, para no llenar la base de datos de prueba.

## Citas y franjas (21 de septiembre, migración 004)

- `sesion_id` en `leads` y `resultados_diagnostico` es el id del NAVEGADOR (uuid de `nuevaSesionId()`, se renueva al reiniciar). No es una cita. La cita vive en `citas`.
- `franjas` (lectura pública): horas concretas de cada monitor, `unique (monitor_id, inicia_en)`, 1 h. `estudiantes` y `citas` no tienen SELECT público. `citas.franja_id` es único: la base impide reservar dos veces una franja.
- Todo pasa por dos funciones `security definer`: `reservar_franja(franja, correo, telefono, sesion_id)` (atómica; ata los diagnósticos del navegador al estudiante y crea la cita; devuelve `ok` o `motivo`: `ocupada`, `pasada`, `no_existe`, `correo`) y `publicar_franjas(clave, franjas)` (máx. 20 por llamada). La vista `brief_cita` solo la lee `service_role`.
- `index.html`: lee `franjas` como novena tabla (tolerante: sin la migración 004 responde 404 y todo sigue con los horarios de texto). Un monitor que publicó franjas ofrece SOLO las libres, aunque no quede ninguna (`usaFranjas`); si volviera a los horarios de texto se podría agendar una hora que nada bloquea. E6 llama a `reservar_franja` y, si la hora ya no está, vuelve a E5 con aviso. Monitores de ejemplo y sin franjas conservan los horarios de texto y NO bloquean nada.
- Limitación conocida: `monitores.clave` es pública, así que quien la lea puede publicar franjas de ese monitor. Cerrarlo exige login.
- El cambio del 21 de septiembre NO pasó por `verificar.cmd` (se pidió no usar Playwright). El arnés casi seguro necesita ajuste: `#perfil-horario-1/2` ahora son `datetime-local` (un `fill` de texto libre falla) y `pintarCrearPerfil` ya no precarga esos campos.

## Reglas del producto que no se negocian

- Un solo `index.html`, sin build. La única dependencia externa además de Google Fonts es `supabase-js`, y solo se descarga si hay credenciales.
- Nada de `localStorage` ni `sessionStorage`. El arnés busca la palabra en el fuente, incluidos los comentarios.
- Sin barra inferior. Desde el 21 de septiembre el logo de arriba a la izquierda (`#btn-reiniciar`) es el botón que reinicia y lleva al inicio, visible en todas las pantallas; el pie "Prototipo · datos de ejemplo" y el pill "Empezar de nuevo" se quitaron. El chequeo `logoInicio` del arnés lo exige.
- Nunca mostrar cifras de comisión; el porcentaje está sin validar.
- Ningún texto por debajo de 14 px, áreas táctiles de 44 px o más, sin degradados, sin emojis decorativos, sin iconos de cerebro, robot o IA.
- La paleta tiene variantes de texto (`--alert-text`, `--success-text`, `--muted` en `#636F81`) porque los colores del brief no pasan WCAG AA como texto. Los hex originales se usan solo como relleno.

## Trampas conocidas

- En Windows, `index.html` y `verificar.js` salen con finales de línea CRLF (`core.autocrlf=true`). Un script que parchee por texto tiene que normalizar a LF antes de buscar y devolver el final de línea original al escribir.
- La tabla oráculo de `verificar.js` describe las 4 preguntas originales del brief (p1 a p4 de Cálculo Integral). Esos bloques fuerzan `longitud: 4`; el resto del arnés usa la longitud real de 12.
- El flujo del monitor pasa por M2.5 (`#monitor-correo`) antes de la certificación. No hay botón directo de M2 a M3.
- Si un chequeo de texto falla por mencionar algo en un comentario, cambia el comentario antes de aflojar el chequeo.

## Qué está verificado

Corrido el 16 de septiembre sobre `juzouy` consolidada:

- `verificar.cmd`: 416 comprobaciones, 416 OK, exit 0.
- Los tres inserts de la Parte 3 contra un Postgres real (PGlite con `supabase/schema.sql` y los roles de Supabase): 26 de 26 casos como se esperaba. La base acepta los payloads tal como los arma `index.html` y rechaza lo que debe: `rol` `profesor`, `RETURNING *` como anon, y `update`/`delete` en `monitores`.
- `convertir.js --supabase --dry-run`: 7 materias, 31 subtemas, 84 preguntas y 336 opciones, con los códigos que `index.html` empareja.
- Abrir `index.html` con doble clic (`file://`): sin errores, en modo demo y conectado.

Corrido el 17 de septiembre sobre `main`, con las credenciales reales ya puestas y los bloques `fuente,capturas,monitor,perfil,buscar,robustez,supabase`:

- 362 comprobaciones, 359 OK, 3 fallas. Las tres son el mismo síntoma: el proyecto `uotlhaitdkfroavqkvee` existe pero todavía no tiene tablas, así que las cinco lecturas responden 404. Los 105 errores de consola son todos `Failed to load resource … 404`; ninguno es de JavaScript. Vuelven a verde en cuanto se corra `schema.sql`.
- Pasan los chequeos que el cambio del teléfono podía romper: `escritura · solo envia columnas que existen en supabase/schema.sql`, los cinco de payload de inserts, `el formulario en modo demo agradece y no llama a la red` y `demo · sin credenciales no muestra carga ni llama a Supabase ni al CDN`.
- El arnés retuvo 21 escrituras: ni un correo de prueba llegó a la base real.

La migración 001, sobre PGlite con el `schema.sql` anterior como base de partida: aplica sin error, no borra datos, deja las 6 columnas nuevas nullable con su llave foránea, `verificar.sql` da 53 filas en OK, `anon` sigue sin poder leer `leads.telefono`, un `monitor_id` inexistente sí tumba el insert (por eso la app manda `null` con los monitores de ejemplo) y repetirla no rompe nada.

Lo que NO está verificado: el correo de la Edge Function. Hace falta el proyecto con tablas y una cuenta de Resend con dominio verificado.

## `prueba-cuestionario` (ya fusionada)

La rama ya está en `main`. Los dos arreglos que pedía la fusión (`PREGUNTAS_POR_MATERIA` con `>=` en `verificar.js` y la lectura de las tres tablas de habilidades en `cargarDesdeSupabase`) ya están hechos: `index.html` lee 9 tablas y `usaKc()` funciona con credenciales reales.

Sigue vigente la advertencia sobre el esquema: `supabase/schema.sql` empieza con `drop table ... cascade`. Re-ejecutarlo sobre un proyecto con datos borra los correos, los diagnósticos y las citas. Sobre una base viva solo se corren las migraciones aditivas de `supabase/migraciones/`.

## Pendientes al 21 de septiembre

- **La base está al día:** el proyecto `uotlhaitdkfroavqkvee` tiene las migraciones 001 a 004 corridas, el contenido de las 8 materias subido con `--borradores` y datos reales (18 diagnósticos, todos con `sesion_id`). No correr `schema.sql` sobre él. La reserva se probó en SQL y desde la app.
- **`kcs` sale `NULL`** en los diagnósticos de Cálculo Integral que ya estaban guardados. Las tablas de habilidades sí tienen datos (18 kc, 58 misconcepciones, 59 filas en `pregunta_kc`), así que falta comprobar si son filas anteriores a que la app leyera esas tablas o si también pasa con una prueba nueva.
- **Commitear y publicar:** el trabajo del 21 de septiembre (agenda, migración 004, Edge Function, documentos) está sin commitear en `dvarela5101`. La fusión con `main` se probó y sale sin conflictos. Falta el PR y publicar en Vercel (preset "Other", sin build, rama `main`), o `npx vercel --prod` si no hay permisos de admin sobre el repo.
- **Correo de confirmación:** desplegar la Edge Function `enviar-correo` y crear el webhook sobre `citas` (`supabase/functions/enviar-correo/README.md`). Resend solo manda a terceros desde un dominio verificado; sin dominio, el correo solo llega a la cuenta dueña de la llave. La reserva y el bloqueo no dependen del correo.
- **Ajustar `verificar.js`** y volver a correrlo completo: el cambio de franjas no se probó con el arnés y casi seguro lo rompe (`#perfil-horario-1/2` ahora son `datetime-local`).
- **Agenda parcial:** solo bloquean horas los monitores que están en la base y publicaron franjas. Los de ejemplo del archivo siguen con horarios de texto, que nada bloquea.
- **`monitores.presentacion`:** la migración 002 está corrida, pero la app todavía no pide esa columna en su lectura de `monitores`.
- M2 todavía dice "Por ahora solo está abierta Cálculo Integral", pero hay 8 materias activas.
- Los códigos FISI-1018, FISI-1019, MATE-1203 e ISIS-1221 no están confirmados contra un programa oficial del curso.
- No hay ni una línea de privacidad ni de autorización de tratamiento de datos, y ya se guardan correos y teléfonos. Para un piloto con estudiantes de verdad conviene ponerla.
