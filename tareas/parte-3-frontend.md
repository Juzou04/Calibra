# Calibra — Parte 3: Frontend (index.html ↔ Supabase)

> **Documento histórico.** Encargo de una etapa ya cumplida (16 y 17 de septiembre de 2026), escrito como instrucciones para quien arranca de cero. **No lo ejecutes tal cual:** por ejemplo, correr `supabase/schema.sql` sobre el proyecto actual borraría los datos. Hoy hay 13 tablas, la base ya existe y las migraciones aditivas están en `supabase/migraciones/`. Lo vigente está en `CLAUDE.md`, `esquema.md` y `tareas/integracion-final.md`.

**Sugerido para:** Juan David Chávez (cualquiera puede tomarla, es intercambiable con las otras 3)

## Cómo trabajar esta tarea con tu agente de IA

Abre este repositorio con tu agente (Claude Code, Cowork o el que uses) y pídele que lea este archivo completo antes de empezar, junto con `esquema.md` en la raíz del repo.

- Si un paso lo puede hacer el agente solo (editar archivos del repo, correr comandos, escribir código), que lo haga directamente, sin pedirte permiso paso a paso.
- Si un paso requiere que TÚ hagas algo (crear una cuenta, hacer clic en un dashboard web, pegar una API key, aprobar un push a GitHub), que te lo explique claro y te guíe uno por uno, esperando que confirmes cada uno antes de seguir.

No necesitas leer las tareas de tus compañeros ni el chat donde se armó este plan: este archivo y `esquema.md` tienen todo el contexto que tu agente necesita.

## Contexto (para una sesión de IA que arranca desde cero)

Calibra es un prototipo web que conecta estudiantes de pregrado de Uniandes con monitores de materias de ciclo básico. Su diferenciador es una prueba de opción múltiple calibrada: cada opción incorrecta delata un error conceptual específico, y el resultado le entrega al estudiante su punto débil y al monitor un brief automático de la sesión.

Todo el prototipo vive en un único `index.html` (más de 5000 líneas, HTML/CSS/JS sin frameworks ni build). Hoy las materias y los monitores están hardcodeados en dos constantes de JavaScript, `MATERIAS` (línea ~1618) y `MONITORES` (línea ~2424). La captura de correo usa una constante `FORM_ENDPOINT` vacía (línea ~1530): si tuviera una URL, mandaría un `fetch` POST; vacía, solo simula el agradecimiento. El equipo decidió mover todo esto a Supabase. **Antes de hacer nada, lee `esquema.md` en la raíz de este repositorio** — ahí están las tablas exactas que vas a leer y escribir.

## Tu tarea

1. Agrega el cliente `@supabase/supabase-js` a `index.html` vía CDN (sin build, sigue siendo un solo archivo autónomo).
2. Sustituye las constantes `MATERIAS` y `MONITORES` hardcodeadas por una carga asíncrona desde Supabase al arrancar la app (tablas `materias`+`subtemas`+`preguntas`+`opciones`, y `monitores`), usando la `anon key` — es pública por diseño, protegida por RLS, así que se puede hardcodear en el script igual que hoy se hardcodearía `FORM_ENDPOINT`. Muestra una pantalla de carga breve mientras llega la respuesta.
3. Conecta los tres flujos de escritura:
   - Captura de correo (reemplaza `FORM_ENDPOINT`) → inserta en `leads`.
   - "Crear perfil de monitor" → inserta en `monitores`.
   - Fin de la prueba/diagnóstico → inserta en `resultados_diagnostico`.
4. Si Supabase no responde, la app **no se debe romper**: sigue la misma regla que ya usa `FORM_ENDPOINT` hoy — nunca bloquees la demo por un error de red, muestra el mensaje de éxito de todas formas si el insert falla.

## Por qué esta parte no depende de las otras 3

No necesitas esperar al proyecto Supabase "oficial" del equipo (Parte 1) ni al script de contenido adaptado (Parte 2). Crea tu propio proyecto Supabase gratuito y temporal con las 7 tablas de `esquema.md`, cárgalo a mano con 2-3 filas de ejemplo por tabla (respetando los nombres de columna del documento), y desarrolla contra eso. Al integrar, solo cambias dos constantes: la `Project URL` y la `anon key`.

## No toques

`contenido/*.md`, `contenido/convertir.js`, ni nada de la rama `main` o Vercel — eso es de las otras 2 partes.

## Definición de hecho

- [ ] `index.html` sigue abriendo con doble clic (sin servidor) sin errores de consola, aunque la carga de datos falle.
- [ ] Con las credenciales de un proyecto Supabase válido (el propio de prueba, o el real al integrar), la app carga materias y monitores desde ahí en vez de las constantes hardcodeadas.
- [ ] Los tres flujos de escritura (leads, perfil de monitor, resultado de diagnóstico) insertan correctamente en sus tablas.
- [ ] Si Supabase no responde, la demo sigue funcionando (degradado, no roto).
