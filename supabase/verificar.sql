-- ============================================================================
-- Calibra — Verificación del esquema
-- ----------------------------------------------------------------------------
-- Ejecuta este archivo en el editor SQL de Supabase DESPUÉS de correr schema.sql.
-- Devuelve una tabla de comprobaciones contra el contrato de esquema.md.
-- Todas las filas deben decir OK en la columna `estado`.
--
-- No modifica nada: solo lee catálogos del sistema.
-- ============================================================================

with
-- Columnas esperadas por tabla (en orden alfabético, para poder comparar).
esperado_columnas (tabla, columnas) as (
    values
        ('materias',               array['activa','codigo','id','nombre']),
        ('subtemas',               array['clave','id','materia_id','nombre']),
        ('preguntas',              array['dificultad','enunciado','id','numero','subtema_id']),
        ('opciones',               array['error_texto','es_correcta','id','letra','misconcepcion_id','pregunta_id','texto']),
        ('knowledge_components',   array['clave','id','nombre','subtema_id']),
        ('misconcepciones',        array['clave','id','kc_id','texto']),
        ('pregunta_kc',            array['kc_id','pregunta_id']),
        ('monitores',              array['calificacion','carrera','clave','creado_en','encaje_texto','id',
                                         'materia_certificada_id','nivel','nombre','precio_hora','semestre']),
        ('resultados_diagnostico', array['creado_en','error_detectado_texto','id','kcs','materia_id',
                                         'respuestas','sesion_id','subtema_debil_id']),
        ('leads',                  array['correo','correo_enviado_en','creado_en','id','materia_interes',
                                         'monitor_id','rol','sesion_id','telefono'])
),
-- Comandos con política pública esperada por tabla.
esperado_politicas (tabla, comandos) as (
    values
        ('materias',               array['SELECT']),
        ('subtemas',               array['SELECT']),
        ('preguntas',              array['SELECT']),
        ('opciones',               array['SELECT']),
        ('knowledge_components',   array['SELECT']),
        ('misconcepciones',        array['SELECT']),
        ('pregunta_kc',            array['SELECT']),
        ('monitores',              array['INSERT','SELECT']),
        ('resultados_diagnostico', array['INSERT']),
        ('leads',                  array['INSERT'])
),
-- Privilegios esperados del rol anon por tabla.
esperado_privilegios (tabla, privilegios) as (
    values
        ('materias',               array['SELECT']),
        ('subtemas',               array['SELECT']),
        ('preguntas',              array['SELECT']),
        ('opciones',               array['SELECT']),
        ('knowledge_components',   array['SELECT']),
        ('misconcepciones',        array['SELECT']),
        ('pregunta_kc',            array['SELECT']),
        ('monitores',              array['INSERT','SELECT']),
        ('resultados_diagnostico', array['INSERT']),
        ('leads',                  array['INSERT'])
),

-- 1. Existencia de las 10 tablas.
chk_tablas as (
    select
        1 as orden,
        'tabla existe: ' || e.tabla                as chequeo,
        'presente'                                as esperado,
        coalesce(t.table_name::text, 'AUSENTE')   as encontrado,
        case when t.table_name is null then 'FALLA' else 'OK' end as estado
    from esperado_columnas e
    left join information_schema.tables t
           on t.table_schema = 'public' and t.table_name::text = e.tabla
),

-- 2. Columnas exactas por tabla.
-- Los catálogos de information_schema devuelven `sql_identifier`, así que hay que
-- convertir a text para poder comparar contra los arreglos esperados.
reales_columnas as (
    select
        table_name::text as tabla,
        array_agg(column_name::text order by column_name::text) as columnas
    from information_schema.columns
    where table_schema = 'public'
      and table_name::text in (select tabla from esperado_columnas)
    group by table_name::text
),
chk_columnas as (
    select
        2 as orden,
        'columnas de ' || e.tabla                          as chequeo,
        array_to_string(e.columnas, ', ')                   as esperado,
        coalesce(array_to_string(r.columnas, ', '), 'AUSENTE') as encontrado,
        case when r.columnas = e.columnas then 'OK' else 'FALLA' end as estado
    from esperado_columnas e
    left join reales_columnas r on r.tabla = e.tabla
),

