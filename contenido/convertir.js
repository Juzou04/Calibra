/* =========================================================================
   Conversor de contenido: los .md de esta carpeta -> el arreglo MATERIAS
   que vive dentro de index.html, y/o las tablas de contenido en Supabase.

   Uso:
     node contenido/convertir.js              revisa y muestra que haria
     node contenido/convertir.js --escribir   aplica el cambio a index.html
     node contenido/convertir.js --supabase --dry-run
                                              muestra que filas subiria
     node --env-file=.env contenido/convertir.js --supabase
                                              sube a Supabase (requiere
                                              SUPABASE_URL y
                                              SUPABASE_SERVICE_ROLE_KEY)

   Por defecto NO escribe nada. Cuando escribe, deja antes una copia en
   index.html.bak.convertir. Si algun archivo tiene un error de formato,
   aborta sin tocar nada y dice exactamente que linea revisar.
   --supabase solo no toca index.html; con --escribir hace las dos cosas.
   ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const INDEX = path.join(DIR, '..', 'index.html');
const IGNORAR = ['README.md', 'plantilla-materia.md'];

const errores = [];
const avisos = [];

function error(archivo, linea, mensaje) {
  errores.push(archivo + ':' + linea + '  ' + mensaje);
}

/* ---------- Lectura del frontmatter ---------- */
function leerFrontmatter(lineas, archivo) {
  if (lineas[0].trim() !== '---') {
    error(archivo, 1, 'el archivo debe empezar con una linea "---"');
    return { datos: {}, desde: 0 };
  }
  const datos = {};
  let i = 1;
  for (; i < lineas.length; i += 1) {
    if (lineas[i].trim() === '---') return { datos: datos, desde: i + 1 };
    const m = lineas[i].match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (m) datos[m[1]] = m[2].trim();
  }
  error(archivo, 1, 'no encontre el "---" que cierra el frontmatter');
  return { datos: datos, desde: lineas.length };
}

