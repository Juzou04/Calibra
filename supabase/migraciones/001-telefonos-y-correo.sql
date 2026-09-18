-- ============================================================================
-- Calibra · migración 001 — teléfonos y correo de confirmación
-- ----------------------------------------------------------------------------
-- Qué agrega, y por qué:
--
--   leads.telefono           el celular que hoy se pide en M2.5 y en E6 y se
--                            tira a la basura. Va aquí y no en monitores
--                            porque leads NO tiene SELECT público: el número
--                            no queda descargable con la llave publicable que
--                            viaja en el HTML.
--   leads.monitor_id         el monitor que eligió el estudiante.
--   leads.sesion_id          ata el correo con el diagnóstico de esa misma
--                            sesión, y —cuando el rol es monitor— con la fila
--                            de monitores que publicó ese navegador.
--   leads.correo_enviado_en  lo escribe la Edge Function para no mandar el
--                            correo dos veces.
--   resultados_diagnostico.sesion_id   el otro extremo de ese lazo.
--   monitores.clave          clave pública del perfil (un uuid, no dice nada
--                            de nadie). Con ella la función encuentra en leads
--                            el teléfono de ese monitor.
--
-- ADITIVA: solo add column, add constraint, create index. Ningún drop, ningún
-- truncate, ningún delete. Todo va con `if not exists`, así que correrla dos
-- veces no hace nada la segunda.
--
-- NO reemplaza a supabase/schema.sql. Ese archivo abre con
-- `drop table ... cascade` y sobre un proyecto con datos reales borra los
-- correos, los teléfonos y los diagnósticos. schema.sql es para un proyecto
-- NUEVO; esta migración es para uno que ya está vivo. Los dos dejan la base en
-- el mismo estado.
--
-- ORDEN QUE IMPORTA: corre esto ANTES de publicar el index.html que manda las
-- columnas nuevas. Al revés, PostgREST responde 400 PGRST204, el insert de
-- leads se cae completo y se pierde el correo, no solo el teléfono (la app solo
-- hace console.warn y agradece igual).
--
-- Cómo correrla: Supabase → SQL Editor → New query → pegar todo → Run.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- leads
-- ----------------------------------------------------------------------------
-- Sin check de formato a propósito: el formato se valida en el front. Un check
-- que rechace "300" haría fallar el insert entero, que es justo lo que se
-- quiere dejar de perder.
alter table public.leads add column if not exists telefono          text;
alter table public.leads add column if not exists monitor_id        bigint;
alter table public.leads add column if not exists sesion_id         text;
alter table public.leads add column if not exists correo_enviado_en timestamptz;

-- La llave foránea va aparte para poder saltarla si ya existe.
do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.leads'::regclass
          and conname  = 'leads_monitor_id_fkey'
    ) then
        alter table public.leads
            add constraint leads_monitor_id_fkey
            foreign key (monitor_id) references public.monitores (id)
            on delete set null;
    end if;
end
$$;

-- ----------------------------------------------------------------------------
-- resultados_diagnostico y monitores
-- ----------------------------------------------------------------------------
alter table public.resultados_diagnostico add column if not exists sesion_id text;
alter table public.monitores              add column if not exists clave     text;

-- ----------------------------------------------------------------------------
-- Índices
-- ----------------------------------------------------------------------------
-- Una llave foránea no crea el suyo: sin esto, cada delete en monitores
-- escanea leads entero. Los otros tres los usa la función del correo.
create index if not exists leads_monitor_id_idx      on public.leads (monitor_id);
create index if not exists leads_sesion_id_idx       on public.leads (sesion_id);
create index if not exists resultados_sesion_id_idx  on public.resultados_diagnostico (sesion_id);
create index if not exists monitores_clave_idx       on public.monitores (clave);

-- ----------------------------------------------------------------------------
-- Permisos: no hay nada que cambiar
-- ----------------------------------------------------------------------------
-- Los grants de schema.sql son a nivel de TABLA y cubren las columnas que se
-- agreguen después. Las políticas de insert son `with check (true)` y no
-- nombran columnas. leads sigue sin SELECT público: agregar columnas no cambia
-- eso, y por eso el teléfono queda privado.
--
-- Estas dos líneas son idempotentes y están solo por si alguien pasó los grants
-- a nivel de columna desde el dashboard.
grant insert on public.leads     to anon, authenticated;
grant insert on public.monitores to anon, authenticated;

commit;

-- PostgREST cachea el esquema. Supabase suele recargarlo solo, pero si el
-- primer insert responde
--   PGRST204 "Could not find the 'telefono' column of 'leads' in the schema cache"
-- corre esta línea (o Settings → API → Restart server).
notify pgrst, 'reload schema';


-- ============================================================================
-- Comprobación (solo lectura, no modifica nada)
-- ============================================================================
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and (table_name::text, column_name::text) in (
        ('leads',                  'telefono'),
        ('leads',                  'monitor_id'),
        ('leads',                  'sesion_id'),
        ('leads',                  'correo_enviado_en'),
        ('resultados_diagnostico', 'sesion_id'),
        ('monitores',              'clave')
      )
order by table_name, column_name;
-- Esperado: 6 filas, todas con is_nullable = YES.

select conname, pg_get_constraintdef(oid) as definicion
from pg_constraint
where conrelid = 'public.leads'::regclass and contype = 'f';
-- Esperado: leads_monitor_id_fkey FOREIGN KEY (monitor_id)
--           REFERENCES monitores(id) ON DELETE SET NULL

-- Después de esto, corre supabase/verificar.sql: tiene que dar 53 filas, todas
-- en OK. Si "columnas de leads" o "columnas de monitores" salen en FALLA, el
-- index.html y el verificar.sql del repo no son los de este commit.
