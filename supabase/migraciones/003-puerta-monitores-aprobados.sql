-- ============================================================================
-- Calibra · migración 003 — puerta "ya hice la evaluación presencial"
-- ----------------------------------------------------------------------------
-- Va numerada 003 porque supabase/migraciones/ ya tiene 001 y 002.
--
-- Qué agrega, y por qué:
--
--   monitores_aprobados        lista de candidatos que el equipo ya aprobó en la
--                              evaluación presencial. SIN SELECT público, por el
--                              mismo criterio que leads.telefono: un teléfono es
--                              dato personal y no puede quedar descargable con
--                              la llave publicable que viaja en el HTML.
--   gate_intentos              bitácora. SIN SELECT público. NO guarda el número
--                              completo: solo los últimos 4 dígitos, que es todo
--                              lo que hace falta para frenar a quien enumera.
--   normalizar_telefono()      +57, espacios, guiones y paréntesis colapsados a
--                              los últimos 10 dígitos.
--   verificar_monitor_aprobado()  security definer. Recibe el teléfono, devuelve
--                              un jsonb con un booleano, el nombre, la materia y
--                              un pase. Nunca devuelve la lista ni el conteo.
--
-- LO QUE ESTA MIGRACIÓN NO HACE, a propósito:
--   · El pase NO se escribe en monitores.clave. Esa columna la usa la Edge
--     Function enviar-correo para llegar al teléfono del monitor por
--     leads.sesion_id = monitores.clave (supabase/functions/enviar-correo/
--     index.ts:229-231). Pisarla rompe el correo de confirmación. El pase vuelve
--     al navegador solo como acuse; la trazabilidad de quién publicó vive en
--     monitores_aprobados.usos y .ultimo_uso_en.
--   · No cierra el INSERT público en monitores. Con la llave publicable de
--     index.html:1851 cualquiera puede seguir haciendo POST /rest/v1/monitores.
--     Esta es una puerta de FLUJO, no de autorización. Cerrarlo de verdad exige
--     una segunda función que valide el pase y quitar la política
--     monitores_insert_publico (supabase/schema.sql:220-221 y grant de :270).
--
-- ADITIVA: solo create/alter/grant. Ningún drop de tabla, ningún delete.
-- Idempotente: correrla dos veces no hace nada la segunda.
--
-- NO reemplaza a supabase/schema.sql, que abre con drop table cascade.
--
-- ORDEN QUE IMPORTA, dos cosas:
--   1. Corre esto ANTES de publicar el index.html que llama a
--      rpc('verificar_monitor_aprobado'). Al revés, PostgREST responde 404
--      PGRST202 y la pantalla rechaza a todo el mundo.
--   2. Corre `node contenido/convertir.js --supabase` ANTES de aprobar a nadie.
--      La función valida materia_codigo contra public.materias, y hoy esa tabla
--      está vacía: con la tabla vacía, TODO intento responde 'materia_invalida'.
--      Eso es a propósito (falla cerrado en vez de publicar un monitor en la
--      materia equivocada), pero hay que saberlo.
--
-- Cómo correrla: Supabase → SQL Editor → New query → pegar todo → Run.
-- Cómo aprobar a alguien: Table Editor → monitores_aprobados → Insert row →
-- telefono (como lo tengas escrito), nombre, materia_codigo (el codigo exacto de
-- materias, p. ej. MATE-1214). telefono_norm la calcula un trigger; si el número
-- no queda en 10 dígitos que empiecen por 3 o 6, el insert FALLA en tu cara en
-- vez de guardar una fila muerta.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Normalización del teléfono
-- ----------------------------------------------------------------------------
-- Se queda con los dígitos y devuelve los últimos 10: el número nacional
-- significativo en Colombia desde 2022 (celular 3XX XXX XXXX, fijo 60X XXX XXXX).
-- "+57 300 123 4567", "57-300-123-4567", "(300) 1234567" y "3001234567" caen
-- todos en '3001234567'. Con menos de 10 dígitos devuelve lo que haya, y es el
-- CHECK de la tabla el que lo rechaza.
create or replace function public.normalizar_telefono(p_valor text)
returns text
language sql
immutable
set search_path = pg_catalog, public
as $func$
    select case
             when length(d) >= 10 then right(d, 10)
             else nullif(d, '')
           end
    from (select regexp_replace(coalesce(p_valor, ''), '[^0-9]', '', 'g') as d) s;
$func$;

comment on function public.normalizar_telefono(text) is
    'Teléfono escrito a mano -> últimos 10 dígitos. Pura, sin acceso a tablas.';

