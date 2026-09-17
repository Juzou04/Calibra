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

> ### ⚠️ Estado actual: aquí abajo hay marcadores, no las claves reales
>
> **La `Project URL` y la `anon public key` las tiene quien creó el proyecto de
> Supabase en la Parte 1.** Si estás trabajando la Parte 2 o la Parte 3 y
> necesitas conectarte, pídeselas directamente por el chat del equipo.
>
> En cuanto alguien las tenga a mano, **péguelas en el bloque de abajo y comitee
> el cambio**: son públicas por diseño y van al repo a propósito, así nadie más
> del equipo tiene que volver a pedirlas.

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
4. Pega [`verificar.sql`](./verificar.sql) en una consulta nueva y ejecútalo:
   deben salir 38 filas y **todas** con `estado = OK`.
5. En **Project Settings → API** copia la `Project URL` y la `anon public key` a
   la sección de arriba de este archivo, y guarda la `service_role key` por fuera
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
| `monitores` | sí | sí | no |
| `resultados_diagnostico` | no | sí | no |
| `leads` | no | sí | no |

El contenido (las 4 primeras tablas) lo escribe `convertir.js` con la
`service_role key`. La lectura de `leads` y `resultados_diagnostico` también
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
