-- ============================================================================
-- Calibra — Esquema de base de datos (Supabase / Postgres)
-- ----------------------------------------------------------------------------
-- Contrato definido en esquema.md (raíz del repo). Ejecuta este archivo en el
-- editor SQL de Supabase para recrear la base completa desde cero.
--
-- 7 tablas:
--   Contenido (escribe convertir.js con service_role):
--     materias, subtemas, preguntas, opciones
--   Escritura pública desde el frontend (anon key):
--     monitores, resultados_diagnostico, leads
--
-- RLS:
--   - SELECT público en las 4 tablas de contenido y en monitores
--   - INSERT público solo en monitores, resultados_diagnostico y leads
--   - Sin UPDATE/DELETE público en ninguna tabla
--   - Sin SELECT público en leads (protege los correos capturados)
--
-- El acceso de escritura de contenido y cualquier lectura de leads se hace con
-- la service_role key, que ignora RLS. Esa llave NUNCA va al repo ni al front.
-- ============================================================================

-- Idempotente: permite volver a correr el script en un proyecto vacío o existente.
-- El orden respeta las dependencias de llaves foráneas (padres primero al crear,
-- hijos primero al borrar).

drop table if exists public.resultados_diagnostico cascade;
drop table if exists public.leads cascade;
drop table if exists public.monitores cascade;
drop table if exists public.opciones cascade;
drop table if exists public.preguntas cascade;
drop table if exists public.subtemas cascade;
drop table if exists public.materias cascade;

-- ----------------------------------------------------------------------------
-- Tablas de contenido
-- ----------------------------------------------------------------------------

-- materias: cada asignatura de ciclo básico.
create table public.materias (
    id      bigint generated always as identity primary key,
    nombre  text    not null,
    codigo  text    not null unique,
    activa  boolean not null default false
);

-- subtemas: los ejes conceptuales dentro de una materia.
create table public.subtemas (
    id         bigint generated always as identity primary key,
    materia_id bigint not null references public.materias (id) on delete cascade,
    clave      text   not null,
    nombre     text   not null,
    unique (materia_id, clave)
);

-- preguntas: cada ítem del banco calibrado.
create table public.preguntas (
    id         bigint generated always as identity primary key,
    subtema_id bigint  not null references public.subtemas (id) on delete cascade,
    numero     integer not null,
    dificultad text,
    enunciado  text    not null
);

-- opciones: las respuestas de cada pregunta; error_texto delata el error
-- conceptual de las incorrectas.
create table public.opciones (
    id          bigint  generated always as identity primary key,
    pregunta_id bigint  not null references public.preguntas (id) on delete cascade,
    letra       text    not null,
    texto       text    not null,
    es_correcta boolean not null default false,
    error_texto text,
    unique (pregunta_id, letra)
);

-- ----------------------------------------------------------------------------
-- Tablas con escritura pública desde el frontend
-- ----------------------------------------------------------------------------

-- monitores: perfiles creados en la pantalla "crear perfil de monitor".
create table public.monitores (
    id                     bigint generated always as identity primary key,
    nombre                 text        not null,
    carrera                text,
    semestre               text,
    nivel                  integer,
    calificacion           numeric(2, 1),
    precio_hora            integer,
    materia_certificada_id bigint      references public.materias (id) on delete set null,
    encaje_texto           text,
    creado_en              timestamptz not null default now()
);

-- resultados_diagnostico: se inserta al terminar la prueba del estudiante.
create table public.resultados_diagnostico (
    id                    bigint generated always as identity primary key,
    materia_id            bigint      references public.materias (id) on delete set null,
    subtema_debil_id      bigint      references public.subtemas (id) on delete set null,
    error_detectado_texto text,
    respuestas            jsonb,
    creado_en             timestamptz not null default now()
);

-- leads: correos capturados (reemplaza el FORM_ENDPOINT vacío). Sin SELECT público.
create table public.leads (
    id              bigint generated always as identity primary key,
    correo          text        not null,
    rol             text        not null check (rol in ('estudiante', 'monitor')),
    materia_interes text,
    creado_en       timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
-- Con RLS activo y sin políticas, todo queda denegado para roles anon/authenticated.
-- Se abre explícitamente solo lo que el contrato permite.

alter table public.materias               enable row level security;
alter table public.subtemas               enable row level security;
alter table public.preguntas              enable row level security;
alter table public.opciones               enable row level security;
alter table public.monitores              enable row level security;
alter table public.resultados_diagnostico enable row level security;
alter table public.leads                  enable row level security;

-- SELECT público (anon + authenticated) en las 4 tablas de contenido.
create policy "materias_select_publico" on public.materias
    for select to anon, authenticated using (true);

create policy "subtemas_select_publico" on public.subtemas
    for select to anon, authenticated using (true);

create policy "preguntas_select_publico" on public.preguntas
    for select to anon, authenticated using (true);

create policy "opciones_select_publico" on public.opciones
    for select to anon, authenticated using (true);

-- monitores: SELECT público (para listarlos) + INSERT público (crear perfil).
create policy "monitores_select_publico" on public.monitores
    for select to anon, authenticated using (true);

create policy "monitores_insert_publico" on public.monitores
    for insert to anon, authenticated with check (true);

-- resultados_diagnostico: solo INSERT público (no se listan al público).
create policy "resultados_insert_publico" on public.resultados_diagnostico
    for insert to anon, authenticated with check (true);

-- leads: solo INSERT público. Sin SELECT: un visitante no puede listar correos.
create policy "leads_insert_publico" on public.leads
    for insert to anon, authenticated with check (true);

-- No se crea ninguna política de UPDATE ni DELETE: quedan denegadas al público
-- en las 7 tablas. La escritura de contenido y la lectura de leads se hacen con
-- la service_role key, que omite RLS por diseño.

-- ----------------------------------------------------------------------------
-- Privilegios explícitos (defensa en profundidad)
-- ----------------------------------------------------------------------------
-- Supabase concede por defecto todos los privilegios a anon/authenticated en las
-- tablas nuevas de public, y deja que RLS sea la única puerta. Eso significa que
-- si alguien desactiva RLS en una tabla (un clic en el dashboard), anon podría
-- leer los correos de leads o borrar filas.
--
-- Aquí se revocan esos privilegios y se conceden solo los que el contrato
-- permite, así el límite se cumple en dos capas independientes: política RLS
-- + privilegio de tabla. No se toca service_role, que necesita acceso total
-- para el pipeline de contenido y para leer leads.

revoke all on public.materias               from anon, authenticated;
revoke all on public.subtemas               from anon, authenticated;
revoke all on public.preguntas              from anon, authenticated;
revoke all on public.opciones               from anon, authenticated;
revoke all on public.monitores              from anon, authenticated;
revoke all on public.resultados_diagnostico from anon, authenticated;
revoke all on public.leads                  from anon, authenticated;

-- Lectura pública: las 4 tablas de contenido y monitores.
grant select on public.materias  to anon, authenticated;
grant select on public.subtemas  to anon, authenticated;
grant select on public.preguntas to anon, authenticated;
grant select on public.opciones  to anon, authenticated;
grant select on public.monitores to anon, authenticated;

-- Escritura pública: solo las 3 tablas que la aceptan.
grant insert on public.monitores              to anon, authenticated;
grant insert on public.resultados_diagnostico to anon, authenticated;
grant insert on public.leads                  to anon, authenticated;

-- Nota: las llaves primarias usan `generated always as identity`, que no
-- requiere conceder privilegios sobre secuencias aparte (a diferencia de serial).