-- Nadie de fuera necesita llamarla: la usa el trigger y la función de la puerta,
-- que corren como dueño. Dejarla abierta solo añadiría otro endpoint /rpc/.
revoke all on function public.normalizar_telefono(text) from public;

-- ----------------------------------------------------------------------------
-- 2. monitores_aprobados
-- ----------------------------------------------------------------------------
create table if not exists public.monitores_aprobados (
    id              bigint      generated always as identity primary key,
    -- El teléfono tal como lo escriba quien aprueba. No se le pide formato.
    telefono        text        not null,
    -- La forma con la que de verdad se compara. La llena un trigger y NO es una
    -- columna generada: una generada rechaza cualquier insert que mande la
    -- columna ("cannot insert a non-DEFAULT value"), y el panel Insert row del
    -- dashboard la manda. Con trigger, mande lo que mande, se sobrescribe.
    telefono_norm   text,
    nombre          text,
    -- Código de materia de materias.codigo, p. ej. 'MATE-1214'. Texto y no llave
    -- foránea: el equipo aprueba desde el dashboard y una FK inválida tumbaría
    -- la fila entera. La validación la hace la función, que además devuelve el
    -- nombre de la materia para poder mostrarlo antes de publicar.
    materia_codigo  text,
    aprobado        boolean     not null default true,
    -- Cuántos perfiles puede publicar este número. 3 y no 1 porque el uso se
    -- gasta al VERIFICAR, no al publicar: si se cae la red o se cierra la
    -- pestaña, el monitor legítimo necesita poder volver a entrar.
    usos_maximos    integer     not null default 3,
    usos            integer     not null default 0,
    -- Acuse del último intento con éxito. NO se escribe en monitores.clave.
    pase            text,
    nota            text,
    creado_en       timestamptz not null default now(),
    ultimo_uso_en   timestamptz
);

-- Por si la tabla ya existía de un borrador anterior.
alter table public.monitores_aprobados add column if not exists telefono_norm  text;
alter table public.monitores_aprobados add column if not exists nombre         text;
alter table public.monitores_aprobados add column if not exists materia_codigo text;
alter table public.monitores_aprobados add column if not exists aprobado       boolean not null default true;
alter table public.monitores_aprobados add column if not exists usos_maximos   integer not null default 3;
alter table public.monitores_aprobados add column if not exists usos           integer not null default 0;
alter table public.monitores_aprobados add column if not exists pase           text;
alter table public.monitores_aprobados add column if not exists nota           text;
alter table public.monitores_aprobados add column if not exists ultimo_uso_en  timestamptz;
-- Si una corrida vieja la dejó como columna generada, se le quita la expresión.
alter table public.monitores_aprobados alter column telefono_norm drop expression if exists;

comment on table public.monitores_aprobados is
    'Candidatos que pasaron la evaluación presencial. Sin SELECT público: aquí viven teléfonos.';

create or replace function public.monitores_aprobados_normalizar()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $func$
begin
    new.telefono_norm := public.normalizar_telefono(new.telefono);
    return new;
end;
$func$;

drop trigger if exists monitores_aprobados_normalizar_tg on public.monitores_aprobados;
create trigger monitores_aprobados_normalizar_tg
    before insert or update of telefono on public.monitores_aprobados
    for each row execute function public.monitores_aprobados_normalizar();

-- Falla RUIDOSA en vez de fila muerta. Sin esto, "300 123 4567 ext 12" se
-- guarda como 0123456712 y el monitor legítimo recibe 'no_esta' para siempre.
do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'monitores_aprobados_norm_ck') then
        alter table public.monitores_aprobados
            add constraint monitores_aprobados_norm_ck
            check (telefono_norm is not null and telefono_norm ~ '^[36][0-9]{9}$');
    end if;
end $$;

-- Un número, una fila.
create unique index if not exists monitores_aprobados_telefono_norm_idx
    on public.monitores_aprobados (telefono_norm);

-- ----------------------------------------------------------------------------
-- 3. gate_intentos
-- ----------------------------------------------------------------------------
-- Minimización deliberada: NO se guarda el número. Se guardan los últimos 4
-- dígitos, que bastan para contar cuántos números distintos probó una IP y para
-- reconocer un intento propio, y no sirven para reconstruir el teléfono de
-- alguien que ni siquiera es usuario del producto.
create table if not exists public.gate_intentos (
    id             bigint      generated always as identity primary key,
    telefono_pista text,
    -- IP del que llama. cf-connecting-ip la pone Cloudflare y el cliente no la
    -- puede falsificar; si no viene, se usa el ÚLTIMO elemento de
    -- x-forwarded-for (el primero lo escribe el cliente y es falsificable).
    huella         text        not null default '',
    exito          boolean     not null default false,
    motivo         text,
    creado_en      timestamptz not null default now()
);

