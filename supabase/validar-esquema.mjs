/*
 * validar-esquema.mjs — valida supabase/schema.sql sin necesidad de un proyecto Supabase.
 *
 * Levanta un Postgres real (PGlite: Postgres compilado a WebAssembly) en memoria,
 * recrea el entorno de roles de Supabase (anon / authenticated / service_role),
 * ejecuta schema.sql y comprueba el contrato de esquema.md:
 *
 *   1. el DDL corre sin errores y es idempotente
 *   2. las 13 tablas tienen exactamente las columnas del contrato
 *   3. RLS está activo en las 13
 *   4. las políticas son exactamente las esperadas, y ninguna es UPDATE/DELETE
 *   5. el comportamiento efectivo del rol anon (select/insert/update/delete)
 *   6. service_role conserva el acceso total que necesita convertir.js
 *   7. verificar.sql concuerda con lo anterior
 *   8. la agenda (migración 004): publicar franjas, reservar, doble reserva,
 *      estudiantes con varias citas y diagnósticos, y la vista brief_cita
 *   9. schema.sql es idempotente
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
  opciones: ['id', 'pregunta_id', 'letra', 'texto', 'es_correcta', 'error_texto', 'misconcepcion_id'],
  knowledge_components: ['id', 'subtema_id', 'clave', 'nombre'],
  misconcepciones: ['id', 'kc_id', 'clave', 'texto'],
  pregunta_kc: ['pregunta_id', 'kc_id'],
  monitores: ['id', 'nombre', 'carrera', 'semestre', 'nivel', 'calificacion',
    'precio_hora', 'materia_certificada_id', 'encaje_texto', 'presentacion', 'clave',
    'creado_en'],
  resultados_diagnostico: ['id', 'materia_id', 'subtema_debil_id',
    'error_detectado_texto', 'respuestas', 'kcs', 'sesion_id', 'estudiante_id',
    'creado_en'],
  leads: ['id', 'correo', 'rol', 'materia_interes', 'telefono', 'monitor_id',
    'sesion_id', 'correo_enviado_en', 'creado_en'],
  estudiantes: ['id', 'correo', 'telefono', 'creado_en'],
  franjas: ['id', 'monitor_id', 'inicia_en', 'duracion_min', 'reservada', 'creado_en'],
  citas: ['id', 'franja_id', 'monitor_id', 'estudiante_id', 'diagnostico_id',
    'materia_id', 'estado', 'correo_enviado_en', 'creado_en'],
};

// Columna no-identidad por tabla: `set id = id` es inválido en columnas
// `generated always as identity` y fallaría por motivos ajenos a los permisos.
const colEditable = {
  materias: 'nombre', subtemas: 'nombre', preguntas: 'enunciado', opciones: 'texto',
  knowledge_components: 'nombre', misconcepciones: 'texto', pregunta_kc: 'kc_id',
  monitores: 'nombre', resultados_diagnostico: 'error_detectado_texto', leads: 'correo',
  estudiantes: 'correo', franjas: 'reservada', citas: 'estado',
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
  knowledge_components: ['SELECT'], misconcepciones: ['SELECT'], pregunta_kc: ['SELECT'],
  monitores: ['SELECT', 'INSERT'], resultados_diagnostico: ['INSERT'], leads: ['INSERT'],
  estudiantes: [], franjas: ['SELECT'], citas: [],
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
  insert into public.knowledge_components (subtema_id, clave, nombre)
    values (1, 'partes-eleccion-u', 'Elegir u y dv con la prioridad ILATE');
  insert into public.misconcepciones (kc_id, clave, texto)
    values (1, 'u-orden-aparicion', 'eliges u por orden de aparición, no por la prioridad ILATE');
  insert into public.pregunta_kc (pregunta_id, kc_id) values (1, 1);
  insert into public.opciones (pregunta_id, letra, texto, es_correcta, error_texto, misconcepcion_id)
    values (1, 'A', 'x', false, 'eliges u por orden de aparición, no por prioridad ILATE', 1);
  insert into public.leads (correo, rol) values ('semilla@uniandes.edu.co', 'estudiante');
`);

const comoAnon = async (consulta) => {
  await db.exec('set role anon;');
  try { return { r: await db.query(consulta) }; }
  catch (e) { return { err: e.message }; }
  finally { await db.exec('reset role;'); }
};

// Lectura pública permitida.
for (const t of ['materias', 'subtemas', 'preguntas', 'opciones',
  'knowledge_components', 'misconcepciones', 'pregunta_kc', 'monitores', 'franjas']) {
  const { err } = await comoAnon(`select * from public.${t}`);
  err ? fail(`anon debería poder leer ${t}: ${err}`) : ok(`anon puede leer ${t}`);
}

// Lectura prohibida: debe fallar por privilegios, no solo quedar filtrada por RLS.
for (const t of ['leads', 'resultados_diagnostico', 'estudiantes', 'citas', 'brief_cita']) {
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
  ['knowledge_components', `insert into public.knowledge_components (subtema_id, clave, nombre) values (1, 'x', 'X')`],
  ['misconcepciones', `insert into public.misconcepciones (kc_id, clave, texto) values (1, 'x', 'X')`],
  ['pregunta_kc', `insert into public.pregunta_kc (pregunta_id, kc_id) values (1, 1)`],
  ['franjas', `insert into public.franjas (monitor_id, inicia_en) values (1, now() + interval '1 day')`],
  ['estudiantes', `insert into public.estudiantes (correo) values ('directo@uniandes.edu.co')`],
  ['citas', `insert into public.citas (franja_id, monitor_id, estudiante_id) values (1, 1, 1)`],
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
for (const t of ['materias', 'preguntas', 'leads', 'estudiantes', 'citas', 'brief_cita']) {
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

// --- 8. Agenda: franjas, reservas y citas (migración 004) --------------------
// Corre como en Supabase: las funciones security definer son de un dueño que NO
// es superusuario ni omite RLS. Con el superusuario de PGlite, un permiso o una
// política mal puestos pasarían sin que nadie lo notara.
console.log('\n  -- agenda --');
await db.exec(`
  create role duenio nologin;
  grant usage on schema public to duenio;
  do $$
  declare r record;
  begin
    for r in select tablename::text as n from pg_tables where schemaname = 'public' loop
      execute format('alter table public.%I owner to duenio', r.n);
    end loop;
    for r in select viewname::text as n from pg_views where schemaname = 'public' loop
      execute format('alter view public.%I owner to duenio', r.n);
    end loop;
  end $$;
  alter function public.reservar_franja(bigint, text, text, text) owner to duenio;
  alter function public.publicar_franjas(text, jsonb) owner to duenio;
`);
{
  const dueno = await db.query(
    `select
       (select pg_get_userbyid(proowner) from pg_proc where proname = 'reservar_franja') as f,
       (select pg_get_userbyid(relowner) from pg_class where oid = 'public.citas'::regclass) as t,
       (select rolsuper or rolbypassrls from pg_roles where rolname = 'duenio') as poderoso`);
  const d = dueno.rows[0];
  d.f === 'duenio' && d.t === 'duenio' && d.poderoso === false
    ? ok('las funciones y las tablas de la agenda son de un dueño sin superusuario ni bypassrls')
    : fail(`dueños de la agenda: ${JSON.stringify(d)}`);
}

const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const anonJson = async (consulta) => {
  const { r, err } = await comoAnon(consulta);
  return err ? { errorSql: err } : r.rows[0].r;
};
const dias = (n, h = 15) => {
  const d = new Date(Date.now() + n * 86400000);
  d.setUTCHours(h, 0, 0, 0);
  return d.toISOString();
};
const cuenta = async (sql) => Number((await db.query(sql)).rows[0].n);

// Dos monitores, uno con materia certificada. Los inserta el dueño de la base.
const monA = (await db.query(`insert into public.monitores
  (nombre, nivel, precio_hora, materia_certificada_id, clave)
  values ('Monitor A', 2, 30000, 1, 'clave-a') returning id`)).rows[0].id;
const monB = (await db.query(`insert into public.monitores
  (nombre, nivel, clave) values ('Monitor B', 1, 'clave-b') returning id`)).rows[0].id;

// publicar_franjas: cinco buenas, una repetida, una ilegible y una ya pasada.
const buenas = [dias(2), dias(3), dias(4), dias(5), dias(6)];
const lista = JSON.stringify([...buenas, buenas[0], 'basura', '2020-01-01T10:00:00Z']);
let res = await anonJson(`select public.publicar_franjas('clave-a', '${lista}'::jsonb) as r`);
res.ok === true && res.creadas === 5 && res.monitor_id === monA
  ? ok('publicar_franjas: crea 5 y descarta la repetida, la ilegible y la pasada')
  : fail(`publicar_franjas devolvió ${JSON.stringify(res)}`);

res = await anonJson(`select public.publicar_franjas('clave-a', '${JSON.stringify(buenas)}'::jsonb) as r`);
res.ok === true && res.creadas === 0
  ? ok('publicar_franjas: repetir la misma lista no duplica nada')
  : fail(`publicar_franjas repetida devolvió ${JSON.stringify(res)}`);

res = await anonJson(`select public.publicar_franjas('clave-b', '${JSON.stringify([dias(2), dias(3)])}'::jsonb) as r`);
res.ok === true && res.creadas === 2
  ? ok('publicar_franjas: otro monitor tiene sus propias franjas (mismas horas, sin choque)')
  : fail(`publicar_franjas de B devolvió ${JSON.stringify(res)}`);

for (const [etiqueta, q, motivo] of [
  ['clave inexistente', `select public.publicar_franjas('no-existe', '["${dias(2)}"]'::jsonb) as r`, 'monitor_no_existe'],
  ['clave vacía', `select public.publicar_franjas('', '["${dias(2)}"]'::jsonb) as r`, 'monitor_no_existe'],
  ['clave nula', `select public.publicar_franjas(null, '["${dias(2)}"]'::jsonb) as r`, 'monitor_no_existe'],
  ['más de 20', `select public.publicar_franjas('clave-a', (select jsonb_agg(to_char(now() + (g || ' days')::interval, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')) from generate_series(30, 60) g)) as r`, 'demasiadas'],
  ['no es un arreglo', `select public.publicar_franjas('clave-a', '{"a":1}'::jsonb) as r`, 'formato'],
]) {
  res = await anonJson(q);
  res.ok === false && res.motivo === motivo
    ? ok(`publicar_franjas rechaza ${etiqueta}: ${motivo}`)
    : fail(`publicar_franjas con ${etiqueta} devolvió ${JSON.stringify(res)}`);
}

(await cuenta(`select count(*) as n from public.franjas where monitor_id = ${monA}`)) === 5
  ? ok('un monitor con varias franjas: el monitor A tiene 5')
  : fail('el monitor A no quedó con 5 franjas');

// anon lee franjas pero no las escribe.
{
  const { r, err } = await comoAnon(`select count(*) as n from public.franjas where not reservada`);
  !err && Number(r.rows[0].n) === 7
    ? ok('anon ve las 7 franjas libres (5 de A y 2 de B)')
    : fail(`anon ve ${r?.rows[0].n} franjas libres (${err ?? 'sin error'})`);
  await escrituraProhibida('update de reservada en franjas',
    `update public.franjas set reservada = true`);
  await escrituraProhibida('delete en franjas', `delete from public.franjas`);
}

const franjas = (await db.query(
  `select id from public.franjas where monitor_id = ${monA} order by inicia_en`)).rows.map((x) => x.id);
const [f1, f2, f3, f4, f5] = franjas;

// Diagnósticos hechos ANTES de dejar el correo, desde dos navegadores distintos.
for (const [sesion, error] of [['nav-1', 'primero'], ['nav-1', 'segundo'], ['nav-2', 'de otro navegador']]) {
  const { err } = await comoAnon(`insert into public.resultados_diagnostico
    (materia_id, subtema_debil_id, error_detectado_texto, sesion_id)
    values (1, 1, '${error}', '${sesion}')`);
  if (err) fail(`anon no pudo insertar el diagnóstico '${error}': ${err}`);
}
const diag = async (error) => Number((await db.query(
  `select id as n from public.resultados_diagnostico where error_detectado_texto = '${error}'`)).rows[0].n);
const dSegundo = await diag('segundo');
const dOtro = await diag('de otro navegador');

// Reserva feliz.
res = await anonJson(`select public.reservar_franja(${f1}, '  Ana@Correo.CO ', '3001112222', 'nav-1') as r`);
res.ok === true && res.franja_id === f1 && res.monitor_id === monA && res.cita_id && res.inicia_en
  ? ok('reservar_franja: reserva una franja libre y devuelve la cita')
  : fail(`reservar_franja devolvió ${JSON.stringify(res)}`);

{
  const c = (await db.query(`select c.diagnostico_id, c.materia_id, c.estado, c.monitor_id,
    e.correo, e.telefono, f.reservada
    from public.citas c join public.estudiantes e on e.id = c.estudiante_id
    join public.franjas f on f.id = c.franja_id where c.franja_id = ${f1}`)).rows[0];
  c && c.correo === 'ana@correo.co' && c.telefono === '3001112222' && c.reservada === true
    && c.estado === 'confirmada' && c.monitor_id === monA
    ? ok('la cita queda confirmada, la franja reservada y el correo normalizado a minúscula')
    : fail(`la cita quedó ${JSON.stringify(c)}`);
  c && c.diagnostico_id === dSegundo && c.materia_id === 1
    ? ok('el diagnóstico insertado antes del correo queda atado: la cita apunta al más reciente del navegador')
    : fail(`la cita apunta al diagnóstico ${c?.diagnostico_id} y debía ser ${dSegundo}`);
  const atados = await cuenta(`select count(*) as n from public.resultados_diagnostico
    where sesion_id = 'nav-1' and estudiante_id is not null`);
  const ajeno = await cuenta(`select count(*) as n from public.resultados_diagnostico
    where sesion_id = 'nav-2' and estudiante_id is not null`);
  atados === 2 && ajeno === 0
    ? ok('los dos diagnósticos de nav-1 pasan al estudiante y el de nav-2 no se toca')
    : fail(`atados nav-1=${atados}, nav-2 ajeno=${ajeno}`);
}

// Doble reserva, secuencial.
res = await anonJson(`select public.reservar_franja(${f1}, 'otra@correo.co', null, 'nav-9') as r`);
res.ok === false && res.motivo === 'ocupada'
  ? ok('reservar de nuevo la misma franja da "ocupada"')
  : fail(`la segunda reserva devolvió ${JSON.stringify(res)}`);
(await cuenta(`select count(*) as n from public.estudiantes where correo = 'otra@correo.co'`)) === 0
  ? ok('la reserva rechazada no deja un estudiante huérfano')
  : fail('la reserva rechazada dejó un estudiante');

// Dos llamadas a la vez sobre la misma franja: solo una gana.
{
  await db.exec('set role anon;');
  const par = await Promise.all([
    db.query(`select public.reservar_franja(${f2}, 'uno@correo.co', null, null) as r`),
    db.query(`select public.reservar_franja(${f2}, 'dos@correo.co', null, null) as r`),
  ]);
  await db.exec('reset role;');
  const rs = par.map((p) => p.rows[0].r);
  const ganadoras = rs.filter((x) => x.ok === true).length;
  const ocupadas = rs.filter((x) => x.ok === false && x.motivo === 'ocupada').length;
  ganadoras === 1 && ocupadas === 1 &&
    (await cuenta(`select count(*) as n from public.citas where franja_id = ${f2}`)) === 1
    ? ok('dos reservas simultáneas de la misma franja: una gana, la otra recibe "ocupada", queda una cita')
    : fail(`reservas simultáneas: ${JSON.stringify(rs)}`);
}

// El mismo estudiante, otra cita y otro navegador (mayúsculas distintas).
res = await anonJson(`select public.reservar_franja(${f3}, 'ANA@correo.co', '', 'nav-2') as r`);
res.ok === true
  ? ok('el mismo estudiante puede reservar una segunda franja')
  : fail(`segunda reserva de Ana devolvió ${JSON.stringify(res)}`);
{
  const est = await cuenta(`select count(*) as n from public.estudiantes where lower(correo) = 'ana@correo.co'`);
  const citas = await cuenta(`select count(*) as n from public.citas c
    join public.estudiantes e on e.id = c.estudiante_id where e.correo = 'ana@correo.co'`);
  const diags = await cuenta(`select count(*) as n from public.resultados_diagnostico d
    join public.estudiantes e on e.id = d.estudiante_id where e.correo = 'ana@correo.co'`);
  const tel = (await db.query(`select telefono from public.estudiantes where correo = 'ana@correo.co'`)).rows[0].telefono;
  est === 1 && citas === 2 && diags === 3
    ? ok('un estudiante, una fila: 2 citas y 3 diagnósticos (de dos navegadores) ligados a él')
    : fail(`estudiantes=${est} citas=${citas} diagnósticos=${diags}`);
  tel === '3001112222'
    ? ok('un teléfono vacío en la segunda reserva no borra el anterior')
    : fail(`el teléfono quedó ${tel}`);
  const c2 = (await db.query(`select diagnostico_id from public.citas where franja_id = ${f3}`)).rows[0];
  c2.diagnostico_id === dOtro
    ? ok('la segunda cita apunta al diagnóstico de su propio navegador')
    : fail(`la segunda cita apunta a ${c2.diagnostico_id} y debía ser ${dOtro}`);
}

// Reservar sin haber hecho la prueba: la materia sale de la del monitor.
res = await anonJson(`select public.reservar_franja(${f4}, 'sin@diag.co', null, null) as r`);
{
  const c = (await db.query(`select diagnostico_id, materia_id from public.citas where franja_id = ${f4}`)).rows[0];
  res.ok === true && c && c.diagnostico_id === null && c.materia_id === 1
    ? ok('reservar sin diagnóstico funciona: diagnostico_id nulo y materia la del monitor')
    : fail(`sin diagnóstico: ${JSON.stringify(res)} ${JSON.stringify(c)}`);
}

// Rechazos: correo, franja inexistente y franja pasada. Ninguno consume una franja.
for (const [etiqueta, q, motivo] of [
  ['un correo sin arroba', `select public.reservar_franja(${f5}, 'no-es-correo', null, null) as r`, 'correo'],
  ['un correo nulo', `select public.reservar_franja(${f5}, null, null, null) as r`, 'correo'],
  ['una franja que no existe', `select public.reservar_franja(999999, 'x@y.co', null, null) as r`, 'no_existe'],
]) {
  res = await anonJson(q);
  res.ok === false && res.motivo === motivo
    ? ok(`reservar_franja rechaza ${etiqueta}: ${motivo}`)
    : fail(`reservar_franja con ${etiqueta} devolvió ${JSON.stringify(res)}`);
}
(await cuenta(`select count(*) as n from public.franjas where id = ${f5} and not reservada`)) === 1
  ? ok('los rechazos no dejan la franja marcada como reservada')
  : fail('un rechazo dejó la franja reservada');

const fPasada = (await db.query(`insert into public.franjas (monitor_id, inicia_en)
  values (${monA}, now() - interval '1 hour') returning id`)).rows[0].id;
res = await anonJson(`select public.reservar_franja(${fPasada}, 'tarde@correo.co', null, null) as r`);
res.ok === false && res.motivo === 'pasada'
  ? ok('reservar una franja que ya pasó da "pasada"')
  : fail(`franja pasada devolvió ${JSON.stringify(res)}`);

// Carrera perdida: la franja figura libre pero ya tiene cita. La restricción
// UNIQUE salta dentro de la función y la reserva se deshace entera.
{
  const estX = (await db.query(`insert into public.estudiantes (correo) values ('ya@correo.co') returning id`)).rows[0].id;
  await db.exec(`insert into public.citas (franja_id, monitor_id, estudiante_id) values (${f5}, ${monA}, ${estX})`);
  res = await anonJson(`select public.reservar_franja(${f5}, 'perdedor@correo.co', null, null) as r`);
  const sobras = await cuenta(`select count(*) as n from public.estudiantes where correo = 'perdedor@correo.co'`);
  const libre = await cuenta(`select count(*) as n from public.franjas where id = ${f5} and not reservada`);
  res.ok === false && res.motivo === 'ocupada' && sobras === 0 && libre === 1
    ? ok('si otra cita se adelantó, la restricción UNIQUE la frena: "ocupada" y nada queda a medias')
    : fail(`carrera perdida: ${JSON.stringify(res)} sobras=${sobras} libre=${libre}`);
}

// brief_cita, como lo lee la Edge Function (service_role).
{
  await db.exec('set role service_role;');
  let b1 = null; let b4 = null; let errB = null;
  try {
    const r1 = await db.query(`select * from public.brief_cita where estudiante_correo = 'ana@correo.co' order by inicia_en`);
    const r4 = await db.query(`select * from public.brief_cita where estudiante_correo = 'sin@diag.co'`);
    b1 = r1.rows; b4 = r4.rows[0];
  } catch (e) { errB = e.message; }
  await db.exec('reset role;');
  if (errB || !b1) fail(`service_role no pudo leer brief_cita: ${errB}`);
  else {
    const p = b1[0];
    p.monitor_nombre === 'Monitor A' && p.monitor_clave === 'clave-a' && p.precio_hora === 30000
      && p.estudiante_telefono === '3001112222' && p.subtema_debil === 'Integración por partes'
      && p.error_detectado_texto === 'segundo' && p.materia_nombre === 'Cálculo Integral'
      && p.duracion_min === 60 && p.estado === 'confirmada' && b1.length === 2
      ? ok('brief_cita trae monitor, estudiante, franja, subtema débil, error y materia; Ana tiene 2 filas')
      : fail(`brief_cita: ${JSON.stringify(p)}`);
    b4 && b4.subtema_debil === null && b4.diagnostico_id === null && b4.materia_nombre === 'Cálculo Integral'
      ? ok('brief_cita de una cita sin diagnóstico: subtema y error nulos, materia del monitor')
      : fail(`brief_cita sin diagnóstico: ${JSON.stringify(b4)}`);
  }
}

// anon sigue sin ver nada de esto, ni por la función ni por la vista.
for (const t of ['citas', 'estudiantes', 'brief_cita']) {
  const { err } = await comoAnon(`select * from public.${t}`);
  err && /permission denied/i.test(err)
    ? ok(`con datos de por medio, anon sigue sin leer ${t}`)
    : fail(`anon leyó ${t} con datos: ${err ?? 'sin error'}`);
}
{
  const { err } = await comoAnon(`select public.reservar_franja(${f5}, 'x@y.co', null, null)`);
  !err ? ok('anon puede ejecutar reservar_franja') : fail(`anon no puede ejecutar reservar_franja: ${err}`);
}

// --- 9. Idempotencia ---------------------------------------------------------
try { await db.exec(schemaSql); ok('schema.sql es idempotente (se puede re-ejecutar)'); }
catch (e) { fail(`re-ejecutar schema.sql falló: ${e.message}`); }

console.log(`\nRESULTADO: ${fallas === 0 ? 'TODO OK' : `${fallas} FALLA(S)`}\n`);
process.exit(fallas === 0 ? 0 : 1);
