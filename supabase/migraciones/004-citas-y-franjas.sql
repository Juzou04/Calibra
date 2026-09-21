-- ============================================================================
-- Calibra · migración 004 — estudiantes, franjas de los monitores y citas
-- ----------------------------------------------------------------------------
-- Va numerada 004 porque supabase/migraciones/ ya tiene 001, 002 y 003.
--
-- Qué resuelve:
--
--   Antes, el horario de un monitor era texto suelto en index.html y la sesión
--   elegida por el estudiante nunca llegaba a la base: no había dónde bloquearla,
--   ni forma de ligar un estudiante con varias sesiones ni un monitor con varias
--   franjas. Y un diagnóstico solo se ataba a un correo por el id del navegador
--   (sesion_id), que se renueva al empezar de nuevo.
--
-- Qué agrega, y por qué:
--
--   estudiantes                 una fila por correo. Un estudiante tiene muchas
--                               citas y muchos diagnósticos. SIN SELECT público:
--                               son correos y teléfonos.
--   franjas                     horas concretas en las que un monitor atiende
--                               (inicia_en + duracion_min). Un monitor tiene
--                               muchas. Lectura pública, para pintar las libres.
--                               La escritura solo pasa por publicar_franjas().
--   citas                       la sesión de tutoría: una franja + un estudiante
--                               + un monitor + el diagnóstico que el monitor
--                               necesita ver. SIN SELECT público. franja_id es
--                               UNIQUE: la base impide que una franja tenga dos
--                               citas aunque falle cualquier otra capa.
--   resultados_diagnostico.estudiante_id
--                               se llena al reservar: ata los diagnósticos del
--                               navegador (sesion_id) con el estudiante.
--   reservar_franja()           security definer. Bloquea la franja, crea o
--                               actualiza al estudiante, ata sus diagnósticos y
--                               crea la cita, todo en una sola transacción.
--   publicar_franjas()          security definer. El monitor agrega sus franjas
--                               con la clave de su perfil (monitores.clave).
--   brief_cita                  vista con lo que el monitor necesita saber de una
--                               cita. Solo la lee service_role (la Edge Function).
--
-- NOMBRES: "sesion_id" en leads y resultados_diagnostico es el id del NAVEGADOR
-- (un uuid que genera index.html), no una cita. La cita se llama "cita" y vive
-- en la tabla citas. No se renombra la columna para que esto siga siendo aditivo.
--
-- LO QUE ESTA MIGRACIÓN NO HACE, a propósito:
--   · No hay autenticación. monitores.clave es de lectura pública (la tabla
--     monitores lo es), así que quien la lea puede publicar franjas de ese
--     monitor. Ya hoy cualquiera puede insertar monitores con la llave que viaja
--     en el HTML. Cerrarlo de verdad exige un login, que está fuera de alcance.
--   · No cancela ni reprograma citas (estado 'cancelada' existe para hacerlo a
--     mano desde el dashboard) ni retiene una franja antes de confirmar.
--   · No toca leads: sigue guardando cada correo como hasta ahora.
--   · resultados_diagnostico sigue con INSERT público de todas sus columnas, así
--     que quien conozca un estudiante_id puede insertar un diagnóstico a su
--     nombre. No altera la cita (reservar_franja() elige el diagnóstico por
--     sesion_id, no por estudiante_id), pero es una razón más para el login.
--
-- ADITIVA: solo create/alter/grant. Ningún drop de tabla, ningún delete.
-- Idempotente: correrla dos veces no hace nada la segunda.
--
-- NO reemplaza a supabase/schema.sql, que abre con drop table cascade. Los dos
-- dejan la base en el mismo estado.
--
-- ORDEN QUE IMPORTA:
--   1. Corre esto ANTES de publicar el index.html que lee franjas o llama a
--      rpc('reservar_franja'). Al revés, PostgREST responde 404 y la lectura de
--      franjas falla.
--   2. Requiere que las tablas de las migraciones anteriores existan (monitores,
--      resultados_diagnostico, materias, subtemas). Con un esquema viejo, corre
--      antes 001.
--
-- Cómo correrla: Supabase → SQL Editor → New query → pegar todo → Run.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. estudiantes
-- ----------------------------------------------------------------------------
create table if not exists public.estudiantes (
    id        bigint      generated always as identity primary key,
    -- Se guarda en minúscula y sin espacios en los bordes.
    correo    text        not null,
    telefono  text,
    creado_en timestamptz not null default now()
);

-- Un correo, una fila, sin importar mayúsculas ni espacios de más.
create unique index if not exists estudiantes_correo_norm_idx
    on public.estudiantes (lower(btrim(correo)));

comment on table public.estudiantes is
    'Un estudiante por correo. Sin SELECT público: aquí viven correos y teléfonos.';

-- Un estudiante tiene muchos diagnósticos: cada fila de resultados_diagnostico
-- apunta, si se conoce, a quien la hizo. Se llena en reservar_franja().
alter table public.resultados_diagnostico
    add column if not exists estudiante_id bigint references public.estudiantes (id) on delete set null;

create index if not exists resultados_estudiante_id_idx
    on public.resultados_diagnostico (estudiante_id);