-- 3. RLS activo en las 10 tablas.
chk_rls as (
    select
        3 as orden,
        'RLS activo en ' || e.tabla as chequeo,
        'activo'                    as esperado,
        case
            when c.oid is null            then 'TABLA AUSENTE'
            when c.relrowsecurity        then 'activo'
            else 'INACTIVO'
        end as encontrado,
        case when coalesce(c.relrowsecurity, false) then 'OK' else 'FALLA' end as estado
    from esperado_columnas e
    left join pg_class c
           on c.relname = e.tabla
          and c.relnamespace = 'public'::regnamespace
),

-- 4. Políticas exactas por tabla.
reales_politicas as (
    select
        tablename::text as tabla,
        array_agg(distinct cmd::text order by cmd::text) as comandos
    from pg_policies
    where schemaname = 'public'
      and tablename::text in (select tabla from esperado_politicas)
    group by tablename::text
),
chk_politicas as (
    select
        4 as orden,
        'políticas de ' || e.tabla                            as chequeo,
        array_to_string(e.comandos, ', ')                     as esperado,
        coalesce(array_to_string(r.comandos, ', '), 'NINGUNA') as encontrado,
        case when r.comandos = e.comandos then 'OK' else 'FALLA' end as estado
    from esperado_politicas e
    left join reales_politicas r on r.tabla = e.tabla
),

-- 5. Ninguna política de UPDATE / DELETE / ALL en ninguna tabla.
chk_sin_escritura as (
    select
        5 as orden,
        'sin políticas de UPDATE/DELETE/ALL' as chequeo,
        'ninguna'                            as esperado,
        coalesce(
            (select string_agg(tablename || '/' || cmd, ', ')
             from pg_policies
             where schemaname = 'public' and cmd in ('UPDATE', 'DELETE', 'ALL')),
            'ninguna') as encontrado,
        case when exists (
            select 1 from pg_policies
            where schemaname = 'public' and cmd in ('UPDATE', 'DELETE', 'ALL')
        ) then 'FALLA' else 'OK' end as estado
),

-- 6. Privilegios del rol anon (segunda capa de defensa).
reales_privilegios as (
    select
        table_name::text as tabla,
        array_agg(distinct privilege_type::text order by privilege_type::text) as privilegios
    from information_schema.role_table_grants
    where table_schema = 'public'
      and grantee::text = 'anon'
      and table_name::text in (select tabla from esperado_privilegios)
    group by table_name::text
),
chk_privilegios as (
    select
        6 as orden,
        'privilegios de anon en ' || e.tabla                     as chequeo,
        array_to_string(e.privilegios, ', ')                      as esperado,
        coalesce(array_to_string(r.privilegios, ', '), 'ninguno')  as encontrado,
        case when coalesce(r.privilegios, array[]::text[]) = e.privilegios
             then 'OK' else 'FALLA' end as estado
    from esperado_privilegios e
    left join reales_privilegios r on r.tabla = e.tabla
),

-- 7. anon no debe poder leer leads ni resultados_diagnostico.
chk_leads as (
    select
        7 as orden,
        'anon sin SELECT en ' || t                as chequeo,
        'sin privilegio'                          as esperado,
        case when has_table_privilege('anon', 'public.' || t, 'SELECT')
             then 'TIENE SELECT' else 'sin privilegio' end as encontrado,
        case when has_table_privilege('anon', 'public.' || t, 'SELECT')
             then 'FALLA' else 'OK' end as estado
    from (values ('leads'), ('resultados_diagnostico')) as x(t)
)

select chequeo, esperado, encontrado, estado
from (
    select * from chk_tablas
    union all select * from chk_columnas
    union all select * from chk_rls
    union all select * from chk_politicas
    union all select * from chk_sin_escritura
    union all select * from chk_privilegios
    union all select * from chk_leads
) reporte
order by orden, chequeo;
