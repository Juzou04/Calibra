/*
 * validar-esquema.mjs — valida supabase/schema.sql sin necesidad de un proyecto Supabase.
 *
 * Levanta un Postgres real (PGlite: Postgres compilado a WebAssembly) en memoria,
 * recrea el entorno de roles de Supabase (anon / authenticated / service_role),
 * ejecuta schema.sql y comprueba el contrato de esquema.md:
 *
 *   1. el DDL corre sin errores y es idempotente
 *   2. las 7 tablas tienen exactamente las columnas del contrato
 *   3. RLS está activo en las 7
 *   4. las políticas son exactamente las esperadas, y ninguna es UPDATE/DELETE
 *   5. el comportamiento efectivo del rol anon (select/insert/update/delete)
 *   6. service_role conserva el acceso total que necesita convertir.js
 *
 * Uso:
 *   cd supabase && npm install && npm run validar
 *
 * Sale con código 1 si algo falla, 0 si todo pasa.
 * Esto NO toca el proyecto real de Supabase: todo ocurre en memoria.
 */
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const schemaSql = readFileSync(join(aqui, 'schema.sql'), 'utf8');
const verificarSql = readFileSync(join(aqui, 'verificar.sql'), 'utf8');

const db = new PGlite();
let fallas = 0;
const ok = (m) => console.log(`  ok    ${m}`);
const fail = (m) => { fallas++; console.log(`  FALLA ${m}`); };

// Columnas esperadas, tal cual las define esquema.md.
const esperado = {
  materias: ['id', 'nombre', 'codigo', 'activa'],
  subtemas: ['id', 'materia_id', 'clave', 'nombre'],
  preguntas: ['id', 'subtema_id', 'numero', 'dificultad', 'enunciado'],
  opciones: ['id', 'pregunta_id', 'letra', 'texto', 'es_correcta', 'error_texto'],
  monitores: ['id', 'nombre', 'carrera', 'semestre', 'nivel', 'calificacion',
    'precio_hora', 'materia_certificada_id', 'encaje_texto', 'creado_en'],
  resultados_diagnostico: ['id', 'materia_id', 'subtema_debil_id',
    'error_detectado_texto', 'respuestas', 'creado_en'],
  leads: ['id', 'correo', 'rol', 'materia_interes', 'creado_en'],
};

// Columna no-identidad por tabla: `set id = id` es inválido en columnas
// `generated always as identity` y fallaría por motivos ajenos a los permisos.
const colEditable = {
  materias: 'nombre', subtemas: 'nombre', preguntas: 'enunciado', opciones: 'texto',
  monitores: 'nombre', resultados_diagnostico: 'error_detectado_texto', leads: 'correo',
};

console.log('\nCalibra · validación del esquema Supabase\n');

// --- Entorno equivalente al de un proyecto Supabase nuevo ---------------------
// Supabase concede por defecto todos los privilegios a anon/authenticated en las
// tablas nuevas de public; se replica aquí para que la prueba sea realista.
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public
    grant all on tables to anon, authenticated, service_role;