/* ---------- Lectura de una materia ---------- */
function leerMateria(archivo) {
  const bruto = fs.readFileSync(path.join(DIR, archivo), 'utf8');
  const lineas = bruto.split(/\r?\n/);
  const fm = leerFrontmatter(lineas, archivo);
  const d = fm.datos;

  for (const campo of ['id', 'nombre']) {
    if (!d[campo]) error(archivo, 1, 'falta "' + campo + '" en el frontmatter');
  }

  const materia = {
    id: d.id || '',
    codigo: d.codigo && d.codigo !== 'MATE-0000' ? d.codigo : '',
    nombre: d.nombre || '',
    activa: String(d.activa).toLowerCase() === 'true',
    contexto: d.contexto || '',
    libro: d.libro || '',
    subtemas: {},
    preguntas: [],
  };

  let subtemaActual = null;
  let preguntaActual = null;
  const idsVistos = {};

  for (let i = fm.desde; i < lineas.length; i += 1) {
    const l = lineas[i];
    const nl = i + 1;

    // ## clave · Nombre visible
    const mSub = l.match(/^##\s+([a-z0-9_-]+)\s*[·|-]\s*(.+)$/);
    if (mSub) {
      subtemaActual = mSub[1];
      materia.subtemas[subtemaActual] = mSub[2].trim();
      preguntaActual = null;
      continue;
    }
    if (/^##\s/.test(l)) {
      error(archivo, nl, 'encabezado de subtema mal formado. Debe ser "## clave · Nombre visible"');
      continue;
    }

    // ### P1 · dificultad 2
    const mPre = l.match(/^###\s+([A-Za-z0-9_-]+)\s*[·|-]\s*dificultad\s*([123])\s*$/);
    if (mPre) {
      if (!subtemaActual) {
        error(archivo, nl, 'la pregunta ' + mPre[1] + ' no esta dentro de ningun subtema');
        continue;
      }
      const id = mPre[1].toLowerCase();
      if (idsVistos[id]) error(archivo, nl, 'el id de pregunta "' + mPre[1] + '" esta repetido');
      idsVistos[id] = true;
      preguntaActual = {
        id: id,
        subtema: subtemaActual,
        dificultad: Number(mPre[2]),
        enunciado: '',
        opciones: [],
        _linea: nl,
      };
      materia.preguntas.push(preguntaActual);
      continue;
    }
    if (/^###\s/.test(l)) {
      error(archivo, nl, 'encabezado de pregunta mal formado. Debe ser "### P1 · dificultad 2"');
      continue;
    }

    // - A) texto · CORRECTA   |   - A) texto · error conceptual
    const mOp = l.match(/^\s*-\s*([A-D])\)\s*(.*)$/);
    if (mOp && preguntaActual) {
      // El separador es un punto medio AISLADO: con espacio (o el borde de la
      // linea) a cada lado. El punto medio pegado, como en x·ln(x), es
      // multiplicacion y no separa nada. Se toma el ULTIMO que cumpla eso, para
      // que 'x · ln(x) · no separas el producto' parta donde debe.
      const bruto = mOp[2];
      let corte = -1;
      let largo = 0;
      const reSep = /(^|\s)·(\s|$)/g;
      let mSep;
      while ((mSep = reSep.exec(bruto)) !== null) {
        corte = mSep.index + mSep[1].length;
        largo = 1 + mSep[2].length;
        reSep.lastIndex = mSep.index + 1;
      }
      const texto = (corte === -1 ? bruto : bruto.slice(0, corte)).trim();
      const cola = (corte === -1 ? '' : bruto.slice(corte + largo)).trim();
      const esCorrecta = /^CORRECTA$/i.test(cola);
      preguntaActual.opciones.push({
        letra: mOp[1],
        texto: texto,
        correcta: esCorrecta,
        error: esCorrecta ? '' : cola,
      });
      continue;
    }

    // Enunciado: texto suelto justo despues del encabezado de la pregunta
    if (preguntaActual && preguntaActual.opciones.length === 0 && l.trim()) {
      preguntaActual.enunciado += (preguntaActual.enunciado ? ' ' : '') + l.trim();
    }
  }

  // Validacion de cada pregunta
  const completas = [];
  for (const p of materia.preguntas) {
    const vacia = !p.enunciado && p.opciones.every((o) => !o.texto);
    if (vacia) {
      avisos.push(archivo + ':' + p._linea + '  la pregunta ' + p.id + ' esta vacia todavia, se omite');
      continue;
    }
    if (!p.enunciado) error(archivo, p._linea, 'la pregunta ' + p.id + ' no tiene enunciado');
    if (p.opciones.length !== 4) error(archivo, p._linea, 'la pregunta ' + p.id + ' tiene ' + p.opciones.length + ' opciones, deben ser 4');
    const correctas = p.opciones.filter((o) => o.correcta).length;
    if (correctas !== 1) error(archivo, p._linea, 'la pregunta ' + p.id + ' tiene ' + correctas + ' opciones marcadas CORRECTA, debe ser exactamente 1');
    for (const o of p.opciones) {
      if (!o.texto) error(archivo, p._linea, 'la opcion ' + o.letra + ' de ' + p.id + ' no tiene texto');
      if (!o.correcta && !o.error) error(archivo, p._linea, 'la opcion ' + o.letra + ' de ' + p.id + ' no dice que error conceptual delata');
    }
    delete p._linea;
    completas.push(p);
  }
  // El .md agrupa las preguntas por subtema porque asi es comodo escribirlas,
  // pero el banco debe quedar en el orden de los ids (p1, p2, p3, p4...).
  // Sin esto, un subtema con p1 y p4 arrastra p4 al segundo lugar y cambia el
  // recorrido de la prueba, que es lo que sostiene la tabla oraculo.
  // Orden natural: el numero del id se compara como numero, no como texto,
  // para que p10 vaya despues de p9 y no entre p1 y p2.
  completas.sort(function (x, y) {
    var nx = parseInt(String(x.id).replace(/[^0-9]/g, ""), 10);
    var ny = parseInt(String(y.id).replace(/[^0-9]/g, ""), 10);
    if (isNaN(nx) || isNaN(ny)) return String(x.id).localeCompare(String(y.id));
    return nx - ny;
  });
  materia.preguntas = completas;

  if (materia.activa && materia.preguntas.length === 0) {
    error(archivo, 1, 'la materia esta marcada activa:true pero no tiene ninguna pregunta completa');
  }

  const nSub = Object.keys(materia.subtemas).length;
  // longitud: cuantas preguntas ve el estudiante. Si el .md no la fija, se usa
  // una por subtema, tope 4, que es lo que cabe comodo en una demo de un minuto.
  const longitud = Number(d.longitud) > 0 ? Number(d.longitud) : Math.min(4, Math.max(nSub, 1));
  materia.prueba = { longitud: longitud, adaptativa: true, barajarOpciones: true };
  materia.certificacion = { longitud: Math.min(3, materia.preguntas.length || 3), minimoAciertos: 2, adaptativa: false, barajarOpciones: false };

  return materia;
}

/* ---------- Serializacion a JS legible ---------- */
function comillas(s) {
  return "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

function serializar(materias) {
  const out = ['const MATERIAS = ['];
  out.push('');
  out.push('  /* Generado por contenido/convertir.js. No edites aqui: edita los .md');
  out.push('     de la carpeta contenido/ y vuelve a correr el conversor. */');
  out.push('');
  for (const m of materias) {
    out.push('  {');
    out.push('    id: ' + comillas(m.id) + ',');
    out.push('    codigo: ' + comillas(m.codigo) + ',');
    out.push('    nombre: ' + comillas(m.nombre) + ',');
    out.push('    activa: ' + (m.activa ? 'true' : 'false') + ',');
    out.push('    contexto: ' + comillas(m.contexto) + ',');
    out.push('    libro: ' + comillas(m.libro) + ',');
    const subs = Object.keys(m.subtemas).map((k) => {
      const clave = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k) ? k : comillas(k);
      return clave + ': ' + comillas(m.subtemas[k]);
    });
    out.push('    subtemas: { ' + subs.join(', ') + ' },');
    if (m.preguntas.length === 0) {
      out.push('    preguntas: [],');
    } else {
      out.push('    preguntas: [');
      for (const p of m.preguntas) {
        out.push('      { id: ' + comillas(p.id) + ', subtema: ' + comillas(p.subtema) + ', dificultad: ' + p.dificultad + ',');
        out.push('        enunciado: ' + comillas(p.enunciado) + ',');
        out.push('        opciones: [');
        for (const o of p.opciones) {
          const campos = ['letra: ' + comillas(o.letra), 'texto: ' + comillas(o.texto), 'correcta: ' + (o.correcta ? 'true' : 'false')];
          if (!o.correcta) campos.push('error: ' + comillas(o.error));
          out.push('          { ' + campos.join(', ') + ' },');
        }
        out.push('        ] },');
      }
      out.push('    ],');
    }
    out.push('    prueba:        { longitud: ' + m.prueba.longitud + ', adaptativa: true,  barajarOpciones: true },');
    out.push('    certificacion: { longitud: ' + m.certificacion.longitud + ', minimoAciertos: 2, adaptativa: false, barajarOpciones: false },');
    out.push('  },');
    out.push('');
  }
  out.push('];');
  return out.join('\n');
}

/* ---------- Programa ---------- */
const archivos = fs.readdirSync(DIR)
  .filter((f) => f.endsWith('.md') && IGNORAR.indexOf(f) === -1)
  .sort();

if (archivos.length === 0) {
  console.log('No hay archivos de materia en contenido/. Copia plantilla-materia.md y llenalo.');
  process.exit(1);
}

const materias = archivos.map(leerMateria)
  // Las activas van primero: el motor arranca en la primera activa.
  .sort(function (a, b) { return (b.activa ? 1 : 0) - (a.activa ? 1 : 0); });

console.log('Archivos leidos: ' + archivos.length);
for (const m of materias) {
  console.log('  ' + (m.activa ? '[activa] ' : '[pronto] ') + m.nombre +
    '  ' + Object.keys(m.subtemas).length + ' subtemas, ' + m.preguntas.length + ' preguntas completas');
}

if (avisos.length) {
  console.log('\nAvisos (no bloquean):');
  for (const a of avisos) console.log('  ' + a);
}

if (errores.length) {
  console.log('\nERRORES (' + errores.length + '). No se toco index.html:');
  for (const e of errores) console.log('  ' + e);
  process.exit(1);
}

const ESCRIBIR = process.argv.indexOf('--escribir') !== -1;
const SUPABASE = process.argv.indexOf('--supabase') !== -1;
const DRY_RUN = process.argv.indexOf('--dry-run') !== -1;

if (!SUPABASE || ESCRIBIR) {
  procesarIndex();
}
if (SUPABASE) {
  subirASupabase(materias).catch(function (e) {
    console.log('\nERROR al escribir en Supabase: ' + e.message);
    console.log('Lo que alcanzo a escribirse queda en la base; volver a correr el script es seguro.');
    process.exit(1);
  });
}

function procesarIndex() {
  const bloque = serializar(materias);

  const html = fs.readFileSync(INDEX, 'utf8');
  const lineas = html.split(/\r?\n/);
  const ini = lineas.findIndex((l) => /^const MATERIAS = \[/.test(l));
  if (ini < 0) {
    console.log('\nNo encontre "const MATERIAS = [" en index.html.');
    process.exit(1);
  }
  let fin = ini;
  while (fin < lineas.length && !/^\];/.test(lineas[fin])) fin += 1;
  if (fin >= lineas.length) {
    console.log('\nNo encontre el cierre "];" del arreglo MATERIAS en index.html.');
    process.exit(1);
  }

  if (!ESCRIBIR) {
    console.log('\nModo revision. Reemplazaria las lineas ' + (ini + 1) + ' a ' + (fin + 1) +
      ' de index.html (' + (fin - ini + 1) + ' lineas) por ' + bloque.split('\n').length + ' lineas.');
    console.log('Para aplicarlo:  node contenido/convertir.js --escribir');
    console.log('Para subir a Supabase:  node --env-file=.env contenido/convertir.js --supabase');
    process.exit(0);
  }

  fs.copyFileSync(INDEX, INDEX + '.bak.convertir');
  const nuevo = lineas.slice(0, ini).concat(bloque.split('\n')).concat(lineas.slice(fin + 1));
  fs.writeFileSync(INDEX, nuevo.join('\n'));
  console.log('\nindex.html actualizado. Copia previa en index.html.bak.convertir');
  console.log('Ahora corre verificar.cmd para comprobar que nada se rompio.');
}

/* =========================================================================
   Supabase: materias -> subtemas -> preguntas -> opciones
   -------------------------------------------------------------------------
   Las tablas usan ids numericos autogenerados (supabase/schema.sql), asi que
   cada fila se reconoce por su llave natural, no por el id:
     materias   codigo
     subtemas   (materia_id, clave)
     preguntas  (subtema_id, numero)   <- sin unique en la base
     opciones   (pregunta_id, letra)
   Por cada padre se leen sus hijos existentes en una sola consulta; lo que
   ya existe igual no se toca, lo que cambio se actualiza y lo nuevo se
   inserta. Asi correrlo dos veces no duplica filas.
   Limitacion: no borra filas cuyo contenido se quito de los .md.
   ========================================================================= */

function filasDeMateria(m) {
  const subtemas = Object.keys(m.subtemas).map(function (clave) {
    return {
      fila: { clave: clave, nombre: m.subtemas[clave] },
      preguntas: m.preguntas.filter((p) => p.subtema === clave).map(function (p) {
        return {
          fila: {
            numero: parseInt(p.id.replace(/[^0-9]/g, ''), 10),
            dificultad: String(p.dificultad),
            enunciado: p.enunciado,
          },
          opciones: p.opciones.map((o) => ({
            letra: o.letra,
            texto: o.texto,
            es_correcta: o.correcta,
            error_texto: o.correcta ? null : o.error,
          })),
        };
      }),
    };
  });
  return { fila: { codigo: m.codigo, nombre: m.nombre, activa: m.activa }, subtemas: subtemas };
}

async function subirASupabase(lista) {
  const arbol = lista.map(filasDeMateria);

  const sinCodigo = lista.filter((m) => !m.codigo).map((m) => m.nombre);
  if (sinCodigo.length) {
    console.log('\nERROR: materias sin "codigo" en el frontmatter: ' + sinCodigo.join(', ') + '.');
    console.log('En Supabase codigo es obligatorio y unico, y es lo que identifica la materia. No se toco la base.');
    process.exit(1);
  }
  for (const m of arbol) {
    for (const s of m.subtemas) {
      const vistos = {};
      for (const p of s.preguntas) {
        if (isNaN(p.fila.numero) || vistos[p.fila.numero]) {
          console.log('\nERROR: en ' + m.fila.nombre + ', subtema ' + s.fila.clave +
            ', hay ids de pregunta sin numero o con el mismo numero. No se toco la base.');
          process.exit(1);
        }
        vistos[p.fila.numero] = true;
      }
    }
  }

  if (DRY_RUN) {
    const t = { materias: 0, subtemas: 0, preguntas: 0, opciones: 0 };
    console.log('\nModo revision de Supabase (--dry-run). No se conecta a la base.');
    for (const m of arbol) {
      const nP = m.subtemas.reduce((a, s) => a + s.preguntas.length, 0);
      const nO = m.subtemas.reduce((a, s) => a + s.preguntas.reduce((b, p) => b + p.opciones.length, 0), 0);
      console.log('  ' + m.fila.codigo + '  ' + m.fila.nombre + ': ' + m.subtemas.length + ' subtemas, ' + nP + ' preguntas, ' + nO + ' opciones');
      t.materias += 1; t.subtemas += m.subtemas.length; t.preguntas += nP; t.opciones += nO;
    }
    console.log('Total: ' + t.materias + ' materias, ' + t.subtemas + ' subtemas, ' + t.preguntas + ' preguntas, ' + t.opciones + ' opciones');
    const muestra = arbol.find((m) => m.subtemas.some((s) => s.preguntas.length));
    if (muestra) {
      const s = muestra.subtemas.find((x) => x.preguntas.length);
      console.log('\nMuestra de filas (' + muestra.fila.nombre + '):');
      console.log('  materias  ' + JSON.stringify(muestra.fila));
      console.log('  subtemas  ' + JSON.stringify(s.fila));
      console.log('  preguntas ' + JSON.stringify(s.preguntas[0].fila));
      console.log('  opciones  ' + JSON.stringify(s.preguntas[0].opciones[0]));
    }
    console.log('\nPara escribir de verdad:  node --env-file=.env contenido/convertir.js --supabase');
    return;
  }

  const url = process.env.SUPABASE_URL;
  const llave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !llave) {
    console.log('\nFaltan variables de entorno: ' +
      [!url && 'SUPABASE_URL', !llave && 'SUPABASE_SERVICE_ROLE_KEY'].filter(Boolean).join(', ') + '.');
    console.log('Copia .env.example a .env en la raiz del repo, llenalo y corre:');
    console.log('  node --env-file=.env contenido/convertir.js --supabase');
    console.log('No se toco la base.');
    process.exit(1);
  }

  const { createClient } = require('@supabase/supabase-js');
  const db = createClient(url, llave, { auth: { persistSession: false, autoRefreshToken: false } });
  const stats = {};
  for (const tabla of ['materias', 'subtemas', 'preguntas', 'opciones']) {
    stats[tabla] = { nuevas: 0, actualizadas: 0, iguales: 0 };
  }

  console.log('\nEscribiendo en Supabase (' + url + ')...');
  const idsMaterias = await sincronizar(db, stats, 'materias', null, ['codigo'], arbol.map((m) => m.fila));
  for (const m of arbol) {
    const materiaId = idsMaterias.get(clave(m.fila, ['codigo']));
    const idsSub = await sincronizar(db, stats, 'subtemas', { materia_id: materiaId }, ['clave'], m.subtemas.map((s) => s.fila));
    for (const s of m.subtemas) {
      const subtemaId = idsSub.get(clave(s.fila, ['clave']));
      const idsPre = await sincronizar(db, stats, 'preguntas', { subtema_id: subtemaId }, ['numero'], s.preguntas.map((p) => p.fila));
      for (const p of s.preguntas) {
        const preguntaId = idsPre.get(clave(p.fila, ['numero']));
        await sincronizar(db, stats, 'opciones', { pregunta_id: preguntaId }, ['letra'], p.opciones);
      }
    }
    console.log('  listo: ' + m.fila.nombre);
  }

  console.log('\nResumen:');
  for (const tabla of Object.keys(stats)) {
    const s = stats[tabla];
    console.log('  ' + (tabla + ':').padEnd(11) + s.nuevas + ' nuevas, ' + s.actualizadas + ' actualizadas, ' + s.iguales + ' sin cambios');
  }
}