alter table public.gate_intentos add column if not exists telefono_pista text;
alter table public.gate_intentos add column if not exists motivo         text;

comment on table public.gate_intentos is
    'Bitácora de la puerta. Sin SELECT público. Solo últimos 4 dígitos. Borrar lo de más de 30 días.';

create index if not exists gate_intentos_huella_idx
    on public.gate_intentos (huella, creado_en desc);

-- ----------------------------------------------------------------------------
-- 4. La función de la puerta
-- ----------------------------------------------------------------------------
-- security definer: corre como dueño de la tabla, así que puede mirar la lista
-- aunque anon no tenga ni un privilegio sobre ella. search_path fijo para que
-- nadie pueda anteponer un esquema propio.
create or replace function public.verificar_monitor_aprobado(p_telefono text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $func$
declare
    v_norm      text;
    v_pista     text;
    v_hdr       text;
    v_json      json;
    v_xff       text;
    v_huella    text := '';
    v_distintos integer := 0;
    v_fila      public.monitores_aprobados;
    v_materia   text;
    v_pase      text;
    v_limite    constant integer  := 8;                 -- números distintos por IP
    v_ventana   constant interval := interval '10 minutes';
    v_gracia    constant interval := interval '2 hours';  -- reintento sin gastar uso
begin
    v_norm  := public.normalizar_telefono(p_telefono);
    v_pista := right(coalesce(v_norm, ''), 4);

    begin
        v_hdr := current_setting('request.headers', true);
        if v_hdr is not null and v_hdr <> '' then
            v_json   := v_hdr::json;
            v_huella := coalesce(v_json ->> 'cf-connecting-ip', '');
            if v_huella = '' then
                v_xff := coalesce(v_json ->> 'x-forwarded-for', '');
                if v_xff <> '' then
                    v_huella := split_part(v_xff, ',', array_length(string_to_array(v_xff, ','), 1));
                end if;
            end if;
        end if;
    exception when others then
        v_huella := '';
    end;
    v_huella := btrim(coalesce(v_huella, ''));

    -- 1. Formato. Celular o fijo colombiano, 10 dígitos, 3XX o 60X.
    if v_norm is null or v_norm !~ '^[36][0-9]{9}$' then
        insert into public.gate_intentos (telefono_pista, huella, exito, motivo)
             values (v_pista, v_huella, false, 'formato');
        return jsonb_build_object('aprobado', false, 'motivo', 'formato');
    end if;

    -- 2. Freno por IP. Cuenta NÚMEROS DISTINTOS, no intentos, y no cuenta sus
    --    propias filas de bloqueo: así doce personas detrás del NAT de Uniandes
    --    probando cada una su propio número no se bloquean entre sí, y quien
    --    enumera sí se frena.
    if v_huella <> '' then
        select count(distinct telefono_pista) into v_distintos
        from public.gate_intentos
        where huella = v_huella
          and coalesce(motivo, '') <> 'demasiados_intentos'
          and creado_en > now() - v_ventana;

        if v_distintos >= v_limite then
            insert into public.gate_intentos (telefono_pista, huella, exito, motivo)
                 values (v_pista, v_huella, false, 'demasiados_intentos');
            return jsonb_build_object('aprobado', false, 'motivo', 'demasiados_intentos');
        end if;
    end if;

    -- 3. ¿Está en la lista?
    select * into v_fila
    from public.monitores_aprobados
    where telefono_norm = v_norm
      and aprobado
    for update;

    if v_fila.id is null then
        insert into public.gate_intentos (telefono_pista, huella, exito, motivo)
             values (v_pista, v_huella, false, 'no_esta');
        return jsonb_build_object('aprobado', false, 'motivo', 'no_esta');
    end if;

    -- 4. La materia tiene que existir de verdad. Sin esto, un typo del equipo
    --    ('MATE1214') o la celda vacía publican al monitor en la primera materia
    --    activa de la app, certificado en algo que nunca evaluó.
    select nombre into v_materia
    from public.materias
    where upper(btrim(codigo)) = upper(btrim(coalesce(v_fila.materia_codigo, '')))
    limit 1;

    if v_materia is null then
        insert into public.gate_intentos (telefono_pista, huella, exito, motivo)
             values (v_pista, v_huella, false, 'materia_invalida');
        return jsonb_build_object('aprobado', false, 'motivo', 'materia_invalida');
    end if;

    -- 5. Reintento del mismo número dentro de la ventana de gracia: se devuelve
    --    el MISMO pase y no se gasta otro uso. Cubre el caso real (verificó, se
    --    cayó la red o cerró la pestaña antes de publicar).
    if v_fila.pase is not null and v_fila.ultimo_uso_en is not null
       and v_fila.ultimo_uso_en > now() - v_gracia then
        insert into public.gate_intentos (telefono_pista, huella, exito, motivo)
             values (v_pista, v_huella, true, 'reintento');
        return jsonb_build_object(
            'aprobado',       true,
            'nombre',         v_fila.nombre,
            'materia_codigo', v_fila.materia_codigo,
            'materia_nombre', v_materia,
            'pase',           v_fila.pase);
    end if;

    -- 6. ¿Le quedan usos?
    if v_fila.usos >= v_fila.usos_maximos then
        insert into public.gate_intentos (telefono_pista, huella, exito, motivo)
             values (v_pista, v_huella, false, 'ya_usado');
        return jsonb_build_object('aprobado', false, 'motivo', 'ya_usado');
    end if;

    -- 7. Pasa.
    v_pase := gen_random_uuid()::text;
    update public.monitores_aprobados
       set usos          = usos + 1,
           ultimo_uso_en = now(),
           pase          = v_pase
     where id = v_fila.id;

    insert into public.gate_intentos (telefono_pista, huella, exito, motivo)
         values (v_pista, v_huella, true, 'ok');

    return jsonb_build_object(
        'aprobado',       true,
        'nombre',         v_fila.nombre,
        'materia_codigo', v_fila.materia_codigo,
        'materia_nombre', v_materia,
        'pase',           v_pase);
end;
$func$;

comment on function public.verificar_monitor_aprobado(text) is
    'Puerta de la pantalla "ya hice la evaluación presencial". Devuelve booleano, nombre, materia y pase; nunca la lista.';

-- ----------------------------------------------------------------------------
-- 5. Row Level Security y privilegios
-- ----------------------------------------------------------------------------
-- Mismo criterio que schema.sql:236-257: RLS activo y CERO políticas, más los
-- privilegios revocados. Dos capas independientes.
alter table public.monitores_aprobados enable row level security;
alter table public.gate_intentos       enable row level security;

revoke all on public.monitores_aprobados from anon, authenticated;
revoke all on public.gate_intentos       from anon, authenticated;

-- Lo único que anon puede hacer con esto es llamar a la función.
revoke all on function public.verificar_monitor_aprobado(text) from public;
grant execute on function public.verificar_monitor_aprobado(text) to anon, authenticated;

commit;

-- PostgREST cachea el esquema: una función nueva no aparece hasta que recarga.
-- Si el primer intento responde PGRST202 "Could not find the function", corre
-- esta línea (o Settings -> API -> Restart server).
notify pgrst, 'reload schema';


-- ============================================================================
-- Comprobación (solo lectura, no modifica nada)
-- ============================================================================
select 'normalizacion' as chequeo, entrada, public.normalizar_telefono(entrada) as salida
from (values ('+57 300 123 4567'), ('57-300-123-4567'), ('(300) 1234567'),
             ('3001234567'), ('300.123.4567'), ('0057 300 123 4567'),
             ('601 234 5678'), ('2345678'), ('abc'), ('')) v(entrada);
-- Esperado: las seis primeras -> 3001234567; 601 234 5678 -> 6012345678;
--           2345678 -> 2345678 (y el CHECK lo rechazaría); 'abc' y '' -> null.

select relname::text as tabla, relrowsecurity as rls_activo,
       (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = c.relname::text) as politicas
from pg_class c
where oid in ('public.monitores_aprobados'::regclass, 'public.gate_intentos'::regclass);
-- Esperado: 2 filas, rls_activo = true, politicas = 0.

select has_table_privilege('anon', 'public.monitores_aprobados', 'select') as anon_lee_aprobados,
       has_table_privilege('anon', 'public.gate_intentos',       'select') as anon_lee_intentos,
       has_function_privilege('anon', 'public.verificar_monitor_aprobado(text)', 'execute') as anon_ejecuta;
-- Esperado: false, false, true.

-- El aislamiento de una función security definer depende de QUIÉN la posee: si
-- la función y la tabla no tienen el mismo dueño, la puerta rechaza a todos.
select p.proname::text as funcion,
       pg_get_userbyid(p.proowner) as dueno_funcion,
       (select pg_get_userbyid(c.relowner) from pg_class c
         where c.oid = 'public.monitores_aprobados'::regclass) as dueno_tabla
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'verificar_monitor_aprobado';
-- Esperado: los dos dueños iguales (normalmente postgres).

-- Retención. Correr a mano de vez en cuando, o dejarlo en un cron de Supabase.
-- delete from public.gate_intentos where creado_en < now() - interval '30 days';