`);

// --- 1. El DDL corre ---------------------------------------------------------
try {
  await db.exec(schemaSql);
  ok('schema.sql se ejecuta completo sin errores');
} catch (e) {
  fail(`schema.sql falló: ${e.message}`);
  console.log('\nRESULTADO: FALLÓ\n');
  process.exit(1);
}

// --- 2. Columnas exactas -----------------------------------------------------
for (const [tabla, cols] of Object.entries(esperado)) {
  const r = await db.query(
    `select column_name::text as c from information_schema.columns
     where table_schema = 'public' and table_name = $1 order by ordinal_position`, [tabla]);
  if (r.rows.length === 0) { fail(`tabla ${tabla} no existe`); continue; }
  const reales = r.rows.map((x) => x.c);
  const faltan = cols.filter((c) => !reales.includes(c));
  const sobran = reales.filter((c) => !cols.includes(c));
  if (!faltan.length && !sobran.length) ok(`tabla ${tabla}: ${cols.length} columnas exactas`);
  else fail(`tabla ${tabla}: faltan [${faltan}] sobran [${sobran}]`);
}

// --- 3. RLS activo -----------------------------------------------------------
for (const tabla of Object.keys(esperado)) {
  const r = await db.query(
    `select relrowsecurity from pg_class where oid = ('public.' || $1)::regclass`, [tabla]);
  r.rows[0]?.relrowsecurity ? ok(`RLS activo en ${tabla}`) : fail(`RLS NO activo en ${tabla}`);
}

// --- 4. Políticas exactas ----------------------------------------------------
const contrato = {
  materias: ['SELECT'], subtemas: ['SELECT'], preguntas: ['SELECT'], opciones: ['SELECT'],
  monitores: ['SELECT', 'INSERT'], resultados_diagnostico: ['INSERT'], leads: ['INSERT'],
};
for (const [tabla, cmds] of Object.entries(contrato)) {
  const r = await db.query(
    `select cmd::text as cmd, roles::text as roles from pg_policies
     where schemaname = 'public' and tablename = $1`, [tabla]);
  const reales = r.rows.map((x) => x.cmd).sort();
  JSON.stringify(reales) === JSON.stringify([...cmds].sort())
    ? ok(`políticas de ${tabla}: [${reales}]`)
    : fail(`políticas de ${tabla}: esperaba [${[...cmds].sort()}] y hay [${reales}]`);
  for (const row of r.rows) {
    if (!row.roles.includes('anon')) fail(`política ${tabla}/${row.cmd} no aplica al rol anon`);
  }
}
const escrituras = await db.query(
  `select tablename::text as t, cmd::text as c from pg_policies
   where schemaname = 'public' and cmd in ('UPDATE','DELETE','ALL')`);
escrituras.rows.length === 0
  ? ok('ninguna política de UPDATE/DELETE/ALL en ninguna tabla')
  : fail(`políticas de escritura indebidas: ${JSON.stringify(escrituras.rows)}`);

// --- 5. Comportamiento efectivo como anon ------------------------------------
// Semilla mínima, insertada como propietario (omite RLS).
await db.exec(`
  insert into public.materias (nombre, codigo, activa)
    values ('Cálculo Integral', 'MATE-1214', true);
  insert into public.subtemas (materia_id, clave, nombre)
    values (1, 'partes', 'Integración por partes');
  insert into public.preguntas (subtema_id, numero, dificultad, enunciado)
    values (1, 1, 'media', 'En ∫ x·ln(x) dx, ¿qué eliges como u?');
  insert into public.opciones (pregunta_id, letra, texto, es_correcta, error_texto)
    values (1, 'A', 'x', false, 'eliges u por orden de aparición, no por prioridad ILATE');
  insert into public.leads (correo, rol) values ('semilla@uniandes.edu.co', 'estudiante');
