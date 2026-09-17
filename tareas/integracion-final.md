# Integración final

Pasos para juntar las cuatro partes en `main`, conectar Supabase y publicar en Vercel. Cada paso termina con una comprobación; si no pasa, no se sigue.

## Estado al 16 de septiembre

| Parte | Dónde está | Estado |
| --- | --- | --- |
| 1 · Supabase | `main` (PR #1) | Fusionada. El esquema oficial es `supabase/schema.sql`, con 7 tablas. |
| 2 · Contenido a Supabase | rama `dvarela5101` | Lista, sin fusionar. `convertir.js --supabase`. |
| 3 · `index.html` con Supabase | rama `juzouy` | Lista, sin fusionar. Verificada contra un proyecto simulado. |
| 4 · Arnés y Vercel | rama `juzouy` | Arnés y `.vercelignore` listos. Faltan la rama por defecto y el proyecto en Vercel. |

La rama `prueba-cuestionario` es un experimento aparte: cambia `index.html`, `verificar.js` y lleva el esquema a 10 tablas. Git la fusiona con `juzouy` sin conflictos de texto, pero las dos tocan el motor de la prueba y ella además cambia la base. No se fusiona en esta entrega sin decidirlo en equipo y sin correr el arnés sobre el resultado.

Los dos archivos sueltos `supabase-schema.sql` y `supabase-seed-data.sql` que hay en algunas copias locales son un borrador viejo con otras columnas. No se usan.

## 1. Fusionar en `main`

Por pull request en GitHub, en este orden: primero `dvarela5101`, después `juzouy`. Se simularon los dos merges con `git merge-tree` y ninguno da conflictos.

Comprobación: `git log --oneline origin/main` muestra los dos merges.

## 2. Proyecto de Supabase

Si todavía no existe, se crea siguiendo `supabase/README.md`. Si ya existe, basta con verificarlo.

1. En el editor SQL, ejecutar `supabase/verificar.sql`. Tienen que salir 38 filas, todas en `OK`.
2. Copiar la `Project URL` y la `anon public key` en dos sitios: la sección de credenciales de `supabase/README.md` y las constantes `SUPABASE_URL` y `SUPABASE_ANON_KEY` de `index.html` (bloque "1b. Supabase", al inicio del `<script>`). Las dos son públicas por diseño.
3. La `service_role key` va solo en el `.env` local de quien corre `convertir.js`. Nunca en el repo ni en `index.html`.

Comprobación: abrir `index.html` con doble clic y escribir en la consola del navegador `window.__calibraSupabaseEstado`. Debe decir `"conectado"`. Si dice `"sin-conexion"`, la URL o la llave están mal; la app sigue funcionando con los datos del archivo.

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
- El teléfono opcional que pide la pantalla de correo del monitor no se guarda, porque `leads` no tiene esa columna.
- `monitores` no guarda subtemas fuertes, horarios ni número de reseñas. Los perfiles creados desde la app aparecen sin eso.
- El plan gratuito de Supabase pausa el proyecto tras una semana sin actividad.
