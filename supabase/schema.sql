-- ============================================================================
-- Calibra — Esquema de base de datos (Supabase / Postgres)
-- ----------------------------------------------------------------------------
-- Contrato definido en esquema.md (raíz del repo). Ejecuta este archivo en el
-- editor SQL de Supabase para recrear la base completa desde cero.
--
-- 13 tablas:
--   Contenido (escribe convertir.js con service_role):
--     materias, subtemas, preguntas, opciones
--     knowledge_components, misconcepciones, pregunta_kc  (diagnóstico por kc;
--     solo tienen filas las materias cuyo .md declara "kc:")
--   Escritura pública desde el frontend (anon key):
--     monitores, resultados_diagnostico, leads
--   Agenda (equivale a la migración 004; el público solo entra por funciones):
--     estudiantes, franjas, citas
--     + reservar_franja() y publicar_franjas() (security definer)
--     + la vista brief_cita (solo service_role)
--
-- "sesion_id" en leads y resultados_diagnostico es el id del NAVEGADOR, no una
-- cita. La sesión de tutoría es una fila de citas.
--
-- RLS:
--   - SELECT público en las 7 tablas de contenido, en monitores y en franjas
--   - INSERT público solo en monitores, resultados_diagnostico y leads
--   - Sin UPDATE/DELETE público en ninguna tabla
--   - Sin SELECT público en leads, estudiantes ni citas (protege correos y teléfonos)
--   - franjas se escribe con publicar_franjas() y se reserva con reservar_franja()
--
-- El acceso de escritura de contenido y cualquier lectura de leads se hace con
-- la service_role key, que ignora RLS. Esa llave NUNCA va al repo ni al front.
-- ============================================================================

-- Idempotente: permite volver a correr el script en un proyecto vacío o existente.
-- El orden respeta las dependencias de llaves foráneas (padres primero al crear,
-- hijos primero al borrar).

drop view  if exists public.brief_cita;
drop table if exists public.citas cascade;
drop table if exists public.franjas cascade;
drop table if exists public.resultados_diagnostico cascade;
drop table if exists public.leads cascade;
drop table if exists public.estudiantes cascade;
drop table if exists public.monitores cascade;
drop table if exists public.opciones cascade;
drop table if exists public.pregunta_kc cascade;
drop table if exists public.preguntas cascade;
drop table if exists public.misconcepciones cascade;
drop table if exists public.knowledge_components cascade;
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

-- knowledge_components: habilidades concretas dentro de un subtema.
create table public.knowledge_components (
    id         bigint generated always as identity primary key,
    subtema_id bigint not null references public.subtemas (id) on delete cascade,
    clave      text   not null,
    nombre     text   not null,
    unique (subtema_id, clave)
);

-- misconcepciones: errores de razonamiento que se repiten entre preguntas.
-- Cada una pertenece a un knowledge component.
create table public.misconcepciones (
    id    bigint generated always as identity primary key,
    kc_id bigint not null references public.knowledge_components (id) on delete cascade,
    clave text   not null,
    texto text   not null,
    unique (kc_id, clave)
);

-- preguntas: cada ítem del banco calibrado.
create table public.preguntas (
    id         bigint generated always as identity primary key,
    subtema_id bigint  not null references public.subtemas (id) on delete cascade,
    numero     integer not null,
    dificultad text,
    enunciado  text    not null
);

-- pregunta_kc: qué knowledge components mide cada pregunta (uno o dos).
create table public.pregunta_kc (
    pregunta_id bigint not null references public.preguntas (id) on delete cascade,
    kc_id       bigint not null references public.knowledge_components (id) on delete cascade,
    primary key (pregunta_id, kc_id)
);

-- opciones: las respuestas de cada pregunta; error_texto delata el error
-- conceptual de las incorrectas y misconcepcion_id lo enlaza con el catálogo.
create table public.opciones (
    id               bigint  generated always as identity primary key,
    pregunta_id      bigint  not null references public.preguntas (id) on delete cascade,
    letra            text    not null,
    texto            text    not null,
    es_correcta      boolean not null default false,
    error_texto      text,
    misconcepcion_id bigint  references public.misconcepciones (id) on delete set null,
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
    -- encaje_texto es la línea corta de la tarjeta en la lista; presentacion son
    -- los párrafos que el monitor escribe y que solo se ven al abrir su perfil.
    encaje_texto           text,
    presentacion           text,
    -- Clave pública del perfil, generada en el navegador. No identifica a
    -- nadie: es la que ata esta fila con el teléfono que el monitor dejó en
    -- leads, tabla sin SELECT público. Así el número no queda descargable con
    -- la llave publicable que viaja en el HTML.
    clave                  text,
    creado_en              timestamptz not null default now()
);

