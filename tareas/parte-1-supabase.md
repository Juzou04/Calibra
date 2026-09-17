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

### Hecho en el repo

- [x] **`supabase/schema.sql`** — DDL completo de las 7 tablas con los nombres de
      tabla y columna exactos de `esquema.md`, más `enable row level security`, las
      políticas del contrato y los privilegios explícitos del rol `anon`. Es
      idempotente: se puede re-ejecutar para dejar la base limpia.
- [x] **RLS con las políticas exactas descritas**, escrito y validado: `select`
      público en las 4 tablas de contenido y en `monitores`; `insert` público solo
      en `monitores`, `resultados_diagnostico` y `leads`; ninguna política de
      `update`/`delete` en ninguna tabla; sin `select` público en `leads`.
- [x] **`supabase/README.md`** — espacios para la Project URL y la anon key, la
      advertencia sobre la `service_role key`, el modelo de acceso tabla por tabla
      y el paso a paso para recrear y verificar la base.
- [x] **`supabase/verificar.sql`** — reporte de 38 comprobaciones para correr en el
      editor SQL de Supabase y confirmar que la base quedó igual al contrato.
      No modifica nada.
- [x] **`supabase/validar-esquema.mjs`** — valida el DDL en local, sin proyecto
      Supabase, contra un Postgres real (PGlite) en memoria: 55 comprobaciones,
      incluido el comportamiento efectivo de `anon` al hacer `select`, `insert`,
      `update` y `delete` en cada tabla. Corre con `cd supabase && npm install &&
      npm run validar`. Última corrida: 55 de 55.

### Pendiente en el dashboard de Supabase (requiere tu cuenta)

- [ ] Crear el proyecto en Supabase (plan gratuito).
- [ ] Ejecutar `supabase/schema.sql` en el editor SQL → crea las 7 tablas y activa RLS.
- [ ] Ejecutar `supabase/verificar.sql` y confirmar que las 38 filas dicen `OK`.
- [ ] Pegar la `Project URL` y la `anon public key` reales en `supabase/README.md` y comitear.
- [ ] Compartir la `service_role key` por un canal privado con quien haga la Parte 2. Nunca al repo.

> **Estado.** El esquema está escrito y verificado contra un Postgres real, así que
> el SQL no va a fallar por sintaxis ni por permisos mal puestos al ejecutarlo. Lo
> que queda son los pasos del dashboard, que dependen de una cuenta de Supabase.
>
> **Nota sobre `package.json`.** El `supabase/package.json` existe solo para el
> validador local y está acotado a esta carpeta. El frontend no cambia:
> `index.html` sigue sin build y sin dependencias, como pide el brief.

## Decisión de diseño: privilegios además de RLS

`esquema.md` pide RLS con `select`/`insert` público acotado y sin `update`/`delete`.
`schema.sql` lo cumple, y añade una segunda capa: revoca los privilegios que
Supabase concede por defecto a `anon` y concede solo los que el contrato permite.

El motivo es concreto. Al validar el esquema se vio que, con solo RLS, `anon`
conserva el privilegio de `select` sobre `leads` y de `delete` sobre todo: lo único
que lo frena son las políticas. Si alguien desactiva RLS en una tabla desde el
dashboard —un clic— los correos capturados quedarían legibles para cualquiera con
la anon key, que es pública. Con los privilegios revocados el límite se aplica dos
veces de forma independiente. `service_role` no se toca, así que la Parte 2 sigue
teniendo el acceso que necesita.
