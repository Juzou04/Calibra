# Calibra — Infraestructura Supabase (Parte 1)

Backend de persistencia del MVP. El contrato de datos (tablas, columnas y RLS)
está definido en [`../esquema.md`](../esquema.md); este directorio lo materializa
y lo verifica.

## Archivos

| Archivo | Para qué |
| --- | --- |
| [`schema.sql`](./schema.sql) | DDL completo: las 7 tablas, RLS, políticas y privilegios. Es lo único que hay que ejecutar para crear la base. |
| [`verificar.sql`](./verificar.sql) | Reporte de 38 comprobaciones del esquema. Se ejecuta en el editor SQL de Supabase, no modifica nada. |
| [`validar-esquema.mjs`](./validar-esquema.mjs) | Valida el DDL en local, sin proyecto Supabase, sobre un Postgres real en memoria. Opcional. |
| `package.json` | Solo para el validador local. **No afecta al frontend:** `index.html` sigue sin build ni dependencias. |

## Credenciales del proyecto

> ### ⚠️ El proyecto de Supabase todavía no existe. No hay claves que pedir.
>
> Nadie las tiene guardadas: **no se ha creado el proyecto en Supabase**, así que
> la `Project URL` y la `anon public key` aún no existen. No hay que pedírselas a
> nadie del equipo.
>
> **No necesitas esperar a nadie para desplegar.** Con las claves vacías la app
> funciona completa en modo demo, con las 7 materias y las 84 preguntas que ya
> viven en `index.html`. Vercel sirve un archivo estático: la base de datos es
> opcional. Ver [¿Se puede desplegar sin base de
> datos?](#se-puede-desplegar-sin-base-de-datos).
>
> **Y no depende de una persona en particular.** Cualquiera del equipo con este
> repo puede crear el proyecto en unos 5 minutos siguiendo [Crear el proyecto de
> cero](#crear-el-proyecto-de-cero): el esquema, la verificación y los tres flujos
> de escritura ya están hechos y probados. Solo falta apretar el botón.
>
> Quien lo cree, pega las dos claves en el bloque de abajo y en `index.html`, y
> comitea: son públicas por diseño y van al repo a propósito, así el resto del
> equipo no tiene que volver a preguntar por ellas nunca.

Estas dos son **seguras de comitear y de compartir**. La `anon key` no es un
secreto: va incrustada en el frontend, cualquiera puede leerla desde el navegador,
y lo que la protege es Row Level Security (ver [Modelo de acceso](#modelo-de-acceso)),
no el hecho de estar oculta. Las consumen la Parte 2 (`convertir.js`) y la
Parte 3 (`index.html`).

```
Project URL:      <PEGAR_AQUI_LA_PROJECT_URL>      (ej. https://xxxxxxxx.supabase.co)
anon public key:  <PEGAR_AQUI_LA_ANON_PUBLIC_KEY>
```

Dónde sacarlas en el dashboard: **Project Settings → API**. La `Project URL` está
en *Project URL* y la `anon public key` en *Project API keys → `anon` `public`*.

### Quién necesita qué

| Tarea | Necesita | ¿Está bloqueada hoy? |
| --- | --- | --- |
| Desplegar en Vercel | nada | **No.** Funciona en modo demo sin ninguna clave |
| `index.html` conectado a la base | `Project URL` + `anon public key` | Sí, hasta que alguien cree el proyecto |
| `convertir.js --supabase` (subir contenido) | `Project URL` + `service_role key` | Sí, y la `service_role` va en un `.env` local |

### La única que no va al repo: `service_role key`

Se necesita para **un solo comando**, `convertir.js --supabase`, que sube el
contenido a la base. Quien cree el proyecto la tiene a mano en **Project
Settings → API**; va en el `.env` local (ya está en `.gitignore`), no en el repo.

El motivo no es formalismo académico, son dos problemas prácticos. Omite RLS: con
ella, cualquiera que vea el repo puede leer los correos de `leads` o borrar la base
entera, incluso durante la sustentación. Y GitHub detecta automáticamente las
llaves de Supabase en repos públicos y avisa a Supabase, que la revoca sola — con
lo que el pipeline de contenido se cae justo cuando lo necesitan. Si se filtra,
revócala en **Project Settings → API → Reset service_role key**.

Nada de esto bloquea al equipo: el contenido ya viaja dentro de `index.html`, así
que subirlo a la base es opcional.

## ¿Se puede desplegar sin base de datos?

Sí, y hoy es lo que está pasando. Con `SUPABASE_URL` y `SUPABASE_ANON_KEY` vacías
en `index.html`, la app arranca en modo **demo**: no toca la red y usa las materias,
preguntas y monitores que ya están escritos en el archivo. Los 14 flujos funcionan,
la captura de correo agradece igual y nada queda bloqueado.

Está así por diseño, en `configSupabase()`: si la URL no empieza por `https://` o la
llave está vacía, devuelve `null`, y `iniciar()` fija el estado en `demo` y sigue.
Incluso con credenciales, si Supabase no responde en 8 segundos la app cae al
contenido del archivo y nunca se queda colgada.

**Conclusión para el despliegue:** Vercel solo sirve un archivo estático. No hay
build, no hay variables de entorno que configurar y no hace falta ninguna clave.
Se puede desplegar ahora mismo. Conectar Supabase es un paso posterior y opcional,
que sirve para que los correos y los perfiles de monitor se guarden de verdad.

## Crear el proyecto de cero

**Lo puede hacer cualquiera del equipo, no hace falta esperar a nadie.** Toma unos
5 minutos, casi todo esperando a que Supabase aprovisione la base. El plan gratuito
no pide tarjeta.

1. Entra a [supabase.com](https://supabase.com) → **Start your project** e inicia
   sesión con GitHub.
2. **New project**. Nombre `Calibra`, genera la contraseña de la base con el botón
   (no se vuelve a necesitar para esto), región la más cercana, plan **Free**
   → **Create new project**. Espera 1–2 minutos.
3. **SQL Editor → New query**. Pega el contenido completo de
   [`schema.sql`](./schema.sql) y dale **Run**. Crea las 7 tablas, activa RLS y
   aplica las políticas y privilegios.
4. **New query** otra vez. Pega [`verificar.sql`](./verificar.sql) y **Run**: deben
   salir 38 filas y **todas** con `estado = OK`. Si alguna dice `FALLA`, el paso 3
   no terminó bien; vuelve a correr `schema.sql`.
5. **Project Settings → API**. Copia la `Project URL` y la `anon public key`.
6. Pega esas dos en **dos sitios**, y comitea:
   - la sección [Credenciales del proyecto](#credenciales-del-proyecto) de este archivo;
   - las constantes `SUPABASE_URL` y `SUPABASE_ANON_KEY` de `index.html`
     (bloque *1b. Supabase*, al inicio del `<script>`).

   Con eso, cualquiera que clone el repo queda conectado a la base sin pedir nada.
7. **Opcional, para que el contenido viva en la base.** En la misma pantalla
   **Project Settings → API** revela la `service_role key`, copia `.env.example`
   a `.env` en la raíz, llena `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`, y corre:

   ```bash
   node --env-file=.env contenido/convertir.js --supabase
   ```

   Sin este paso la app funciona igual: lee el contenido de `index.html` y usa la
   base solo para guardar leads, perfiles de monitor y diagnósticos.

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

El contenido (las 7 primeras tablas) lo escribe `convertir.js` con la
`service_role key`.

### Diagnóstico por knowledge components (rama `prueba-cuestionario`)

`knowledge_components`, `misconcepciones` y `pregunta_kc`, más las columnas
`opciones.misconcepcion_id` y `resultados_diagnostico.kcs`, soportan el
diagnóstico por habilidad (ver `contenido/README.md`). Solo tienen filas las
materias cuyo `.md` declara `kc:`; hoy, el piloto de Cálculo Integral. Son
cambios aditivos, pero un proyecto creado con el `schema.sql` anterior **no**
las tiene: antes de correr `convertir.js --supabase` desde esta rama hay que
volver a ejecutar `schema.sql` (borra los datos) o agregarlas a mano. La lectura de `leads` y `resultados_diagnostico` también
requiere `service_role`, porque esa llave omite RLS.

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
replica los roles de Supabase, ejecuta `schema.sql` y corre 55 comprobaciones,
incluido el comportamiento efectivo de `anon` haciendo `select`, `insert`,
`update` y `delete` en cada tabla. No toca el proyecto real.

## Limitación conocida del MVP

Sin autenticación, con `insert` público en `monitores`, `resultados_diagnostico` y
`leads`, cualquiera puede crear perfiles de monitor falsos o enviar resultados de
diagnóstico falsos. Es una decisión aceptada para esta iteración y así está
documentada en los riesgos de [`../esquema.md`](../esquema.md); conviene
declararla en la entrega como limitación conocida, no dejarla como descuido.