-- estudiantes: una fila por correo. Se llena en reservar_franja(); el público no
-- la lee ni la escribe. Va antes de resultados_diagnostico porque esta la
-- referencia.
create table public.estudiantes (
    id        bigint      generated always as identity primary key,
    -- Se guarda en minúscula y sin espacios en los bordes.
    correo    text        not null,
    telefono  text,
    creado_en timestamptz not null default now()
);

-- Un correo, una fila, sin importar mayúsculas ni espacios de más.
create unique index estudiantes_correo_norm_idx
    on public.estudiantes (lower(btrim(correo)));

-- resultados_diagnostico: se inserta al terminar la prueba del estudiante.
create table public.resultados_diagnostico (
    id                    bigint generated always as identity primary key,
    materia_id            bigint      references public.materias (id) on delete set null,
    subtema_debil_id      bigint      references public.subtemas (id) on delete set null,
    error_detectado_texto text,
    respuestas            jsonb,
    -- detalle por knowledge component: [{kc, estado, aciertos, total}] y
    -- misconcepciones confirmadas o posibles. Null en materias sin kc.
    kcs                   jsonb,
    -- Sesión del navegador que hizo la prueba. Lo único que ata este
    -- diagnóstico con el correo que la misma persona deja después en leads.
    sesion_id             text,
    -- Quién hizo la prueba. Un estudiante tiene muchos diagnósticos. Nulo al
    -- insertar: lo llena reservar_franja() cuando la misma persona reserva.
    estudiante_id         bigint      references public.estudiantes (id) on delete set null,
    creado_en             timestamptz not null default now()
);

-- leads: correos capturados (reemplaza el FORM_ENDPOINT vacío). Sin SELECT público.
create table public.leads (
    id                bigint generated always as identity primary key,
    correo            text        not null,
    rol               text        not null check (rol in ('estudiante', 'monitor')),
    materia_interes   text,
    -- Teléfono opcional, sin check de formato: el formato se valida en el
    -- front. Un check que rechace "300" haría fallar el insert entero y se
    -- perdería el correo, que es justo lo que se quiere dejar de perder.
    telefono          text,
    -- Monitor que eligió el estudiante. Nulo si eligió uno de los de ejemplo
    -- del archivo, que no tienen fila aquí.
    monitor_id        bigint      references public.monitores (id) on delete set null,
    -- Sesión del navegador: ata este correo con su diagnóstico y, cuando el rol
    -- es monitor, con la fila de monitores que publicó ese mismo navegador.
    sesion_id         text,
    -- Lo escribe la Edge Function del correo de confirmación para no mandarlo
    -- dos veces. El frontend nunca lo toca (anon no tiene UPDATE).
    correo_enviado_en timestamptz,
    creado_en         timestamptz not null default now()
);

-- Índices de apoyo. Una llave foránea no crea el suyo, y el correo automático
-- busca por sesión.
create index leads_monitor_id_idx      on public.leads (monitor_id);
create index leads_sesion_id_idx       on public.leads (sesion_id);
create index resultados_sesion_id_idx  on public.resultados_diagnostico (sesion_id);
create index monitores_clave_idx       on public.monitores (clave);
create index resultados_estudiante_id_idx on public.resultados_diagnostico (estudiante_id);

-- ----------------------------------------------------------------------------
-- Agenda: franjas y citas
-- ----------------------------------------------------------------------------

-- franjas: horas concretas en las que un monitor atiende. Un monitor tiene
-- muchas. Lectura pública; se escribe con publicar_franjas() y se reserva con
-- reservar_franja().
create table public.franjas (
    id           bigint      generated always as identity primary key,
    monitor_id   bigint      not null references public.monitores (id) on delete cascade,
    inicia_en    timestamptz not null,
    duracion_min integer     not null default 60 check (duracion_min > 0),
    -- La cambia solo reservar_franja(). El público no tiene UPDATE.
    reservada    boolean     not null default false,
    creado_en    timestamptz not null default now(),
    unique (monitor_id, inicia_en)
);

create index franjas_monitor_inicia_idx on public.franjas (monitor_id, inicia_en);

