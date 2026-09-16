# Calibra — Parte 1: Infraestructura Supabase

**Sugerido para:** Lorenzo (cualquiera puede tomarla, es intercambiable con las otras 3)

## Cómo trabajar esta tarea con tu agente de IA

Abre este repositorio con tu agente (Claude Code, Cowork o el que uses) y pídele que lea este archivo completo antes de empezar, junto con `esquema.md` en la raíz del repo.

- Si un paso lo puede hacer el agente solo (editar archivos del repo, correr comandos, escribir código), que lo haga directamente, sin pedirte permiso paso a paso.
- Si un paso requiere que TÚ hagas algo (crear una cuenta, hacer clic en un dashboard web, pegar una API key, aprobar un push a GitHub), que te lo explique claro y te guíe uno por uno, esperando que confirmes cada uno antes de seguir.

No necesitas leer las tareas de tus compañeros ni el chat donde se armó este plan: este archivo y `esquema.md` tienen todo el contexto que tu agente necesita.

## Contexto (para una sesión de IA que arranca desde cero)

Calibra es un prototipo web que conecta estudiantes de pregrado de Uniandes con monitores de materias de ciclo básico. Su diferenciador es una prueba de opción múltiple calibrada: cada opción incorrecta delata un error conceptual específico, y el resultado le entrega al estudiante su punto débil y al monitor un brief automático de la sesión.

Hoy el prototipo es un único `index.html` estático (sin backend, sin base de datos). El equipo decidió mover la persistencia a Supabase para tener un MVP real. **Antes de hacer nada, lee `esquema.md` en la raíz de este repositorio** — ahí está el contrato completo: las 7 tablas, sus columnas y las políticas de RLS que TODO el equipo va a usar. Esta tarea es, literalmente, ejecutar ese contrato.

## Tu tarea

1. Crear un proyecto nuevo en Supabase (plan gratuito).
2. Crear las 7 tablas descritas en `esquema.md` (`materias`, `subtemas`, `preguntas`, `opciones`, `monitores`, `resultados_diagnostico`, `leads`) con el editor SQL de Supabase, respetando exactamente los nombres de tabla y columna del documento.
3. Activar Row Level Security en las 7 tablas y crear las políticas que `esquema.md` describe: `select` público en las 4 tablas de contenido y en `monitores`; `insert` público solo en `monitores`, `resultados_diagnostico` y `leads`; sin `update`/`delete` público en ninguna; sin `select` público en `leads`.
4. Guardar el DDL completo (los `CREATE TABLE` y `CREATE POLICY`) en un archivo nuevo `supabase/schema.sql` en el repo, para que cualquiera pueda recrear la base desde cero.
5. Crear `supabase/README.md` con la `Project URL` y la `anon public key` (son seguras de compartir y de comitear: están protegidas por RLS). La `service_role key` **nunca** va al repo — compártela directamente por un canal privado del equipo con quien trabaje la Parte 2 (necesita esa llave para el script de contenido).

## Por qué esta parte no depende de las otras 3

Todo lo que necesitas ya está escrito en `esquema.md`, que ya vive en el repo. No necesitas esperar a que exista `index.html` adaptado, ni el script `convertir.js` adaptado, ni la rama `main`/Vercel listos. Tu entregable (el proyecto Supabase + `schema.sql` + las credenciales públicas) es lo que las Partes 2 y 3 van a consumir, no al revés.

## No toques

`index.html`, `contenido/*.md`, `contenido/convertir.js`, ni nada de la rama `main` o Vercel — eso es de las otras 3 partes.

## Definición de hecho

- [ ] Las 7 tablas existen en Supabase con las columnas de `esquema.md`.
- [ ] RLS activo con las políticas exactas descritas.
- [ ] `supabase/schema.sql` comiteado al repo.
- [ ] `supabase/README.md` con Project URL + anon key comiteado al repo.
- [ ] La `service_role key` fue compartida por fuera del repo a quien haga la Parte 2.
