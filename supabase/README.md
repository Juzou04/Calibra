# Calibra — Infraestructura Supabase (Parte 1)

Backend de persistencia del MVP. El contrato de datos (tablas, columnas y RLS)
está definido en [`../esquema.md`](../esquema.md); este directorio lo materializa
y lo verifica.

## Archivos

| Archivo | Para qué |
| --- | --- |
| [`schema.sql`](./schema.sql) | DDL completo: las 13 tablas, la vista `brief_cita`, las funciones de la agenda, RLS, políticas y privilegios. Es lo único que hay que ejecutar para crear la base desde cero. |
| [`migraciones/`](./migraciones/) | Cambios aditivos para un proyecto que ya tiene datos: 001 teléfonos y correo, 002 presentación del monitor, 003 puerta de monitores aprobados, 004 estudiantes, franjas y citas. |
| [`verificar.sql`](./verificar.sql) | Reporte de comprobaciones del esquema (74 filas). Se ejecuta en el editor SQL de Supabase, no modifica nada. |
| [`validar-esquema.mjs`](./validar-esquema.mjs) | Valida el DDL en local, sin proyecto Supabase, sobre un Postgres real en memoria. Opcional. |
| `package.json` | Solo para el validador local. **No afecta al frontend:** `index.html` sigue sin build ni dependencias. |

## Credenciales del proyecto

> ### Estado actual: las claves públicas están abajo, ya pegadas
>
> El proyecto en uso es `uotlhaitdkfroavqkvee`, creado el 17 de septiembre. Usa
> el sistema **nuevo** de llaves de Supabase: la que va en el frontend se llama
> `publishable key` y empieza por `sb_publishable_` en vez de ser un JWT
> `eyJ…`. Cumple el mismo papel que la vieja `anon public key` y se manda en la
> misma cabecera `apikey`; donde este archivo diga "anon key", vale la
> publishable.
>
> La secreta (`sb_secret_…`, el equivalente de la `service_role`) **no está
> aquí y no va al repo**. Se reparte por el chat privado del equipo.