-- citas: la sesión de tutoría. franja_id es UNIQUE: una franja, una cita.
create table public.citas (
    id                bigint      generated always as identity primary key,
    franja_id         bigint      not null unique references public.franjas (id),
    monitor_id        bigint      not null references public.monitores (id),
    estudiante_id     bigint      not null references public.estudiantes (id),
    -- El diagnóstico más reciente de ese navegador al reservar. Nulo si el
    -- estudiante reservó sin hacer la prueba.
    diagnostico_id    bigint      references public.resultados_diagnostico (id) on delete set null,
    materia_id        bigint      references public.materias (id) on delete set null,
    estado            text        not null default 'confirmada'
                                  check (estado in ('confirmada', 'cancelada', 'realizada')),
    -- Lo escribe la Edge Function del correo para no mandarlo dos veces.
    correo_enviado_en timestamptz,
    creado_en         timestamptz not null default now()
);

create index citas_monitor_id_idx    on public.citas (monitor_id);
create index citas_estudiante_id_idx on public.citas (estudiante_id);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
-- Con RLS activo y sin políticas, todo queda denegado para roles anon/authenticated.
-- Se abre explícitamente solo lo que el contrato permite.

alter table public.materias               enable row level security;
alter table public.subtemas               enable row level security;
alter table public.preguntas              enable row level security;
alter table public.opciones               enable row level security;
alter table public.knowledge_components   enable row level security;
alter table public.misconcepciones        enable row level security;
alter table public.pregunta_kc            enable row level security;
alter table public.monitores              enable row level security;
alter table public.resultados_diagnostico enable row level security;
alter table public.leads                  enable row level security;
alter table public.estudiantes            enable row level security;
alter table public.franjas                enable row level security;
alter table public.citas                  enable row level security;

-- SELECT público (anon + authenticated) en las 4 tablas de contenido.
create policy "materias_select_publico" on public.materias
    for select to anon, authenticated using (true);

create policy "subtemas_select_publico" on public.subtemas
    for select to anon, authenticated using (true);

create policy "preguntas_select_publico" on public.preguntas
    for select to anon, authenticated using (true);

create policy "opciones_select_publico" on public.opciones
    for select to anon, authenticated using (true);

create policy "knowledge_components_select_publico" on public.knowledge_components
    for select to anon, authenticated using (true);

create policy "misconcepciones_select_publico" on public.misconcepciones
    for select to anon, authenticated using (true);

create policy "pregunta_kc_select_publico" on public.pregunta_kc
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

-- franjas: solo SELECT público, para pintar las horas libres de cada monitor.
-- estudiantes y citas: cero políticas. Solo service_role y las funciones
-- security definer de más abajo las tocan.
create policy "franjas_select_publico" on public.franjas
    for select to anon, authenticated using (true);

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
revoke all on public.knowledge_components   from anon, authenticated;
revoke all on public.misconcepciones        from anon, authenticated;
revoke all on public.pregunta_kc            from anon, authenticated;
revoke all on public.monitores              from anon, authenticated;
revoke all on public.resultados_diagnostico from anon, authenticated;
revoke all on public.leads                  from anon, authenticated;
revoke all on public.estudiantes            from anon, authenticated;
revoke all on public.franjas                from anon, authenticated;
revoke all on public.citas                  from anon, authenticated;

-- Lectura pública: las 7 tablas de contenido y monitores.
grant select on public.materias             to anon, authenticated;
grant select on public.subtemas             to anon, authenticated;
grant select on public.preguntas            to anon, authenticated;
grant select on public.opciones             to anon, authenticated;
grant select on public.knowledge_components to anon, authenticated;
grant select on public.misconcepciones      to anon, authenticated;
grant select on public.pregunta_kc          to anon, authenticated;
grant select on public.monitores to anon, authenticated;
grant select on public.franjas   to anon, authenticated;

-- Escritura pública: solo las 3 tablas que la aceptan.
grant insert on public.monitores              to anon, authenticated;
grant insert on public.resultados_diagnostico to anon, authenticated;
grant insert on public.leads                  to anon, authenticated;

-- Nota: las llaves primarias usan `generated always as identity`, que no
-- requiere conceder privilegios sobre secuencias aparte (a diferencia de serial).

