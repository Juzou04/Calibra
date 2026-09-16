# Calibra — Parte 2: Pipeline de contenido (convertir.js → Supabase)

**Sugerido para:** Juan David Acevedo (cualquiera puede tomarla, es intercambiable con las otras 3)

## Cómo trabajar esta tarea con tu agente de IA

Abre este repositorio con tu agente (Claude Code, Cowork o el que uses) y pídele que lea este archivo completo antes de empezar, junto con `esquema.md` en la raíz del repo.

- Si un paso lo puede hacer el agente solo (editar archivos del repo, correr comandos, escribir código), que lo haga directamente, sin pedirte permiso paso a paso.
- Si un paso requiere que TÚ hagas algo (crear una cuenta, hacer clic en un dashboard web, pegar una API key, aprobar un push a GitHub), que te lo explique claro y te guíe uno por uno, esperando que confirmes cada uno antes de seguir.

No necesitas leer las tareas de tus compañeros ni el chat donde se armó este plan: este archivo y `esquema.md` tienen todo el contexto que tu agente necesita.

## Contexto (para una sesión de IA que arranca desde cero)

Calibra es un prototipo web que conecta estudiantes de pregrado de Uniandes con monitores de materias de ciclo básico. Su diferenciador es una prueba de opción múltiple calibrada: cada opción incorrecta delata un error conceptual específico, y el resultado le entrega al estudiante su punto débil y al monitor un brief automático de la sesión.

El contenido (materias, subtemas, preguntas y sus errores) vive en `contenido/*.md`, un archivo por materia, en un formato documentado en `contenido/README.md`. Hoy un script Node, `contenido/convertir.js`, lee esos `.md` y escribe dos arreglos de JavaScript (`MATERIAS`, `MONITORES`) directamente dentro de `index.html` (con `node contenido/convertir.js --escribir`). El equipo decidió mover esa persistencia a Supabase. **Antes de hacer nada, lee `esquema.md` en la raíz de este repositorio** — ahí están los nombres exactos de las tablas y columnas que debes llenar (`materias`, `subtemas`, `preguntas`, `opciones`).

## Tu tarea

Modifica `contenido/convertir.js` para que, además de (o en vez de) escribir en `index.html`, sepa hacer `upsert` de todo el contenido de `contenido/*.md` hacia las tablas `materias`, `subtemas`, `preguntas` y `opciones` en Supabase, usando el cliente `@supabase/supabase-js` para Node. La `service_role key` y la `Project URL` deben leerse de variables de entorno (por ejemplo `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`), nunca hardcodeadas en el script ni comiteadas al repo. Puedes agregar un flag nuevo, por ejemplo `--supabase`, sin romper el `--escribir` que ya existe (el equipo probablemente quiera mantener ambos por un tiempo).

El `upsert` debe ser idempotente: correr el script dos veces con el mismo contenido no debe duplicar filas.

## Por qué esta parte no depende de las otras 3

No necesitas esperar a que exista el proyecto "oficial" de Supabase del equipo (Parte 1) ni el `index.html` adaptado (Parte 3). Crea tu propio proyecto Supabase gratuito y temporal, con las mismas 7 tablas de `esquema.md` (usa el SQL de `supabase/schema.sql` si la Parte 1 ya lo comiteó, o créalas tú mismo copiando el esquema del documento), y desarrolla y prueba tu script contra ese proyecto propio. Al integrar, solo cambias las variables de entorno para apuntar al proyecto real del equipo.

## No toques

`index.html`, ni nada de la rama `main` o Vercel — eso es de las otras 2 partes. Sí puedes editar `contenido/*.md` si necesitas datos de prueba, pero no cambies las preguntas reales sin avisar al equipo.

## Definición de hecho

- [ ] `node contenido/convertir.js --supabase` (o el flag que elijas) llena correctamente `materias`, `subtemas`, `preguntas` y `opciones` a partir de los 6 archivos `.md` de `contenido/`.
- [ ] Correr el script dos veces no duplica filas.
- [ ] Las credenciales se leen de variables de entorno, no están hardcodeadas ni comiteadas.
- [ ] El flag `--escribir` original sigue funcionando igual que antes.