Estas dos son **seguras de comitear y de compartir**. La `anon key` no es un
secreto: va incrustada en el frontend, cualquiera puede leerla desde el navegador,
y lo que la protege es Row Level Security (ver [Modelo de acceso](#modelo-de-acceso)),
no el hecho de estar oculta. Las consumen la Parte 2 (`convertir.js`) y la
Parte 3 (`index.html`).

```
Project URL:      https://uotlhaitdkfroavqkvee.supabase.co
publishable key:  sb_publishable_83zQndnakd4fp5w3NR5zMg_9vwwHobu
```

Dónde sacarlas en el dashboard: **Project Settings → API**. La `Project URL` está
en *Project URL* y la `anon public key` en *Project API keys → `anon` `public`*.

### Quién necesita qué

| Parte | Necesita | De dónde la saca |
| --- | --- | --- |
| Parte 2 · `convertir.js` | `Project URL` + `service_role key` | URL de este archivo; la `service_role` por chat privado |
| Parte 3 · `index.html` | `Project URL` + `anon public key` | Las dos de este archivo |
| Parte 4 · Vercel | nada | el frontend lleva las claves incrustadas |

### La única que no va al repo: `service_role key`

Compártela por el chat privado del equipo con quien trabaje la **Parte 2**, que la
necesita para que `convertir.js` inserte contenido, y que debe leerla desde una
variable de entorno local.

Aunque esto sea un proyecto académico, mantenerla fuera del repo no es
formalismo, son dos problemas prácticos: omite RLS, así que con ella cualquiera
que vea el repo puede leer los correos de `leads` o borrar la base entera; y
GitHub detecta automáticamente las llaves de Supabase en repos públicos y avisa
a Supabase, que la revoca sola — con lo que el pipeline de contenido deja de
funcionar y hay que regenerarla. Si se filtra, revócala en **Project Settings →
API → Reset service_role key** y reparte la nueva.

## Cómo crear la base desde cero

1. Crea un proyecto nuevo en [supabase.com](https://supabase.com) (plan gratuito).
2. En el dashboard, abre **SQL Editor → New query**.
3. Pega el contenido completo de [`schema.sql`](./schema.sql) y ejecútalo (**Run**).
4. Si la base es nueva no hace falta nada más; si ya existía antes del 17 de
   septiembre, corre además
   [`migraciones/001-telefonos-y-correo.sql`](./migraciones/001-telefonos-y-correo.sql),
   que agrega los teléfonos y lo que necesita el correo de confirmación **sin
   borrar nada**.
5. Pega [`verificar.sql`](./verificar.sql) en una consulta nueva y ejecútalo:
   deben salir 74 filas y **todas** con `estado = OK`. (Eran 53 con 10 tablas;
   con las 3 de la agenda y sus comprobaciones son 74.)
6. En **Project Settings → API** copia la `Project URL` y la `publishable key` a
   la sección de arriba de este archivo, y guarda la llave secreta por fuera
   del repo.

`schema.sql` es idempotente (hace `drop table ... cascade` antes de crear), así que
puedes re-ejecutarlo para dejar la base en un estado limpio. **Ojo:** eso borra los
datos existentes; no lo corras sobre una base con datos que quieras conservar.

## Modelo de acceso

Lo que puede hacer el público (rol `anon`, la llave que va en el frontend):

| Tabla | SELECT | INSERT | UPDATE / DELETE |
| --- | :---: | :---: | :---: |
| `materias` | sí | no | no |
| `subtemas` | sí | no | no |
| `preguntas` | sí | no | no |
| `opciones` | sí | no | no |
| `knowledge_components` | sí | no | no |
| `misconcepciones` | sí | no | no |
| `pregunta_kc` | sí | no | no |
| `monitores` | sí | sí | no |
| `resultados_diagnostico` | no | sí | no |
| `leads` | no | sí | no |
| `franjas` | sí | no (usa `publicar_franjas()`) | no (la cambia `reservar_franja()`) |
| `estudiantes` | no | no (lo llena `reservar_franja()`) | no |
| `citas` | no | no (las crea `reservar_franja()`) | no |

El contenido (las 7 tablas de contenido: `materias`, `subtemas`, `preguntas`,
`opciones`, `knowledge_components`, `misconcepciones` y `pregunta_kc`) lo escribe
`convertir.js` con la `service_role key`.

### Agenda: franjas, citas y estudiantes (migración 004)

Antes el horario de un monitor era texto suelto en `index.html` y la sesión que
elegía el estudiante nunca llegaba a la base. Ahora:

- **`franjas`**: las horas concretas en las que un monitor atiende (`inicia_en` +
  `duracion_min`). Un monitor tiene muchas. Lectura pública, para pintar las
  libres.
- **`citas`**: la sesión de tutoría. Une una franja, un monitor, un estudiante y
  el diagnóstico que el monitor necesita ver. Un estudiante tiene muchas citas y
  un monitor también. `franja_id` es `UNIQUE`: una franja no puede tener dos
  citas.
- **`estudiantes`**: una fila por correo. Los diagnósticos
  (`resultados_diagnostico.estudiante_id`) se atan a él al reservar.
- **`reservar_franja(franja_id, correo, telefono, sesion_id)`**: la única puerta
  para reservar. Corre como dueño (`security definer`), bloquea la fila de la
  franja con `select ... for update`, crea al estudiante, ata sus diagnósticos y
  crea la cita en una sola transacción. Devuelve `{"ok": true, ...}` o
  `{"ok": false, "motivo": ...}` con `correo`, `no_existe`, `pasada` u
  `ocupada`. Si dos personas confirman a la vez, la segunda recibe `ocupada`.
- **`publicar_franjas(clave, franjas)`**: el monitor agrega sus franjas con la
  `clave` de su perfil (arreglo JSON de fechas ISO, máximo 20 por llamada).
- **`brief_cita`**: vista con lo que el monitor necesita de cada cita (estudiante,
  franja, subtema débil, error detectado). Solo la lee `service_role`.

**Ojo con el nombre:** `sesion_id` en `leads` y `resultados_diagnostico` es el id
del **navegador**, no una cita. La sesión de tutoría es una fila de `citas`.

**Límite conocido:** `monitores.clave` es de lectura pública, así que quien la lea
puede publicar franjas de ese monitor. Sin autenticación no hay cómo evitarlo;
ya hoy cualquiera puede insertar monitores.

**Para un proyecto que ya está vivo**, corre `migraciones/004-citas-y-franjas.sql`
(no borra nada) **antes** de publicar el `index.html` que lee las franjas. Después
de correrla, `notify pgrst, 'reload schema'` ya va incluido; si el primer intento
responde 404 o `PGRST202`, reinicia la API en *Settings → API*.

### Diagnóstico por knowledge components

`knowledge_components`, `misconcepciones` y `pregunta_kc`, más las columnas
`opciones.misconcepcion_id` y `resultados_diagnostico.kcs`, soportan el
diagnóstico por habilidad (ver `contenido/README.md`). Ya forman parte de
`schema.sql` (13 tablas) y de la base del proyecto, y solo tienen filas las
materias cuyo `.md` declara `kc:`; hoy, Cálculo Integral. No hay nada que
migrar: **no vuelvas a ejecutar `schema.sql` para activarlo**, porque borra los
datos. Para llenarlas basta `convertir.js --supabase` (con `--borradores` si la
base ya tiene los borradores). La lectura de `leads` y `resultados_diagnostico`
también requiere `service_role`, porque esa llave omite RLS.

### Dos capas, no una

Supabase concede por defecto todos los privilegios a `anon` en las tablas nuevas
de `public` y deja que RLS sea la única puerta. Eso es frágil: si alguien
desactiva RLS en una tabla con un clic en el dashboard, `anon` podría listar los
correos de `leads` o borrar filas.

Por eso `schema.sql` además **revoca** esos privilegios y concede solo los de la
tabla de arriba. El límite queda aplicado dos veces, de forma independiente:
política de RLS **y** privilegio de tabla. `service_role` no se toca.

## Verificar el esquema

**En Supabase (sin instalar nada).** Ejecuta [`verificar.sql`](./verificar.sql) en
el editor SQL. Comprueba existencia de tablas, columnas exactas, RLS activo,
políticas exactas, ausencia de políticas de `UPDATE`/`DELETE` y los privilegios
de `anon`. Todas las filas deben decir `OK`.

**En local (sin proyecto Supabase).** Requiere Node:

```bash
cd supabase
npm install
npm run validar
```

Levanta un Postgres real (PGlite, Postgres compilado a WebAssembly) en memoria,
replica los roles de Supabase, ejecuta `schema.sql` y corre 139 comprobaciones,
incluido el comportamiento efectivo de `anon` haciendo `select`, `insert`,
`update` y `delete` en cada tabla, y la agenda de punta a punta: publicar
franjas, reservar, reservar dos veces la misma, una franja pasada, un correo
inválido y un estudiante con varias citas y diagnósticos. La reserva se prueba
con un dueño que no es superusuario, como en Supabase. No toca el proyecto real.

PGlite tiene una sola conexión, así que las dos reservas "simultáneas" se
atienden una tras otra: la prueba confirma que solo gana una, pero el candado de
fila (`for update`) no llega a disputarse de verdad. Esa garantía la da Postgres.

## Limitación conocida del MVP

Sin autenticación, con `insert` público en `monitores`, `resultados_diagnostico` y
`leads` (y con `monitores.clave` legible por todos, que es lo que autoriza publicar
franjas), cualquiera puede crear perfiles de monitor falsos o enviar resultados de
diagnóstico falsos. Es una decisión aceptada para esta iteración y así está
documentada en los riesgos de [`../esquema.md`](../esquema.md); conviene
declararla en la entrega como limitación conocida, no dejarla como descuido.