function clave(fila, llaves) {
  return llaves.map((k) => String(fila[k])).join('|');
}

// Deja en la tabla las filas dadas bajo un padre. Devuelve Map llave natural -> id.
async function sincronizar(db, stats, tabla, padre, llaves, filas) {
  let consulta = db.from(tabla).select('*');
  if (padre) consulta = consulta.match(padre);
  const { data: existentes, error } = await consulta;
  if (error) throw new Error(tabla + ' (leer): ' + error.message);

  const ids = new Map();
  const porClave = new Map();
  for (const e of existentes) {
    const k = clave(e, llaves);
    if (!porClave.has(k)) porClave.set(k, e);
  }

  const nuevas = [];
  for (const f of filas) {
    const completa = padre ? Object.assign({}, padre, f) : f;
    const actual = porClave.get(clave(f, llaves));
    if (!actual) {
      nuevas.push(completa);
      continue;
    }
    ids.set(clave(f, llaves), actual.id);
    const cambio = Object.keys(completa).some((c) => (actual[c] === undefined ? null : actual[c]) !== completa[c]);
    if (!cambio) {
      stats[tabla].iguales += 1;
      continue;
    }
    const { error: errUpd } = await db.from(tabla).update(completa).eq('id', actual.id);
    if (errUpd) throw new Error(tabla + ' (actualizar ' + clave(f, llaves) + '): ' + errUpd.message);
    stats[tabla].actualizadas += 1;
  }

  if (nuevas.length) {
    const { data: insertadas, error: errIns } = await db.from(tabla).insert(nuevas).select('*');
    if (errIns) throw new Error(tabla + ' (insertar): ' + errIns.message);
    for (const fila of insertadas) ids.set(clave(fila, llaves), fila.id);
    stats[tabla].nuevas += insertadas.length;
  }
  return ids;
}