`);

const comoAnon = async (consulta) => {
  await db.exec('set role anon;');
  try { return { r: await db.query(consulta) }; }
  catch (e) { return { err: e.message }; }
  finally { await db.exec('reset role;'); }
};

// Lectura pública permitida.
for (const t of ['materias', 'subtemas', 'preguntas', 'opciones', 'monitores']) {
  const { err } = await comoAnon(`select * from public.${t}`);
  err ? fail(`anon debería poder leer ${t}: ${err}`) : ok(`anon puede leer ${t}`);
}

// Lectura prohibida: debe fallar por privilegios, no solo quedar filtrada por RLS.
for (const t of ['leads', 'resultados_diagnostico']) {
  const { err, r } = await comoAnon(`select * from public.${t}`);
  if (err && /permission denied/i.test(err)) ok(`anon no puede leer ${t} (doble capa: privilegio + RLS)`);
  else if (r?.rows.length === 0) fail(`anon tiene privilegio de select en ${t}: solo lo frena RLS`);
  else fail(`anon leyó ${r?.rows.length} filas de ${t} y no debería`);
}

// Inserción pública permitida solo en 3 tablas.
for (const [etiqueta, q] of [
  ['monitores', `insert into public.monitores (nombre, carrera, nivel, precio_hora)
                 values ('Ana P.', 'Ingeniería Industrial', 1, 25000)`],
  ['resultados_diagnostico', `insert into public.resultados_diagnostico
                 (materia_id, subtema_debil_id, error_detectado_texto, respuestas)
                 values (1, 1, 'confundes u con dv', '{"1":"A"}'::jsonb)`],
  ['leads', `insert into public.leads (correo, rol, materia_interes)
                 values ('nueva@uniandes.edu.co', 'monitor', 'MATE-1214')`],
]) {
  const { err } = await comoAnon(q);
  err ? fail(`anon debería poder insertar en ${etiqueta}: ${err}`)
      : ok(`anon puede insertar en ${etiqueta}`);
}

// Inserción prohibida en las tablas de contenido.
for (const [t, q] of [
  ['materias', `insert into public.materias (nombre, codigo) values ('Falsa', 'X-1')`],
  ['subtemas', `insert into public.subtemas (materia_id, clave, nombre) values (1, 'x', 'X')`],
  ['preguntas', `insert into public.preguntas (subtema_id, numero, enunciado) values (1, 99, 'X')`],
  ['opciones', `insert into public.opciones (pregunta_id, letra, texto) values (1, 'Z', 'X')`],
]) {
  const { err } = await comoAnon(q);
  err ? ok(`anon bloqueado al insertar en ${t}`) : fail(`anon insertó en ${t} y no debería`);
}

// UPDATE / DELETE prohibidos en las 7, denegados por privilegios.
const escrituraProhibida = async (etiqueta, consulta) => {
  const { err, r } = await comoAnon(consulta);
  if (err && /permission denied/i.test(err)) ok(`anon bloqueado por privilegios: ${etiqueta}`);
  else if ((r?.affectedRows ?? 0) === 0) fail(`anon tiene el privilegio para ${etiqueta}: solo lo frena RLS`);
  else fail(`anon afectó ${r?.affectedRows} filas en ${etiqueta}`);
};
for (const t of Object.keys(esperado)) {
  await escrituraProhibida(`delete en ${t}`, `delete from public.${t}`);
}
for (const [t, col] of Object.entries(colEditable)) {
  await escrituraProhibida(`update en ${t}`, `update public.${t} set ${col} = ${col}`);
}

// --- 6. service_role conserva acceso total -----------------------------------
for (const t of ['materias', 'preguntas', 'leads']) {
  await db.exec('set role service_role;');
  let err = null;
  try { await db.query(`select * from public.${t}`); } catch (e) { err = e.message; }
  await db.exec('reset role;');
  err ? fail(`service_role no puede leer ${t}: ${err}`) : ok(`service_role conserva lectura en ${t}`);
}

// --- 7. verificar.sql concuerda ----------------------------------------------
try {
  const rep = await db.query(verificarSql);
  const malas = rep.rows.filter((x) => x.estado !== 'OK');
  malas.length === 0
    ? ok(`verificar.sql: ${rep.rows.length} comprobaciones en OK`)
    : fail(`verificar.sql reporta ${malas.length} falla(s): ${malas.map((m) => m.chequeo).join(', ')}`);
} catch (e) {
  fail(`verificar.sql no se pudo ejecutar: ${e.message}`);
}

// --- 8. Idempotencia ---------------------------------------------------------
try { await db.exec(schemaSql); ok('schema.sql es idempotente (se puede re-ejecutar)'); }
catch (e) { fail(`re-ejecutar schema.sql falló: ${e.message}`); }

console.log(`\nRESULTADO: ${fallas === 0 ? 'TODO OK' : `${fallas} FALLA(S)`}\n`);
process.exit(fallas === 0 ? 0 : 1);
