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

Estas dos son **públicas por diseño**: están protegidas por RLS, así que es seguro
comitearlas. Las consumen la Parte 2 (`convertir.js`) y la Parte 3 (`index.html`).

```
Project URL:      <PEGAR_AQUI_LA_PROJECT_URL>      (ej. https://xxxxxxxx.supabase.co)
anon public key:  <PEGAR_AQUI_LA_ANON_PUBLIC_KEY>
```

> **La `service_role key` NUNCA va en este archivo ni en ningún archivo del repo.**
> Omite RLS y da acceso total a la base. Compártela por un canal privado del
> equipo con quien trabaje la **Parte 2**, que la necesita para que `convertir.js`
> inserte contenido, y que debe leerla desde una variable de entorno local. Si
> alguna vez se filtra, revócala y genera una nueva en Supabase de inmediato.

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
