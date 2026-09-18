# Integración final

Pasos para juntar las cuatro partes en `main`, conectar Supabase y publicar en Vercel. Cada paso termina con una comprobación; si no pasa, no se sigue.

## Estado al 17 de septiembre

| Parte | Dónde está | Estado |
| --- | --- | --- |
| 1 · Supabase | `main` (PR #1) | Fusionada. El esquema oficial es `supabase/schema.sql`. |
| 2 · Contenido a Supabase | `main` (PR #6) | Fusionada. `convertir.js --supabase`. |
| 3 · `index.html` con Supabase | `main` (PR #6) | Fusionada. Verificada contra un proyecto simulado. |
| 4 · Arnés y Vercel | `main` (PR #6 y #7) | Arnés y `.vercelignore` listos. La rama por defecto ya es `main`; falta el proyecto en Vercel. |
| 5 · Teléfonos y correo de confirmación | `main` | Código y migración listos. Falta correr la migración y desplegar la Edge Function. |

La rama `prueba-cuestionario` es un experimento aparte: cambia `index.html`, `verificar.js` y lleva el esquema a 10 tablas. Git la fusiona con `juzouy` sin conflictos de texto, pero las dos tocan el motor de la prueba y ella además cambia la base. No se fusiona en esta entrega sin decidirlo en equipo y sin correr el arnés sobre el resultado.

Los dos archivos sueltos `supabase-schema.sql` y `supabase-seed-data.sql` que hay en algunas copias locales son un borrador viejo con otras columnas. No se usan.

## 1. Fusionar en `main`

Por pull request en GitHub, en este orden: primero `dvarela5101`, después `juzouy`. Se simularon los dos merges con `git merge-tree` y ninguno da conflictos.

Comprobación: `git log --oneline origin/main` muestra los dos merges.

## 2. Proyecto de Supabase

El proyecto existe: `uotlhaitdkfroavqkvee`, creado el 17 de septiembre. Al 17 de
septiembre a las 22:00 **no tiene ni una tabla**: un `GET /rest/v1/materias`
responde `PGRST205`, o sea que la llave autentica bien pero el esquema no está.

1. En el editor SQL, ejecutar `supabase/schema.sql` completo (crea las 10 tablas,
   RLS y privilegios). Después, `supabase/migraciones/001-telefonos-y-correo.sql`.
   Al final, `supabase/verificar.sql`: tienen que salir 53 filas, todas en `OK`.
2. Hecho: la `Project URL` y la `publishable key` ya están en `supabase/README.md`
   y en las constantes `SUPABASE_URL` y `SUPABASE_ANON_KEY` de `index.html`
   (bloque "1b. Supabase"). Este proyecto usa el sistema nuevo de llaves, así que
   la que va en el frontend se llama `publishable` (`sb_publishable_…`) y no
   `anon`; se manda en la misma cabecera y hace lo mismo.
3. La llave secreta (`sb_secret_…`, equivalente de la `service_role`) va solo en
   el `.env` local de quien corre `convertir.js` y en los secretos de la Edge
   Function. Nunca en el repo ni en `index.html`.

Comprobación: abrir `index.html` con doble clic y escribir en la consola del navegador `window.__calibraSupabaseEstado`. Debe decir `"conectado"`. Si dice `"sin-conexion"`, la URL o la llave están mal; la app sigue funcionando con los datos del archivo.

## 2b. Teléfonos y correo de confirmación

El código ya está en `main`. Lo que falta es la base y la función:

1. Correr `supabase/migraciones/001-telefonos-y-correo.sql` (paso 1 de arriba).
   **Antes de publicar el sitio con el `index.html` de este commit**: si el front
   manda `telefono` y la columna no existe, PostgREST responde `PGRST204` y el
   insert de `leads` se cae entero, o sea que se pierde el correo, no solo el
   teléfono. La app solo hace `console.warn` y agradece igual, así que el fallo
   es invisible.
2. Desplegar la Edge Function y crear el webhook siguiendo
   `supabase/functions/enviar-correo/README.md`.

Comprobación: en el sitio publicado, hacer la prueba, elegir un monitor y dejar
correo y celular. En el Table Editor tiene que aparecer una fila en `leads` con
`telefono`, `monitor_id` y `sesion_id` llenos, y una en
`resultados_diagnostico` con el mismo `sesion_id`. Si la función ya está
desplegada, el correo llega en menos de un minuto y `correo_enviado_en` queda
con fecha.

Lo que este correo **no** hace: no agenda una hora (la app no tiene agenda; el
correo pide acordarla con el monitor y le pasa su número), y el diagnóstico
detallado por knowledge components solo existe en Cálculo Integral.

## 3. Contenido a la base

Antes de subir, agregar `longitud: 12` al frontmatter de `contenido/calculo-vectorial.md`. Hoy le falta esa línea y su prueba queda en 4 preguntas mientras las otras seis usan 12. El arnés lo avisa al final de cada corrida.

```bash
node --env-file=.env contenido/convertir.js --supabase --dry-run
node --env-file=.env contenido/convertir.js --supabase
```

Comprobación en el Table Editor de Supabase: 7 materias, 84 preguntas y 336 opciones.

## 4. Vercel

1. En GitHub, Settings, Branches: cambiar la rama por defecto a `main`. Hoy es `juzouy`.
2. En Vercel: Add New, Project, importar `dvarela5101/Calibra`. Framework Preset "Other", Root Directory `./`, sin Build Command. Rama de producción: `main`.
3. `.vercelignore` deja fuera los documentos, las pruebas, el contenido fuente y el SQL. El sitio publicado sirve solo `index.html`.

Comprobación: abrir la URL de Vercel en el celular, hacer la prueba completa y dejar un correo en la pantalla final.

## 5. Verificación antes de entregar

```bash
verificar.cmd
```

Con las credenciales reales puestas, el arnés lee la base de verdad pero retiene las escrituras: los correos, perfiles y diagnósticos de prueba no llegan a Supabase. Si retuvo alguna, lo dice en un aviso al final. El bloque "Supabase simulado" usa un proyecto falso y no depende del real. Necesita internet para bajar `supabase-js` del CDN.

Prueba de humo en el sitio publicado, después de la del paso 4: en el Table Editor tiene que aparecer una fila nueva en `leads` y otra en `resultados_diagnostico`.

## Limitaciones que conviene declarar en la entrega

- Sin autenticación, cualquiera puede insertar monitores, correos y diagnósticos falsos. Está aceptado en `esquema.md`.
- `leads.rol` solo admite `estudiante` y `monitor`. Los correos del canal profesor se agradecen pero no se guardan. Para guardarlos hay que ampliar ese `check` en `supabase/schema.sql`.
- El teléfono ya se guarda en `leads.telefono`: lo pide E6 (estudiante), M2.5 y R1 (monitor). Sigue siendo opcional, así que puede llegar vacío.
- El teléfono del monitor vive en `leads`, no en `monitores`, porque `monitores` tiene lectura pública: ahí quedaría descargable con la llave que va en el HTML. El lazo entre los dos es `monitores.clave` = `leads.sesion_id`.
- La app no agenda una hora concreta: no hay tabla de citas ni selección de fecha. El correo de confirmación pide acordarla con el monitor.
- `monitores` no guarda subtemas fuertes, horarios ni número de reseñas. Los perfiles creados desde la app aparecen sin eso.
- El plan gratuito de Supabase pausa el proyecto tras una semana sin actividad.