-- ----------------------------------------------------------------------------
-- 2. franjas
-- ----------------------------------------------------------------------------
create table if not exists public.franjas (
    id           bigint      generated always as identity primary key,
    monitor_id   bigint      not null references public.monitores (id) on delete cascade,
    inicia_en    timestamptz not null,
    duracion_min integer     not null default 60 check (duracion_min > 0),
    -- La cambia solo reservar_franja(). El público no tiene UPDATE.
    reservada    boolean     not null default false,
    creado_en    timestamptz not null default now(),
    unique (monitor_id, inicia_en)
);

create index if not exists franjas_monitor_inicia_idx
    on public.franjas (monitor_id, inicia_en);

comment on table public.franjas is
    'Horas en las que un monitor atiende. Lectura pública; se escribe con publicar_franjas() y se reserva con reservar_franja().';

-- ----------------------------------------------------------------------------
-- 3. citas
-- ----------------------------------------------------------------------------
create table if not exists public.citas (
    id                bigint      generated always as identity primary key,
    -- UNIQUE: una franja, una cita. Es la garantía de que no se doble-reserva.
    franja_id         bigint      not null unique references public.franjas (id),
    monitor_id        bigint      not null references public.monitores (id),
    estudiante_id     bigint      not null references public.estudiantes (id),
    -- El diagnóstico más reciente de ese navegador al momento de reservar. Nulo
    -- si el estudiante reservó sin hacer la prueba.
    diagnostico_id    bigint      references public.resultados_diagnostico (id) on delete set null,
    materia_id        bigint      references public.materias (id) on delete set null,
    estado            text        not null default 'confirmada'
                                  check (estado in ('confirmada', 'cancelada', 'realizada')),
    -- Lo escribe la Edge Function del correo para no mandarlo dos veces.
    correo_enviado_en timestamptz,
    creado_en         timestamptz not null default now()
);

create index if not exists citas_monitor_id_idx    on public.citas (monitor_id);
create index if not exists citas_estudiante_id_idx on public.citas (estudiante_id);

comment on table public.citas is
    'La sesión de tutoría: franja + monitor + estudiante + diagnóstico. Sin SELECT público.';

-- ----------------------------------------------------------------------------
-- 4. Row Level Security y privilegios
-- ----------------------------------------------------------------------------
-- Mismo criterio que schema.sql: RLS activo y los privilegios de tabla revocados.
-- Dos capas independientes.
alter table public.estudiantes enable row level security;
alter table public.franjas     enable row level security;
alter table public.citas       enable row level security;

drop policy if exists "franjas_select_publico" on public.franjas;
create policy "franjas_select_publico" on public.franjas
    for select to anon, authenticated using (true);

-- estudiantes y citas: cero políticas. Solo service_role (que omite RLS) y las
-- funciones security definer de abajo las tocan.

revoke all on public.estudiantes from anon, authenticated;
revoke all on public.franjas     from anon, authenticated;
revoke all on public.citas       from anon, authenticated;

grant select on public.franjas to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5. reservar_franja
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
-- 6. publicar_franjas
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
-- 7. brief_cita
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

commit;

-- PostgREST cachea el esquema: las tablas y funciones nuevas no aparecen hasta
-- que recarga. Si el primer intento responde PGRST202 o 404, corre esta línea
-- (o Settings -> API -> Restart server).
notify pgrst, 'reload schema';


-- ============================================================================
-- Comprobación (solo lectura, no modifica nada)
-- ============================================================================
select relname::text as tabla, relrowsecurity as rls_activo,
       (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = c.relname::text) as politicas
from pg_class c
where oid in ('public.estudiantes'::regclass, 'public.franjas'::regclass, 'public.citas'::regclass)
order by relname;
-- Esperado: 3 filas, rls_activo = true; politicas = 0 en estudiantes y citas, 1 en franjas.

select has_table_privilege('anon', 'public.estudiantes', 'select') as anon_lee_estudiantes,
       has_table_privilege('anon', 'public.citas',       'select') as anon_lee_citas,
       has_table_privilege('anon', 'public.brief_cita',  'select') as anon_lee_brief,
       has_table_privilege('anon', 'public.franjas',     'select') as anon_lee_franjas,
       has_table_privilege('anon', 'public.franjas',     'update') as anon_edita_franjas,
       has_function_privilege('anon', 'public.reservar_franja(bigint, text, text, text)', 'execute') as anon_reserva,
       has_function_privilege('anon', 'public.publicar_franjas(text, jsonb)', 'execute') as anon_publica;
-- Esperado: false, false, false, true, false, true, true.

-- El aislamiento de una función security definer depende de QUIÉN la posee: si
-- la función y las tablas no tienen el mismo dueño, la reserva falla con
-- "permission denied" o RLS le esconde las filas.
select p.proname::text as funcion,
       pg_get_userbyid(p.proowner) as dueno_funcion,
       (select pg_get_userbyid(c.relowner) from pg_class c
         where c.oid = 'public.citas'::regclass) as dueno_tabla
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('reservar_franja', 'publicar_franjas')
order by p.proname;
-- Esperado: los dos dueños iguales en las dos filas (normalmente postgres).
