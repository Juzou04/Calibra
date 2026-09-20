-- ============================================================================
-- Calibra · migración 002 — presentación del monitor
-- ----------------------------------------------------------------------------
-- Qué agrega, y por qué:
--
--   monitores.presentacion   el texto largo que el propio monitor escribe sobre
--                            cómo trabaja. Va aparte de encaje_texto porque los
--                            dos se pintan en sitios distintos: encaje_texto es
--                            la línea corta de la tarjeta en la lista, y esta
--                            son varios párrafos que solo se ven al abrir el
--                            perfil (E5). Meter párrafos en encaje_texto
--                            desarma la tarjeta y rompe la auditoría de
--                            desbordes a 390 px.
--
-- Es de LECTURA PÚBLICA, como el resto de monitores: lo escribe el monitor para
-- que los estudiantes lo lean. No pongas aquí nada que no deba ser público.
--
-- ADITIVA: solo add column, con `if not exists`. Ningún drop, ningún truncate,
-- ningún delete. Correrla dos veces no hace nada la segunda.
--
-- NO reemplaza a supabase/schema.sql. Ese archivo abre con
-- `drop table ... cascade` y sobre un proyecto con datos reales borra los
-- monitores, los correos y los diagnósticos. schema.sql es para un proyecto
-- NUEVO; esta migración es para uno que ya está vivo. Los dos dejan la base en
-- el mismo estado.
--
-- ORDEN QUE IMPORTA: corre esto ANTES de publicar el index.html que pide la
-- columna nueva. Al revés, PostgREST responde 400 y se cae la lectura completa
-- de monitores, no solo este campo: la app se va a los datos del archivo.
--
-- Cómo correrla: Supabase → SQL Editor → New query → pegar todo → Run.
-- ============================================================================

begin;

alter table public.monitores
    add column if not exists presentacion text;

commit;

-- ----------------------------------------------------------------------------
-- Comprobación: debe devolver una fila con presentacion = text, is_nullable = YES
-- ----------------------------------------------------------------------------
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'monitores'
  and column_name = 'presentacion';