-- ----------------------------------------------------------------------------
-- Funciones y vista de la agenda (idénticas a las de la migración 004)
-- ----------------------------------------------------------------------------
-- El público no toca estudiantes ni citas: entra por estas dos funciones, que
-- corren como dueño (security definer). PostgREST las expone como /rpc/.
--
-- reservar_franja
-- ----------------------------------------------------------------------------
-- security definer: corre como dueño de las tablas, así que puede escribir en
-- estudiantes y citas aunque anon no tenga ni un privilegio sobre ellas. Devuelve
-- siempre un jsonb; nunca la lista de estudiantes ni de citas.
--
-- Concurrencia: `select ... for update` toma el candado de la fila de la franja.
-- Si dos estudiantes confirman a la vez, el segundo espera al primero, vuelve a
-- leer la fila y ve reservada = true: recibe 'ocupada'. Detrás de eso, citas.
-- franja_id UNIQUE es la red de seguridad.
create or replace function public.reservar_franja(
    p_franja_id bigint,
    p_correo    text,
    p_telefono  text,
    p_sesion_id text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $func$
declare
    v_correo  text;
    v_tel     text;
    v_sesion  text;
    v_franja  public.franjas;
    v_filas   integer;
    v_est     bigint;
    v_diag    bigint;
    v_materia bigint;
    v_cita    bigint;
begin
    -- 1. Formato mínimo del correo. El formato fino lo valida el front.
    v_correo := lower(btrim(coalesce(p_correo, '')));
    if length(v_correo) > 254 or v_correo !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
        return jsonb_build_object('ok', false, 'motivo', 'correo');
    end if;
    v_tel    := left(nullif(btrim(coalesce(p_telefono, '')), ''), 40);
    v_sesion := nullif(btrim(coalesce(p_sesion_id, '')), '');

    -- 2. La franja existe, no ha pasado y sigue libre. El for update es el bloqueo.
    select * into v_franja
    from public.franjas
    where id = p_franja_id
    for update;

    if v_franja.id is null then
        return jsonb_build_object('ok', false, 'motivo', 'no_existe');
    end if;
    if v_franja.inicia_en <= now() then
        return jsonb_build_object('ok', false, 'motivo', 'pasada');
    end if;
    if v_franja.reservada then
        return jsonb_build_object('ok', false, 'motivo', 'ocupada');
    end if;

    -- El resto va en un sub-bloque: si otra transacción se adelantó y la
    -- restricción UNIQUE de citas.franja_id salta, se deshace todo lo de aquí
    -- (incluido el update de la franja) y se responde 'ocupada' en vez de un 500.
    begin
        -- 3. Marca la franja. Condicional: si no afecta ninguna fila, alguien la tomó.
        update public.franjas
           set reservada = true
         where id = v_franja.id
           and not reservada;
        get diagnostics v_filas = row_count;
        if v_filas = 0 then
            return jsonb_build_object('ok', false, 'motivo', 'ocupada');
        end if;

        -- 4. El estudiante: uno por correo. Un teléfono nuevo pisa al anterior;
        --    uno vacío no borra el que ya había.
        insert into public.estudiantes (correo, telefono)
             values (v_correo, v_tel)
        on conflict ((lower(btrim(correo)))) do update
            set telefono = coalesce(excluded.telefono, public.estudiantes.telefono)
        returning id into v_est;

        -- 5. Sus diagnósticos. Todos los del navegador que aún no tenían dueño
        --    pasan a ser suyos, y la cita apunta al más reciente.
        if v_sesion is not null then
            update public.resultados_diagnostico
               set estudiante_id = v_est
             where sesion_id = v_sesion
               and estudiante_id is null;

            select id, materia_id into v_diag, v_materia
            from public.resultados_diagnostico
            where sesion_id = v_sesion
            order by creado_en desc, id desc
            limit 1;
        end if;

        -- Sin diagnóstico, la materia de la cita es la del monitor: el brief
        -- siempre dice de qué materia es la sesión.
        if v_materia is null then
            select materia_certificada_id into v_materia
            from public.monitores
            where id = v_franja.monitor_id;
        end if;

        -- 6. La cita.
        insert into public.citas (franja_id, monitor_id, estudiante_id, diagnostico_id, materia_id)
             values (v_franja.id, v_franja.monitor_id, v_est, v_diag, v_materia)
        returning id into v_cita;
    exception when unique_violation then
        return jsonb_build_object('ok', false, 'motivo', 'ocupada');
    end;

    return jsonb_build_object(
        'ok',         true,
        'cita_id',    v_cita,
        'franja_id',  v_franja.id,
        'monitor_id', v_franja.monitor_id,
        'inicia_en',  v_franja.inicia_en);
end;
$func$;

comment on function public.reservar_franja(bigint, text, text, text) is
    'Reserva una franja de forma atómica y crea la cita. Devuelve ok o motivo: correo, no_existe, pasada, ocupada.';

revoke all on function public.reservar_franja(bigint, text, text, text) from public;
grant execute on function public.reservar_franja(bigint, text, text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- publicar_franjas
-- ----------------------------------------------------------------------------
-- p_franjas es un arreglo JSON de textos ISO 8601:
--   ["2026-10-01T16:00:00-05:00", "2026-10-02T09:00:00-05:00"]
-- Ignora las que ya pasaron, las repetidas y las que no se pueden leer como
-- fecha. Máximo 20 por llamada. La clave es la de monitores.clave; si varios
-- monitores comparten clave, gana el más reciente.
create or replace function public.publicar_franjas(
    p_clave   text,
    p_franjas jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $func$
declare
    v_monitor bigint;
    v_txt     text;
    v_ts      timestamptz;
    v_filas   integer;
    v_creadas integer := 0;
begin
    if p_clave is null or btrim(p_clave) = '' then
        return jsonb_build_object('ok', false, 'motivo', 'monitor_no_existe');
    end if;

    select id into v_monitor
    from public.monitores
    where clave = p_clave
    order by creado_en desc, id desc
    limit 1;

    if v_monitor is null then
        return jsonb_build_object('ok', false, 'motivo', 'monitor_no_existe');
    end if;

    if p_franjas is null or jsonb_typeof(p_franjas) <> 'array' then
        return jsonb_build_object('ok', false, 'motivo', 'formato');
    end if;
    if jsonb_array_length(p_franjas) > 20 then
        return jsonb_build_object('ok', false, 'motivo', 'demasiadas');
    end if;

    for v_txt in select jsonb_array_elements_text(p_franjas) loop
        begin
            v_ts := v_txt::timestamptz;
        exception when others then
            continue;   -- un valor ilegible no tumba a los demás
        end;
        if v_ts <= now() then
            continue;
        end if;

        insert into public.franjas (monitor_id, inicia_en)
             values (v_monitor, v_ts)
        on conflict (monitor_id, inicia_en) do nothing;
        get diagnostics v_filas = row_count;
        v_creadas := v_creadas + v_filas;
    end loop;

    return jsonb_build_object('ok', true, 'monitor_id', v_monitor, 'creadas', v_creadas);
end;
$func$;

comment on function public.publicar_franjas(text, jsonb) is
    'El monitor agrega franjas con la clave de su perfil. Máximo 20 por llamada; ignora pasadas y repetidas.';

revoke all on function public.publicar_franjas(text, jsonb) from public;
grant execute on function public.publicar_franjas(text, jsonb) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- brief_cita
-- ----------------------------------------------------------------------------
-- Lo que necesita saber el monitor (y la Edge Function que le escribe) de una
-- cita. security_invoker: la vista se ejecuta con los permisos de quien la
-- consulta, no con los de su dueño; como anon no tiene privilegios sobre las
-- tablas de abajo, tampoco puede leerla por este camino.
create or replace view public.brief_cita
with (security_invoker = true) as
select c.id                     as cita_id,
       c.estado                 as estado,
       c.creado_en              as creado_en,
       c.correo_enviado_en      as correo_enviado_en,
       f.inicia_en              as inicia_en,
       f.duracion_min           as duracion_min,
       m.id                     as monitor_id,
       m.nombre                 as monitor_nombre,
       m.clave                  as monitor_clave,
       m.precio_hora            as precio_hora,
       e.id                     as estudiante_id,
       e.correo                 as estudiante_correo,
       e.telefono               as estudiante_telefono,
       d.id                     as diagnostico_id,
       ma.id                    as materia_id,
       ma.nombre                as materia_nombre,
       st.nombre                as subtema_debil,
       d.error_detectado_texto  as error_detectado_texto,
       d.kcs                    as kcs,
       d.respuestas             as respuestas
from public.citas c
join public.franjas     f  on f.id  = c.franja_id
join public.monitores   m  on m.id  = c.monitor_id
join public.estudiantes e  on e.id  = c.estudiante_id
left join public.resultados_diagnostico d on d.id = c.diagnostico_id
left join public.materias  ma on ma.id = c.materia_id
left join public.subtemas  st on st.id = d.subtema_debil_id;

comment on view public.brief_cita is
    'Brief de cada cita para el monitor. Solo service_role: trae correos y teléfonos.';

revoke all on public.brief_cita from anon, authenticated;
grant select on public.brief_cita to service_role;

-- PostgREST cachea el esquema: las tablas y funciones nuevas no aparecen hasta
-- que recarga.
notify pgrst, 'reload schema';
