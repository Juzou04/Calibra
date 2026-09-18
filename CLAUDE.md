# Calibra

Prototipo web del curso ISIS2007 (Diseño de Productos, Uniandes, 2026-20). Conecta estudiantes de pregrado con monitores de materias de ciclo básico. El diferenciador es una prueba de opción múltiple calibrada: cada opción incorrecta delata un error conceptual, así que el resultado dice en qué subtema falla el estudiante y le da al monitor un brief de la sesión.

Equipo: Lorenzo, Juan David Acevedo (GitHub `UsuarioGithubJD-Acevedo`), Juan David Chávez (`Juzou`) y David (`dvarela5101`). Repositorio: `github.com/dvarela5101/Calibra`.

Primera entrega con jurados: miércoles 23 de septiembre de 2026, 11:59 a. m. Exige link público funcional, video demo de máximo 2 minutos y evidencia de entrevistas.

## Antes de tocar nada

Lee, en este orden: `esquema.md` (arquitectura y decisiones, rama `main`), `tareas/integracion-final.md` (qué falta para publicar) y `BRIEF.md` (especificación original del producto, textos de pantalla incluidos).

## Ramas

| Rama | Qué tiene |
| --- | --- |
| `main` | La rama de producción y la rama por defecto en GitHub. Al 17 de septiembre tiene todo: Partes 1 a 4, el arreglo responsive y los teléfonos con el correo de confirmación (PR #6 y #7). |
| `juzou` | La rama de trabajo de Juan David Chávez, al día con `main`. Antes se llamaba `juzouy`; al renombrarla, `origin/juzouy` quedó borrada y `origin/juzou` apuntando a una foto vieja de `main`, lo que se arregló el 17 de septiembre. Todo lo suyo ya está en `main`. |
| `dvarela5101` | La Parte 2: `contenido/convertir.js --supabase`. Ya está dentro de `main`. |
| `prueba-cuestionario` | Experimento de diagnóstico por knowledge components. Evaluado el 16 de septiembre, ver más abajo. Sin fusionar. |

## Cómo está armado

- `index.html` es la app entera: HTML, CSS y JS en un solo archivo, sin build ni frameworks. Se abre con doble clic.
- `contenido/*.md` tiene las materias, una por archivo. `contenido/convertir.js` las vuelca al arreglo `MATERIAS` dentro de `index.html` (`--escribir`) o a Supabase (`--supabase`, rama `dvarela5101`). Las preguntas no se editan en el HTML. Lee `contenido/README.md` para el formato.
- `supabase/schema.sql` (rama `main`) es el contrato de la base: 7 tablas, RLS y privilegios. Los archivos sueltos `supabase-schema.sql` y `supabase-seed-data.sql` que aparecen en algunas copias locales son un borrador viejo con otras columnas; no se usan.
- `verificar.js` es el arnés de pruebas con Playwright. Recorre los flujos a 390x844 y hoy hace 416 comprobaciones.

## Comandos

```bash
verificar.cmd                     # arnés completo; sale con 1 si algo falla
verificar.cmd --solo=supabase     # un bloque: fuente, capturas, oraculo, monitor, adaptativo, barajado, buscar, perfil, robustez, supabase
node contenido/convertir.js       # revisa el contenido sin escribir nada
```

`verificar.cmd` usa el Playwright 1.61.1 instalado globalmente en esta máquina, vía `NODE_PATH`. No hay `@playwright/test` y solo está descargado Chromium. El bloque de Supabase necesita internet para bajar `supabase-js` del CDN.

## Supabase en `index.html`

- Credenciales en `SUPABASE_URL` y `SUPABASE_ANON_KEY`, bloque "1b. Supabase" al inicio del `<script>`. Desde el 17 de septiembre están puestas: proyecto `uotlhaitdkfroavqkvee` y una `publishable key` (`sb_publishable_…`, el reemplazo de la anon key en el sistema nuevo de llaves). Son públicas por diseño. Vacías, la app no toca la red y usa los datos del archivo. La llave secreta (`sb_secret_…`) nunca va en el repo.
- Estado en `window.__calibraSupabaseEstado`: `demo`, `cargando`, `conectado` o `sin-conexion`.
- Al arrancar lee las 5 tablas legibles con un tope de 8 s. Si falla, sigue con el archivo. Las materias se emparejan por `codigo`.
- Escribe en `leads` (cada correo), `monitores` (publicar perfil) y `resultados_diagnostico` (fin de la prueba). Los inserts van sin `.select()`: RLS no deja leer `leads` ni `resultados_diagnostico`, y pedir la fila de vuelta haría fallar el insert.
- Teléfonos y correo de confirmación (17 de septiembre): `leads` lleva `telefono`, `monitor_id`, `sesion_id` y `correo_enviado_en`; `resultados_diagnostico` lleva `sesion_id`; `monitores` lleva `clave`. `estado.sesionId` es un uuid de `crypto.randomUUID()` que ata el diagnóstico con el correo que la misma persona deja después. El teléfono del monitor NO va en `monitores` (tiene lectura pública y quedaría descargable con la llave del HTML): va en `leads`, y se llega a él por `monitores.clave` = `leads.sesion_id` con `rol = 'monitor'`.
- El correo de confirmación lo manda la Edge Function `supabase/functions/enviar-correo`, disparada por un Database Webhook en `insert` sobre `leads`. Tiene que vivir fuera de `index.html`: la llave del navegador es anónima y no puede leer `leads` ni `resultados_diagnostico`. Es la única pieza con backend del proyecto.
- `leads.rol` solo admite `estudiante` y `monitor`. La app manda `monitor-evaluacion` como `monitor`, y no guarda los correos del canal profesor.
- Las pruebas simulan un proyecto con `window.__calibraSupabase = { url, anonKey }` e interceptan la API REST. Con credenciales reales, el arnés deja pasar las lecturas pero retiene las escrituras, para no llenar la base de datos de prueba.

## Reglas del producto que no se negocian

- Un solo `index.html`, sin build. La única dependencia externa además de Google Fonts es `supabase-js`, y solo se descarga si hay credenciales.
- Nada de `localStorage` ni `sessionStorage`. El arnés busca la palabra en el fuente, incluidos los comentarios.
- Pie "Prototipo · datos de ejemplo" visible en todas las pantallas.
- Nunca mostrar cifras de comisión; el porcentaje está sin validar.
- Ningún texto por debajo de 14 px, áreas táctiles de 44 px o más, sin degradados, sin emojis decorativos, sin iconos de cerebro, robot o IA.
- La paleta tiene variantes de texto (`--alert-text`, `--success-text`, `--muted` en `#636F81`) porque los colores del brief no pasan WCAG AA como texto. Los hex originales se usan solo como relleno.

## Trampas conocidas

- En Windows, `index.html` sale con finales de línea CRLF (`core.autocrlf=true`) y `verificar.js` con LF. Un script que parchee por texto tiene que normalizar a LF antes de buscar y devolver el final de línea original al escribir.
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

Lo que NO está verificado: el correo de la Edge Function (hace falta un proyecto con tablas y una cuenta de Resend) y la migración 001, que no se ha ejecutado contra ningún Postgres.

## Si se va a fusionar `prueba-cuestionario`

Se probó la fusión en un worktree aislado. Entra sin conflictos y el JS queda válido, pero hacen falta dos arreglos antes:

1. `verificar.js` exige exactamente 12 preguntas por materia y esa rama lleva Cálculo Integral a 51. Son cuatro comparaciones (`PREGUNTAS_POR_MATERIA`) que pasan de `===` a `>=`, y dos textos. Sin eso el arnés queda en 424 de 428.
2. Con credenciales reales, el diagnóstico por knowledge components se apaga solo: `cargarDesdeSupabase` lee 5 tablas y no las tres nuevas (`knowledge_components`, `misconcepciones`, `pregunta_kc`), así que `usaKc()` da falso y la app vuelve al diagnóstico viejo. Los datos sí estarían en la base, porque `convertir.js` los sube.

Además, el `schema.sql` de esa rama empieza con `drop table ... cascade`. Re-ejecutarlo sobre un proyecto con datos borra los correos y los diagnósticos ya registrados. Para un proyecto vivo hace falta un archivo de migración aditivo, no ese.

## Pendientes al 17 de septiembre

- Correr `supabase/schema.sql` en el proyecto `uotlhaitdkfroavqkvee`, que todavía no tiene ni una tabla, y después `supabase/migraciones/001-telefonos-y-correo.sql`.
- Subir el contenido con `convertir.js --supabase`: necesita la llave secreta en un `.env` local.
- Desplegar la Edge Function `enviar-correo` y crear el webhook (`supabase/functions/enviar-correo/README.md`). Resend solo manda a terceros desde un dominio verificado; sin dominio, el correo solo llega a la cuenta dueña de la llave.
- Publicar en Vercel (preset "Other", sin build, rama `main`), o `npx vercel --prod` si no hay permisos de admin sobre el repo para la integración con GitHub.
- M2 todavía dice "Por ahora solo está abierta Cálculo Integral", pero hay 7 materias activas.
- Los códigos FISI-1018, FISI-1019 y MATE-1203 no están confirmados contra un programa oficial del curso.
- La app no agenda una hora concreta: no hay tabla de citas. El correo pide acordarla con el monitor.
- No hay ni una línea de privacidad ni de autorización de tratamiento de datos, y ahora se guardan teléfonos. Para un piloto con estudiantes de verdad conviene ponerla.
