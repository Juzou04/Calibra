/*
 * verificar.js — arnes de verificacion del prototipo Calibra (v2)
 *
 * Recorre el prototipo con Playwright (Chromium), toma capturas de los flujos
 * completos y ejecuta aserciones automaticas de layout, accesibilidad, logica
 * del diagnostico (fijo y adaptativo), barajado, exploracion de monitores,
 * creacion del perfil de monitor y robustez.
 *
 * Uso:
 *   verificar.cmd                    (define NODE_PATH y ejecuta este archivo)
 *   verificar.cmd --headed           (abre el navegador visible)
 *   verificar.cmd --solo=oraculo     (bloques, separados por coma:
 *                                     fuente, capturas, oraculo, monitor,
 *                                     adaptativo, kc, barajado, buscar,
 *                                     perfil, robustez)
 *
 * Requisitos ya verificados del entorno:
 *   - playwright 1.61.1 instalado GLOBALMENTE, se resuelve via NODE_PATH.
 *   - solo hay Chromium descargado.
 *   - no existe @playwright/test: no se usa el test runner.
 *
 * Sale con codigo 1 si algo falla, 0 si todo pasa.
 *
 * ---------------------------------------------------------------------------
 * GANCHOS QUE EL ARNES NECESITA DE index.html (contrato v2)
 * ---------------------------------------------------------------------------
 *  1. window.MATERIAS          -> el arreglo de materias, legible y MUTABLE.
 *                                 (alias aceptados: window.__calibraMaterias,
 *                                  window.__calibra.MATERIAS)
 *                                 El arnes lo lee para saber que opcion es
 *                                 correcta y para forzar la configuracion
 *                                 { adaptativa:false, barajarOpciones:false }
 *                                 antes de cada recorrido.
 *  2. window.__calibraSemilla  -> numero. El motor DEBE leerlo al arrancar
 *                                 cada prueba/certificacion para sembrar el
 *                                 PRNG (mulberry32). Nunca Math.random.
 *  3. Secciones nuevas: <section id="s-buscar"> (#buscar) y
 *                       <section id="s-crear-perfil"> (#crear-perfil).
 *  4. Ids nuevos: #buscar-lista, #buscar-conteo, #buscar-vacio.
 *  5. Controles de filtro en #s-buscar: cada uno con data-filtro="materia" |
 *     "subtema" | "precio" | "nivel" (alias por id: #buscar-materia, etc.).
 *  6. Cada tarjeta de #buscar-lista: [data-ir="perfil"] y, para poder
 *     comprobar coherencia, data-materia / data-subtemas / data-precio /
 *     data-nivel (si no estan, el arnes intenta leerlos del texto visible).
 *  7. Formulario de #s-crear-perfil con campos [name="nombre"],
 *     [name="semestre"], [name="tarifa"] y casillas [name="subtemas"], mas un
 *     contenedor de mensaje de error (#crear-perfil-error o [role="alert"]).
 *  8. Enlace en E1 hacia la exploracion libre: [data-ir="buscar"].
 * ---------------------------------------------------------------------------
 */

'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');

// ---------------------------------------------------------------------------
// 0. Rutas y configuracion
// ---------------------------------------------------------------------------

const RAIZ = __dirname;
const INDEX = path.join(RAIZ, 'index.html');
const DIR_CAPTURAS = path.join(RAIZ, 'capturas');
const DIR_EST = path.join(DIR_CAPTURAS, 'estudiante');
const DIR_MON = path.join(DIR_CAPTURAS, 'monitor');
const RUTA_REPORTE = path.join(DIR_CAPTURAS, 'reporte.json');
const RUTA_SHEET = path.join(DIR_CAPTURAS, 'contact-sheet.html');

// index.html con credenciales reales pegadas. Cambia lo que se puede esperar de
// la red: el arnes deja pasar las lecturas al proyecto real y retiene las
// escrituras, asi que el insert de un correo SI viaja y eso es correcto.
const CREDENCIALES_REALES = /const SUPABASE_URL = "https:\/\//.test(
  fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8')
);

const ARGS = process.argv.slice(2);
const HEADED = ARGS.includes('--headed');
const SOLO = (() => {
  const a = ARGS.find((x) => x.startsWith('--solo='));
  if (!a) return null;
  return a.slice('--solo='.length).split(',').map((s) => s.trim()).filter(Boolean);
})();

const TIEMPO = 8000; // timeout por defecto de las esperas

const HOSTS_FUENTES = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// Materia sobre la que se apoya la tabla oraculo de regresion.
const MATERIA_DEMO = 'calculo-integral';

// Semillas del bloque adaptativo. Fijas para que el reporte sea comparable.
const SEMILLAS = [1, 7, 42, 1234, 99991];

// ---------------------------------------------------------------------------
// 1. Textos oraculo (literales del brief, con tildes correctas)
// ---------------------------------------------------------------------------

const ERR_PARTES_P1 = 'eliges u por orden de aparición, no por prioridad ILATE';
const ERR_PARTES_P4 = 'te equivocas en el signo de la fórmula de partes';
const ERR_SUSTITUCION = 'no reconoces que 2x es la derivada de x²';
const ERR_IMPROPIAS = 'la confundes con 1/x, que sí diverge';
const SIN_FALLOS = 'Vas bien. Refuerza este subtema antes del parcial.';
const PREFIJO_ERROR = 'Error detectado';

const TXT_CERTIFICADO = 'Certificado en Cálculo Integral';
const TXT_NO_CERTIFICADO = 'Todavía no. Puedes reintentar en 7 días.';
const TXT_PIE = 'Prototipo · datos de ejemplo';

// Promesa de E5 que SOLO puede aparecer si hay diagnostico hecho.
const PROMESA_DIAGNOSTICO = 'recibirá tu diagnóstico';

// Letras del banco en orden fijo: correcta / incorrecta canonica por pregunta.
// P1 correcta B (incorrecta A), P2 correcta B (incorrecta A),
// P3 correcta A (incorrecta B), P4 correcta A (incorrecta B).
const LETRA_CORRECTA = ['B', 'B', 'A', 'A'];
const LETRA_INCORRECTA = ['A', 'A', 'B', 'B'];

// Orden de lectura de porcentajes: partes, sustitucion, impropias.
const ORACULO = {
  FFFF: { pct: [34, 34, 34], debil: 'partes', error: ERR_PARTES_P1 },
  FFFV: { pct: [61, 34, 34], debil: 'sustitucion', error: ERR_SUSTITUCION },
  FFVF: { pct: [34, 34, 82], debil: 'partes', error: ERR_PARTES_P1 },
  FFVV: { pct: [61, 34, 82], debil: 'sustitucion', error: ERR_SUSTITUCION },
  FVFF: { pct: [34, 82, 34], debil: 'partes', error: ERR_PARTES_P1 },
  FVFV: { pct: [61, 82, 34], debil: 'impropias', error: ERR_IMPROPIAS },
  FVVF: { pct: [34, 82, 82], debil: 'partes', error: ERR_PARTES_P1 },
  FVVV: { pct: [61, 82, 82], debil: 'partes', error: ERR_PARTES_P1 },
  VFFF: { pct: [61, 34, 34], debil: 'sustitucion', error: ERR_SUSTITUCION },
  VFFV: { pct: [82, 34, 34], debil: 'sustitucion', error: ERR_SUSTITUCION },
  VFVF: { pct: [61, 34, 82], debil: 'sustitucion', error: ERR_SUSTITUCION },
  VFVV: { pct: [82, 34, 82], debil: 'sustitucion', error: ERR_SUSTITUCION },
  VVFF: { pct: [61, 82, 34], debil: 'impropias', error: ERR_IMPROPIAS },
  VVFV: { pct: [82, 82, 34], debil: 'impropias', error: ERR_IMPROPIAS },
  VVVF: { pct: [61, 82, 82], debil: 'partes', error: ERR_PARTES_P4 },
  VVVV: { pct: [82, 82, 82], debil: 'partes', error: SIN_FALLOS },
};

// Subconjunto para el bloque de barajado: cubre los tres subtemas debiles,
// el caso sin fallos y los dos textos de error de "partes".
const COMBOS_BARAJADO = ['FFFF', 'FVFV', 'VFFF', 'VVVF', 'VVVV', 'FVVV'];

// Combinacion usada para las capturas del flujo del estudiante:
// deja el punto debil en integracion por partes, que es la historia del brief.
const COMBO_CAPTURA = 'FVVV';

// Configuraciones forzadas.
const CFG_FIJA = { adaptativa: false, barajarOpciones: false };
const CFG_BARAJADA = { adaptativa: false, barajarOpciones: true };
const CFG_ADAPTATIVA = { adaptativa: true, barajarOpciones: true };

// Cada materia activa trae 12 preguntas desde la rama juzouy.
const PREGUNTAS_POR_MATERIA = 12;
// La tabla ORACULO describe las 4 preguntas originales del brief (p1..p4 de
// Calculo Integral, que siguen intactas). Los bloques que comparan contra el
// oraculo acotan la prueba a esas 4; el resto del arnes usa la longitud real.
const LONGITUD_ORACULO = 4;
const CFG_ORACULO = { longitud: LONGITUD_ORACULO, adaptativa: false, barajarOpciones: false };
const CFG_ORACULO_BARAJADA = { longitud: LONGITUD_ORACULO, adaptativa: false, barajarOpciones: true };

// Datos validos para crear el perfil del monitor.
const PERFIL_NUEVO = { nombre: 'Mariana T.', semestre: '7', tarifa: '30000' };
const PERFIL_TARIFA_TEXTO = '$30.000';

// ---------------------------------------------------------------------------
// 2. Acumulador de resultados
// ---------------------------------------------------------------------------

const reporte = {
  generado: new Date().toISOString(),
  version: 'v2',
  base: null,
  bloques: [],
  consola: [],
  red: [],
  capturas: [],
  supuestos: [],
  resumen: { total: 0, ok: 0, fallas: 0 },
};

let bloqueActual = null;
let contexto = 'arranque'; // para atribuir errores de consola a una pantalla

function abrirBloque(nombre) {
  bloqueActual = { nombre, comprobaciones: [] };
  reporte.bloques.push(bloqueActual);
  linea('');
  linea('== ' + nombre.toUpperCase() + ' ==');
}

function registrar(nombre, ok, detalle, datos) {
  if (!bloqueActual) abrirBloque('general');
  const c = { nombre, ok: !!ok, detalle: detalle || '' };
  if (datos !== undefined) c.datos = datos;
  bloqueActual.comprobaciones.push(c);
  reporte.resumen.total += 1;
  if (ok) reporte.resumen.ok += 1;
  else reporte.resumen.fallas += 1;
  const marca = ok ? 'OK   ' : 'FALLA';
  linea('  ' + marca + ' ' + nombre + (detalle ? ' -> ' + detalle : ''));
}

function anotar(texto) {
  if (reporte.supuestos.indexOf(texto) === -1) reporte.supuestos.push(texto);
}

function linea(txt) {
  process.stdout.write(txt + '\n');
}

// ---------------------------------------------------------------------------
// 3. Servidor estatico minimo (sin dependencias)
// ---------------------------------------------------------------------------

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function crearServidor(raiz) {
  return new Promise((resolver, rechazar) => {
    const servidor = http.createServer((req, res) => {
      let ruta;
      try {
        ruta = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname || '/');
      } catch (e) {
        res.writeHead(400).end('URL invalida');
        return;
      }
      if (ruta === '/favicon.ico') {
        // Evita un 404 de ruido en el bloque de red.
        res.writeHead(204).end();
        return;
      }
      if (ruta === '/') ruta = '/index.html';
      const destino = path.normalize(path.join(raiz, ruta));
      if (!destino.startsWith(raiz)) {
        res.writeHead(403).end('Fuera de la raiz');
        return;
      }
      fs.readFile(destino, (err, datos) => {
        if (err) {
          res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
          res.end('No encontrado: ' + ruta);
          return;
        }
        res.writeHead(200, {
          'content-type': TIPOS[path.extname(destino).toLowerCase()] || 'application/octet-stream',
          'cache-control': 'no-store',
        });
        res.end(datos);
      });
    });
    servidor.on('error', rechazar);
    servidor.listen(0, '127.0.0.1', () => {
      resolver({ servidor, puerto: servidor.address().port });
    });
  });
}

// ---------------------------------------------------------------------------
// 4. Utilidades de texto
// ---------------------------------------------------------------------------

function normalizarEspacios(s) {
  return String(s == null ? '' : s)
    .replace(/\u00a0/g, ' ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// Equivalencias tipograficas aceptadas al comparar (NO toca tildes).
function normalizarMatematicas(s) {
  return normalizarEspacios(s)
    .replace(/x\s*\^\s*2/gi, 'x²')
    .replace(/x2(?![0-9])/g, 'x²')
    .replace(/\u00b7/g, '·')
    .replace(/\u2212/g, '-');
}

// Comparacion robusta: normaliza espacios y simbolos, ignora mayusculas,
// pero conserva las tildes. Comprueba inclusion del texto esperado.
function contieneTexto(actual, esperado) {
  const a = normalizarMatematicas(actual).toLowerCase();
  const e = normalizarMatematicas(esperado).toLowerCase().replace(/\.$/, '');
  return a.indexOf(e) !== -1;
}

// Sin tildes y en minusculas: para comparar nombres de materia y de subtema.
function plano(s) {
  return normalizarEspacios(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function claveSubtema(nombreVisible) {
  const t = plano(nombreVisible);
  if (t.indexOf('parte') !== -1) return 'partes';
  if (t.indexOf('sustitu') !== -1) return 'sustitucion';
  if (t.indexOf('impropia') !== -1) return 'impropias';
  return null;
}

function numeroDePesos(txt) {
  const m = String(txt || '').match(/\$\s?([\d.,]+)/);
  if (!m) return null;
  const n = parseInt(m[1].replace(/[.,]/g, ''), 10);
  return Number.isNaN(n) ? null : n;
}

// ---------------------------------------------------------------------------
// 5. Auditoria en pagina (layout, tactil, tipografia, pie, comision, contraste)
// ---------------------------------------------------------------------------

function fnAuditoria(opciones) {
  const TXT_PIE = opciones.pie;

  function ruta(el) {
    const partes = [];
    let n = el;
    for (let i = 0; n && n.nodeType === 1 && i < 4; i += 1) {
      let s = n.tagName.toLowerCase();
      if (n.id) {
        partes.unshift(s + '#' + n.id);
        break;
      }
      if (n.classList && n.classList.length) {
        s += '.' + Array.prototype.slice.call(n.classList, 0, 2).join('.');
      }
      partes.unshift(s);
      n = n.parentElement;
    }
    return partes.join(' > ');
  }

  function esVisible(el) {
    if (!el || el.nodeType !== 1) return false;
    if (!el.getClientRects().length) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.visibility === 'collapse') return false;
    if (parseFloat(cs.opacity) === 0) return false;
    return true;
  }

  function dentroDeScrollHorizontal(el) {
    let n = el.parentElement;
    while (n && n.nodeType === 1 && n !== document.documentElement) {
      const cs = getComputedStyle(n);
      if (cs.overflowX === 'auto' || cs.overflowX === 'scroll' || cs.overflowX === 'hidden') return true;
      n = n.parentElement;
    }
    return false;
  }

  function parseColor(str) {
    if (!str) return null;
    const m = String(str).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (p.length < 3 || p.some(function (v) { return Number.isNaN(v); })) return null;
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }

  function componer(arriba, abajo) {
    const a = arriba.a;
    return {
      r: arriba.r * a + abajo.r * (1 - a),
      g: arriba.g * a + abajo.g * (1 - a),
      b: arriba.b * a + abajo.b * (1 - a),
      a: 1,
    };
  }

  function fondoEfectivo(el) {
    const pila = [];
    let n = el;
    let imagen = false;
    while (n && n.nodeType === 1) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') imagen = true;
      const c = parseColor(cs.backgroundColor);
      if (c && c.a > 0) {
        pila.push(c);
        if (c.a >= 1) break;
      }
      n = n.parentElement;
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = pila.length - 1; i >= 0; i -= 1) base = componer(pila[i], base);
    return { color: base, imagen: imagen };
  }

  function luminancia(c) {
    const f = function (v) {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }

  function contraste(a, b) {
    const l1 = luminancia(a);
    const l2 = luminancia(b);
    const hi = Math.max(l1, l2);
    const lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  }

  function tieneTextoDirecto(el) {
    for (let i = 0; i < el.childNodes.length; i += 1) {
      const n = el.childNodes[i];
      if (n.nodeType === 3 && n.nodeValue && n.nodeValue.trim().length) return true;
    }
    return false;
  }

  const vw = window.innerWidth;
  const de = document.documentElement;
  const todos = Array.prototype.slice.call(document.body.querySelectorAll('*'));
  const visibles = todos.filter(esVisible);

  // -- scroll horizontal ----------------------------------------------------
  const scrollHorizontal = {
    scrollWidth: de.scrollWidth,
    clientWidth: de.clientWidth,
    ok: de.scrollWidth <= de.clientWidth + 1,
  };

  // -- desbordes laterales --------------------------------------------------
  const desbordes = [];
  visibles.forEach(function (el) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    if (dentroDeScrollHorizontal(el)) return;
    if (r.right > vw + 1 || r.left < -1) {
      desbordes.push({
        selector: ruta(el),
        izquierda: Math.round(r.left * 10) / 10,
        derecha: Math.round(r.right * 10) / 10,
        ancho: Math.round(r.width * 10) / 10,
      });
    }
  });

  // -- areas tactiles -------------------------------------------------------
  const SEL_TACTIL = 'button, a, input, label.opt, label.slot, label.chip, [role="button"], select, textarea';
  const areasTactiles = [];
  Array.prototype.slice.call(document.body.querySelectorAll(SEL_TACTIL)).forEach(function (el) {
    if (el.type === 'hidden') return;
    if (!esVisible(el)) return;
    // Un input envuelto por un label.opt/.slot/.chip ya se mide en la etiqueta.
    if (el.tagName === 'INPUT' && el.closest('label.opt, label.slot, label.chip')) return;
    const r = el.getBoundingClientRect();
    if (r.width < 43.5 || r.height < 43.5) {
      areasTactiles.push({
        selector: ruta(el),
        ancho: Math.round(r.width * 10) / 10,
        alto: Math.round(r.height * 10) / 10,
        texto: (el.textContent || el.value || '').trim().slice(0, 40),
      });
    }
  });

  // -- tipografia -----------------------------------------------------------
  const tipografia = [];
  visibles.forEach(function (el) {
    const esCampo = /^(INPUT|TEXTAREA|SELECT|BUTTON|OPTION)$/.test(el.tagName);
    if (!esCampo && !tieneTextoDirecto(el)) return;
    const cs = getComputedStyle(el);
    const px = parseFloat(cs.fontSize);
    if (!Number.isNaN(px) && px < 13.995) {
      tipografia.push({
        selector: ruta(el),
        fontSize: Math.round(px * 100) / 100,
        texto: (el.textContent || '').trim().slice(0, 40),
      });
    }
  });

  // -- pie del prototipo ----------------------------------------------------
  const textoVisible = (document.body.innerText || '').replace(/\u00a0/g, ' ');
  const pieNormal = TXT_PIE.replace(/\s+/g, ' ');
  const pieEncontrado = textoVisible.replace(/\s+/g, ' ').indexOf(pieNormal) !== -1;
  let pieElemento = null;
  visibles.forEach(function (el) {
    if (pieElemento) return;
    if (!tieneTextoDirecto(el)) return;
    if ((el.textContent || '').replace(/\s+/g, ' ').indexOf(pieNormal) !== -1) pieElemento = ruta(el);
  });

  // -- sin comision ---------------------------------------------------------
  const llano = textoVisible.replace(/\s+/g, ' ');
  const patrones = [
    /\d+(?:[.,]\d+)?\s*%[^.]{0,60}?comisi[oó]n/i,
    /comisi[oó]n[^.]{0,60}?\d+(?:[.,]\d+)?\s*%/i,
  ];
  const comision = [];
  patrones.forEach(function (re) {
    const m = llano.match(re);
    if (m) comision.push(m[0]);
  });

  // -- contraste ------------------------------------------------------------
  const contrasteFallas = [];
  const vistos = {};
  visibles.forEach(function (el) {
    if (!tieneTextoDirecto(el)) return;
    const cs = getComputedStyle(el);
    const color = parseColor(cs.color);
    if (!color || color.a === 0) return;
    const fondo = fondoEfectivo(el);
    const primerPlano = color.a < 1 ? componer(color, fondo.color) : color;
    const px = parseFloat(cs.fontSize);
    const peso = parseInt(cs.fontWeight, 10) || 400;
    const grande = px >= 24 || (px >= 18.66 && peso >= 700);
    const umbral = grande ? 3 : 4.5;
    const ratio = contraste(primerPlano, fondo.color);
    const clave = cs.color + '|' + Math.round(fondo.color.r) + ',' + Math.round(fondo.color.g) + ',' + Math.round(fondo.color.b) + '|' + umbral;
    if (ratio + 0.005 < umbral && !vistos[clave]) {
      vistos[clave] = true;
      contrasteFallas.push({
        selector: ruta(el),
        texto: (el.textContent || '').trim().slice(0, 40),
        color: cs.color,
        fondo: 'rgb(' + Math.round(fondo.color.r) + ', ' + Math.round(fondo.color.g) + ', ' + Math.round(fondo.color.b) + ')',
        fondoConImagen: fondo.imagen,
        fontSize: Math.round(px * 100) / 100,
        peso: peso,
        umbral: umbral,
        ratio: Math.round(ratio * 100) / 100,
      });
    }
  });

  // -- secciones visibles ---------------------------------------------------
  const seccionesVisibles = Array.prototype.slice
    .call(document.querySelectorAll('section.screen'))
    .filter(esVisible)
    .map(function (s) { return s.id; });

  return {
    viewport: { ancho: vw, alto: window.innerHeight },
    scrollHorizontal: scrollHorizontal,
    desbordes: desbordes,
    areasTactiles: areasTactiles,
    recortados: (function () {
      var malos = [];
      var sel = 'button, a[href], input, select, textarea, label.opt, label.slot, [role="button"]';
      Array.prototype.forEach.call(document.querySelectorAll('section.screen:not([hidden]) ' + sel), function (el) {
        var r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        var p = el.parentElement;
        while (p && p !== document.body) {
          var cs = getComputedStyle(p);
          // Si por el camino hay un ancestro que SI se desplaza, el control es
          // alcanzable y no hay recorte real: se deja de subir.
          var puedeDesplazar = (cs.overflowY === 'auto' || cs.overflowY === 'scroll') && p.scrollHeight > p.clientHeight + 1;
          if (puedeDesplazar) break;
          if (cs.overflowY === 'hidden') {
            var rp = p.getBoundingClientRect();
            var visible = Math.min(r.bottom, rp.bottom) - Math.max(r.top, rp.top);
            if (visible < r.height - 1) {
              malos.push({
                sel: el.tagName.toLowerCase() + (el.id ? '#' + el.id : ''),
                alto: Math.round(r.height),
                visible: Math.round(Math.max(visible, 0)),
                contenedor: p.tagName.toLowerCase() + (p.className && typeof p.className === 'string' ? '.' + String(p.className).trim().split(/\s+/)[0] : '')
              });
            }
            break;
          }
          p = p.parentElement;
        }
      });
      return malos;
    })(),
    tipografia: tipografia,
    pie: { encontrado: pieEncontrado, selector: pieElemento },
    comision: comision,
    contraste: contrasteFallas,
    seccionesVisibles: seccionesVisibles,
  };
}

async function auditarPantalla(page, etiqueta) {
  const r = await page.evaluate(fnAuditoria, { pie: TXT_PIE });

  registrar(
    etiqueta + ' · scrollHorizontal',
    r.scrollHorizontal.ok,
    r.scrollHorizontal.ok ? '' : 'scrollWidth ' + r.scrollHorizontal.scrollWidth + ' > clientWidth ' + r.scrollHorizontal.clientWidth,
    r.scrollHorizontal
  );

  registrar(
    etiqueta + ' · desbordes',
    r.desbordes.length === 0,
    r.desbordes.length === 0
      ? ''
      : r.desbordes.length + ' elemento(s) fuera del viewport: ' + r.desbordes.slice(0, 3).map((d) => d.selector + ' [' + d.izquierda + '..' + d.derecha + ']').join('; '),
    r.desbordes
  );

  registrar(
    etiqueta + ' · controlesNoRecortados',
    (r.recortados || []).length === 0,
    (r.recortados || []).length === 0 ? '' :
      (r.recortados || []).map(function (x) {
        return x.sel + ' mide ' + x.alto + 'px pero solo se ven ' + x.visible + 'px dentro de ' + x.contenedor;
      }).join(' | '),
    r.recortados
  );

  registrar(
    etiqueta + ' · areasTactiles',
    r.areasTactiles.length === 0,
    r.areasTactiles.length === 0
      ? ''
      : r.areasTactiles.length + ' por debajo de 44x44: ' + r.areasTactiles.slice(0, 3).map((a) => a.selector + ' (' + a.ancho + 'x' + a.alto + ')').join('; '),
    r.areasTactiles
  );

  registrar(
    etiqueta + ' · tipografia',
    r.tipografia.length === 0,
    r.tipografia.length === 0
      ? ''
      : r.tipografia.length + ' por debajo de 14px: ' + r.tipografia.slice(0, 3).map((t) => t.selector + ' (' + t.fontSize + 'px)').join('; '),
    r.tipografia
  );

  registrar(
    etiqueta + ' · pieProtitipo',
    r.pie.encontrado,
    r.pie.encontrado ? r.pie.selector || '' : 'no aparece visible el texto "' + TXT_PIE + '"',
    r.pie
  );

  registrar(
    etiqueta + ' · sinComision',
    r.comision.length === 0,
    r.comision.length === 0 ? '' : 'aparece cifra de comision: ' + r.comision.join(' | '),
    r.comision
  );

  registrar(
    etiqueta + ' · contraste',
    r.contraste.length === 0,
    r.contraste.length === 0
      ? ''
      : r.contraste.length + ' par(es) por debajo del umbral: ' +
        r.contraste.slice(0, 3).map((c) => c.selector + ' ' + c.ratio + ':1 (min ' + c.umbral + ') ' + c.color + ' sobre ' + c.fondo).join('; '),
    r.contraste
  );

  registrar(
    etiqueta + ' · unaSolaPantalla',
    r.seccionesVisibles.length === 1,
    r.seccionesVisibles.length === 1 ? r.seccionesVisibles[0] : 'secciones visibles: [' + r.seccionesVisibles.join(', ') + ']',
    r.seccionesVisibles
  );

  return r;
}

// ---------------------------------------------------------------------------
// 6. Utilidades de navegacion sobre el prototipo
// ---------------------------------------------------------------------------

const HASH_DE_SECCION = {
  's-inicio': '#inicio',
  's-prueba': '#prueba',
  's-diagnostico': '#diagnostico',
  's-monitores': '#monitores',
  's-perfil': '#perfil',
  's-confirmacion': '#confirmacion',
  's-monitor': '#monitor',
  's-monitor-materia': '#monitor-materia',
  's-certificacion': '#certificacion',
  's-monitor-resultado': '#monitor-resultado',
  's-panel': '#panel',
  's-profesor': '#profesor',
  's-buscar': '#buscar',
  's-crear-perfil': '#crear-perfil',
};

async function esperarPantalla(page, id, etiqueta) {
  try {
    await page.waitForSelector('#' + id, { state: 'visible', timeout: TIEMPO });
  } catch (e) {
    const existe = await page.locator('#' + id).count().catch(() => 0);
    const est = await estadoPantallas(page).catch(() => ({ visibles: ['?'], hash: '?' }));
    throw new Error(
      'No aparecio la pantalla #' + id + (etiqueta ? ' (' + etiqueta + ')' : '') + '. ' +
      (existe === 0
        ? 'La seccion NO EXISTE en el documento. El contrato v2 pide <section id="' + id + '" class="screen" hidden> con hash ' + (HASH_DE_SECCION[id] || '?') + '.'
        : 'La seccion existe pero sigue oculta. Visibles ahora: [' + est.visibles.join(', ') + '] con hash "' + est.hash + '".')
    );
  }
}

async function seccionVisible(page, id) {
  return page.locator('#' + id).isVisible().catch(() => false);
}

async function clic(page, selector, etiqueta) {
  const loc = page.locator(selector).first();
  try {
    await loc.waitFor({ state: 'visible', timeout: TIEMPO });
  } catch (e) {
    throw new Error('No encuentro el elemento clicable "' + selector + '"' + (etiqueta ? ' (' + etiqueta + ')' : '') + '.');
  }
  await loc.click();
}

async function primerSelector(page, lista) {
  for (const s of lista) {
    const n = await page.locator(s).count().catch(() => 0);
    if (n > 0) return s;
  }
  return null;
}

async function exigirSelector(page, lista, queEs) {
  const s = await primerSelector(page, lista);
  if (!s) {
    const est = await estadoPantallas(page).catch(() => ({ visibles: ['?'], hash: '?' }));
    throw new Error(
      'Falta ' + queEs + '. Busque cualquiera de estos selectores y no existe ninguno: ' +
      lista.join('  |  ') + '. Pantalla visible: [' + est.visibles.join(', ') + '] hash "' + est.hash + '".'
    );
  }
  if (s !== lista[0]) anotar('Se uso el selector alterno "' + s + '" para ' + queEs + ' (el preferido es "' + lista[0] + '").');
  return s;
}

async function irAInicio(page, base) {
  // goto sin hash fuerza recarga completa: el estado en memoria queda limpio.
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await esperarPantalla(page, 's-inicio', 'pantalla de arranque');
}

// Navega por hash SIN recargar: conserva el estado en memoria.
async function irPorHash(page, hash) {
  await page.evaluate((h) => { window.location.hash = h; }, hash);
  await page.waitForTimeout(250);
}

// Marca el elemento elegido con un atributo temporal y lo devuelve como
// selector. Evita componer selectores por concatenacion, que se rompe con
// listas separadas por coma.
const MARCA = 'data-arnes-objetivo';

async function limpiarMarca(page) {
  await page.evaluate((attr) => {
    Array.prototype.slice.call(document.querySelectorAll('[' + attr + ']')).forEach((n) => n.removeAttribute(attr));
  }, MARCA).catch(() => {});
}

// Elige una materia concreta por id (o por nombre visible si no hay
// data-materia). Devuelve informacion de lo que pulso.
async function elegirMateria(page, contenedor, materia) {
  await limpiarMarca(page);
  const info = await page.evaluate(({ cont, id, nombre, attr }) => {
    function llano(s) {
      return String(s || '').replace(/\s+/g, ' ').trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    const c = document.querySelector(cont);
    if (!c) return { error: 'no existe el contenedor ' + cont };
    let nodos = Array.prototype.slice.call(c.querySelectorAll('[data-materia]'));
    let porDato = nodos.length > 0;
    if (!nodos.length) nodos = Array.prototype.slice.call(c.querySelectorAll('.materia'));
    if (!nodos.length) nodos = Array.prototype.slice.call(c.querySelectorAll('li'));
    if (!nodos.length) return { error: 'la lista ' + cont + ' esta vacia' };
    let idx = -1;
    if (porDato) idx = nodos.findIndex((n) => n.getAttribute('data-materia') === id);
    if (idx < 0) idx = nodos.findIndex((n) => llano(n.textContent).indexOf(llano(nombre)) !== -1);
    if (idx < 0) return { error: 'no encuentro la materia "' + nombre + '" (id ' + id + ') dentro de ' + cont };
    const el = nodos[idx];
    const pronto = el.classList.contains('is-pronto') || !!el.querySelector('.is-pronto');
    el.setAttribute(attr, '1');
    return { idx, total: nodos.length, porDato, pronto, texto: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60) };
  }, { cont: contenedor, id: materia.id, nombre: materia.nombre, attr: MARCA });
  if (info.error) throw new Error(info.error);
  try {
    await page.locator('[' + MARCA + '="1"]').first().click({ timeout: 2500 });
  } catch (e) {
    // La materia puede no ser interactiva; entonces manda el boton principal.
  }
  await limpiarMarca(page);
  return info;
}

async function clicOpcionPorIndice(page, contenedor, idx, etiqueta) {
  await limpiarMarca(page);
  const info = await page.evaluate(({ cont, i, attr }) => {
    const c = document.querySelector(cont);
    if (!c) return { error: 'no existe el contenedor ' + cont };
    let nodos = Array.prototype.slice.call(c.querySelectorAll('.opt'));
    if (!nodos.length) nodos = Array.prototype.slice.call(c.querySelectorAll('li'));
    if (!nodos.length) nodos = Array.prototype.slice.call(c.children);
    if (i < 0 || i >= nodos.length) return { error: 'la opcion ' + i + ' no existe (hay ' + nodos.length + ')' };
    nodos[i].setAttribute(attr, '1');
    return { ok: true, texto: (nodos[i].textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60) };
  }, { cont: contenedor, i: idx, attr: MARCA });
  if (info.error) throw new Error('[' + etiqueta + '] ' + info.error);
  try {
    await page.locator('[' + MARCA + '="1"]').first().click();
  } catch (e) {
    throw new Error('[' + etiqueta + '] no pude pulsar la opcion ' + idx + ': ' + e.message);
  }
  await limpiarMarca(page);
  return info;
}

async function avanzarPregunta(page, cfg) {
  const antes = normalizarEspacios(await page.locator(cfg.enunciado).first().textContent());
  await clic(page, cfg.boton, cfg.etiqueta);
  try {
    await page.waitForFunction(
      ([selEnun, prev, selDestino]) => {
        const d = document.querySelector(selDestino);
        if (d && d.getClientRects().length) return true;
        const e = document.querySelector(selEnun);
        if (!e) return false;
        return e.textContent.replace(/\s+/g, ' ').trim() !== prev;
      },
      [cfg.enunciado, antes, cfg.destino],
      { timeout: TIEMPO }
    );
  } catch (e) {
    throw new Error(
      '[' + cfg.etiqueta + '] tras pulsar ' + cfg.boton + ' ni cambio el enunciado ni aparecio ' + cfg.destino + '.'
    );
  }
}

// ---------------------------------------------------------------------------
// 7. Ganchos de datos: MATERIAS y semilla
// ---------------------------------------------------------------------------

const SEL_PRUEBA = {
  enunciado: '#prueba-enunciado',
  opciones: '#prueba-opciones',
  boton: '#prueba-siguiente',
  topic: '#prueba-topic',
  contador: '#prueba-contador',
  destino: '#s-diagnostico',
  destinoId: 's-diagnostico',
  etiqueta: 'E2',
};

const SEL_CERT = {
  enunciado: '#cert-enunciado',
  opciones: '#cert-opciones',
  boton: '#cert-siguiente',
  topic: '#cert-topic',
  contador: '#cert-contador',
  destino: '#s-monitor-resultado',
  destinoId: 's-monitor-resultado',
  etiqueta: 'M3',
};

async function leerMaterias(page) {
  const m = await page.evaluate(() => {
    const src = window.MATERIAS
      || window.__calibraMaterias
      || (window.__calibra && window.__calibra.MATERIAS);
    if (!src) return null;
    try { return JSON.parse(JSON.stringify(src)); } catch (e) { return null; }
  });
  if (!m || !Array.isArray(m) || !m.length) {
    throw new Error(
      'No pude leer el arreglo de materias desde la pagina. El contrato v2 exige exponerlo como ' +
      'window.MATERIAS (o window.__calibraMaterias) para que el arnes sepa que opcion es la correcta ' +
      'y pueda forzar { adaptativa:false, barajarOpciones:false } antes de cada recorrido.'
    );
  }
  return m;
}

function buscarMateria(materias, id) {
  const m = materias.find((x) => x.id === id);
  if (!m) {
    throw new Error(
      'No existe la materia con id "' + id + '" en MATERIAS. Ids encontrados: ' +
      materias.map((x) => x.id).join(', ') + '. El contrato fija "' + MATERIA_DEMO + '" para Calculo Integral.'
    );
  }
  return m;
}

// Fuerza la configuracion de prueba/certificacion de una materia YA cargada.
// Se llama despues del goto y antes de entrar al recorrido.
async function forzarConfig(page, id, prueba, certificacion) {
  const r = await page.evaluate(({ mid, p, c }) => {
    const src = window.MATERIAS
      || window.__calibraMaterias
      || (window.__calibra && window.__calibra.MATERIAS);
    if (!src) return { error: 'no existe window.MATERIAS' };
    const m = src.find((x) => x.id === mid);
    if (!m) return { error: 'no existe la materia ' + mid };
    if (p) { m.prueba = Object.assign({}, m.prueba, p); }
    if (c) { m.certificacion = Object.assign({}, m.certificacion, c); }
    return { ok: true, prueba: m.prueba, certificacion: m.certificacion };
  }, { mid: id, p: prueba || null, c: certificacion || null });
  if (r.error) throw new Error('No pude forzar la configuracion de la materia: ' + r.error);
  return r;
}

async function fijarSemilla(page, semilla) {
  await page.evaluate((s) => { window.__calibraSemilla = s; }, semilla);
}

// Prepara la pagina desde cero con configuracion y semilla.
async function preparar(page, base, opciones) {
  const o = opciones || {};
  await page.goto(base + (o.hash || ''), { waitUntil: 'domcontentloaded' });
  if (o.semilla !== undefined) await fijarSemilla(page, o.semilla);
  if (o.prueba || o.certificacion) await forzarConfig(page, o.materia || MATERIA_DEMO, o.prueba, o.certificacion);
  if (!o.hash) await esperarPantalla(page, 's-inicio', 'pantalla de arranque');
}

// ---------------------------------------------------------------------------
// 8. Lectura de la pregunta en pantalla y emparejamiento con los datos
// ---------------------------------------------------------------------------

function fnLeerPregunta(sel) {
  const e = document.querySelector(sel.enunciado);
  const c = document.querySelector(sel.opciones);
  if (!e) return { error: 'falta el elemento ' + sel.enunciado };
  if (!c) return { error: 'falta el elemento ' + sel.opciones };
  let nodos = Array.prototype.slice.call(c.querySelectorAll('.opt'));
  if (!nodos.length) nodos = Array.prototype.slice.call(c.querySelectorAll('li'));
  if (!nodos.length) nodos = Array.prototype.slice.call(c.children);
  const opciones = nodos.map(function (n, i) {
    const k = n.querySelector('.key');
    let t = n.textContent || '';
    if (k && k.textContent) t = t.replace(k.textContent, '');
    return {
      i: i,
      letra: k ? (k.textContent || '').trim().toUpperCase().replace(/[^A-Z]/g, '') : '',
      texto: t.replace(/\s+/g, ' ').trim(),
    };
  });
  const topic = document.querySelector(sel.topic);
  const cont = document.querySelector(sel.contador);
  return {
    enunciado: (e.textContent || '').replace(/\s+/g, ' ').trim(),
    opciones: opciones,
    topic: topic ? (topic.textContent || '').replace(/\s+/g, ' ').trim() : null,
    contador: cont ? (cont.textContent || '').replace(/\s+/g, ' ').trim() : null,
  };
}

async function leerPreguntaActual(page, sel) {
  const r = await page.evaluate(fnLeerPregunta, sel);
  if (r.error) throw new Error('[' + sel.etiqueta + '] ' + r.error + ' (lo exige el contrato).');
  if (!r.opciones.length) throw new Error('[' + sel.etiqueta + '] ' + sel.opciones + ' no tiene opciones dentro.');
  return r;
}

function localizarPregunta(materia, enunciadoDom) {
  const objetivo = normalizarMatematicas(enunciadoDom).toLowerCase();
  const p = materia.preguntas.find((q) => {
    const e = normalizarMatematicas(q.enunciado).toLowerCase();
    return e === objetivo || objetivo.indexOf(e) !== -1 || e.indexOf(objetivo) !== -1;
  });
  if (!p) {
    throw new Error(
      'El enunciado en pantalla no corresponde a ninguna pregunta del banco de "' + materia.id + '": "' +
      enunciadoDom.slice(0, 90) + '". Enunciados del banco: ' +
      materia.preguntas.map((q) => q.id).join(', ') + '.'
    );
  }
  return p;
}

// Empareja cada opcion del DOM con su opcion en los datos, por CONTENIDO.
// Es la unica forma valida de responder cuando las opciones van barajadas.
function emparejarOpciones(pregunta, domOpciones) {
  return domOpciones.map((d) => {
    const t = normalizarMatematicas(d.texto).toLowerCase();
    let idx = pregunta.opciones.findIndex((o) => normalizarMatematicas(o.texto).toLowerCase() === t);
    if (idx < 0) {
      idx = pregunta.opciones.findIndex((o) => {
        const ot = normalizarMatematicas(o.texto).toLowerCase();
        return ot.length > 2 && (t.indexOf(ot) !== -1 || ot.indexOf(t) !== -1);
      });
    }
    if (idx < 0) {
      throw new Error(
        'La opcion en pantalla "' + d.texto.slice(0, 60) + '" no coincide con ninguna opcion de ' +
        pregunta.id + ' en los datos. El motor debe pintar el texto literal de la opcion.'
      );
    }
    return { dom: d, idxDatos: idx, datos: pregunta.opciones[idx] };
  });
}

/*
 * Recorre una prueba (o certificacion) completa.
 *   decidir({ paso, pregunta, mapa }) -> indice DOM de la opcion a pulsar.
 * Devuelve la traza: un objeto por pregunta respondida.
 */
async function recorrer(page, sel, materia, decidir) {
  const traza = [];
  const MAX = 40;
  for (let paso = 0; paso < MAX; paso += 1) {
    if (await seccionVisible(page, sel.destinoId)) break;
    const dom = await leerPreguntaActual(page, sel);
    const pregunta = localizarPregunta(materia, dom.enunciado);
    const mapa = emparejarOpciones(pregunta, dom.opciones);
    const idxDom = decidir({ paso, pregunta, mapa, dom, materia });
    if (typeof idxDom !== 'number' || idxDom < 0 || idxDom >= mapa.length) {
      throw new Error('[' + sel.etiqueta + '] la estrategia devolvio un indice invalido: ' + idxDom);
    }
    const elegido = mapa[idxDom];
    traza.push({
      paso,
      preguntaId: pregunta.id,
      subtema: pregunta.subtema,
      dificultad: pregunta.dificultad === undefined ? 2 : pregunta.dificultad,
      contador: dom.contador,
      topic: dom.topic,
      letra: elegido.dom.letra,
      idxDom,
      idxDatos: elegido.idxDatos,
      // firma del orden en que se pintaron las opciones (indices de datos)
      ordenOpciones: mapa.map((m) => m.idxDatos).join(''),
      correcta: !!elegido.datos.correcta,
      error: elegido.datos.error || null,
      textoElegido: elegido.datos.texto,
    });
    await clicOpcionPorIndice(page, sel.opciones, idxDom, sel.etiqueta + ' pregunta ' + (paso + 1));
    await avanzarPregunta(page, {
      enunciado: sel.enunciado,
      boton: sel.boton,
      destino: sel.destino,
      etiqueta: sel.etiqueta + ' pregunta ' + (paso + 1),
    });
    if (await seccionVisible(page, sel.destinoId)) break;
  }
  if (!traza.length) throw new Error('[' + sel.etiqueta + '] no se respondio ninguna pregunta.');
  return traza;
}

// -- estrategias de respuesta ------------------------------------------------

// Responde correcto o incorrecto segun un patron V/F posicional.
function estrategiaPatron(patron) {
  return ({ paso, mapa }) => {
    const quiereAcierto = patron[paso] === 'V';
    const idx = mapa.findIndex((m) => !!m.datos.correcta === quiereAcierto);
    if (idx < 0) throw new Error('no hay opcion ' + (quiereAcierto ? 'correcta' : 'incorrecta') + ' en el paso ' + (paso + 1));
    return idx;
  };
}

// Igual que la anterior pero la incorrecta es la CANONICA (la primera
// incorrecta en el orden de los datos), que es la que fija la tabla oraculo.
function estrategiaPatronCanonica(patron) {
  return ({ paso, mapa }) => {
    const quiereAcierto = patron[paso] === 'V';
    if (quiereAcierto) {
      const i = mapa.findIndex((m) => !!m.datos.correcta);
      if (i < 0) throw new Error('la pregunta del paso ' + (paso + 1) + ' no tiene opcion correcta');
      return i;
    }
    let mejor = -1;
    mapa.forEach((m, i) => {
      if (m.datos.correcta) return;
      if (mejor < 0 || m.idxDatos < mapa[mejor].idxDatos) mejor = i;
    });
    if (mejor < 0) throw new Error('la pregunta del paso ' + (paso + 1) + ' no tiene opciones incorrectas');
    return mejor;
  };
}

// Estrategias dinamicas para el modo adaptativo (no se sabe cuantas preguntas
// habra ni de que subtema).
const ESTRATEGIAS = {
  'todo-bien': ({ mapa }) => mapa.findIndex((m) => !!m.datos.correcta),
  'todo-mal': ({ mapa }) => mapa.findIndex((m) => !m.datos.correcta),
  alterna: ({ paso, mapa }) => mapa.findIndex((m) => !!m.datos.correcta === (paso % 2 === 0)),
  'primera-mal': ({ paso, mapa }) => mapa.findIndex((m) => !!m.datos.correcta === (paso !== 0)),
  'cada-tres-mal': ({ paso, mapa }) => mapa.findIndex((m) => !!m.datos.correcta === (paso % 3 !== 0)),
};

// ---------------------------------------------------------------------------
// 9. Lectura del diagnostico
// ---------------------------------------------------------------------------

async function leerDiagnostico(page) {
  const d = await page.evaluate(() => {
    const cont = document.querySelector('#diag-barras');
    if (!cont) return { fallo: 'falta el elemento #diag-barras que exige el contrato' };
    const filas = Array.prototype.slice.call(cont.querySelectorAll('li'));
    const barras = filas.map((li) => {
      const n = li.querySelector('.bar-name');
      const p = li.querySelector('.bar-pct');
      return {
        nombre: n ? n.textContent.trim() : (li.textContent || '').trim(),
        pct: p ? parseInt(String(p.textContent).replace(/[^0-9]/g, ''), 10) : null,
        crudo: li.getAttribute('data-pct-crudo'),
        subtema: li.getAttribute('data-subtema'),
        debil: li.classList.contains('is-weak'),
      };
    });
    const t = document.querySelector('#diag-debil-titulo');
    const e = document.querySelector('#diag-debil-error');
    return {
      barras,
      titulo: t ? t.textContent.replace(/\s+/g, ' ').trim() : null,
      error: e ? e.textContent.replace(/\s+/g, ' ').trim() : null,
      faltaTitulo: !t,
      faltaError: !e,
    };
  });
  if (d.fallo) throw new Error(d.fallo);
  return d;
}

// Clave de subtema de una barra: primero data-subtema, luego el nombre.
function claveDeBarra(materia, barra) {
  if (barra.subtema && materia.subtemas && materia.subtemas[barra.subtema] !== undefined) return barra.subtema;
  const llano = plano(barra.nombre);
  const claves = Object.keys(materia.subtemas || {});
  const hit = claves.find((k) => plano(materia.subtemas[k]) === llano || llano.indexOf(plano(materia.subtemas[k])) !== -1);
  return hit || claveSubtema(barra.nombre);
}

async function capturar(page, dir, nombre, etiqueta) {
  const destino = path.join(dir, nombre);
  await page.screenshot({ path: destino, fullPage: false });
  reporte.capturas.push({
    archivo: path.relative(DIR_CAPTURAS, destino).split(path.sep).join('/'),
    carpeta: path.basename(dir),
    etiqueta: etiqueta || nombre,
  });
  return destino;
}

async function estadoPantallas(page) {
  return page.evaluate(() => {
    const secciones = Array.prototype.slice.call(document.querySelectorAll('section.screen'));
    const visibles = secciones.filter((s) => s.getClientRects().length > 0).map((s) => s.id);
    return {
      hash: window.location.hash,
      visibles,
      total: secciones.length,
      textoVisible: (document.body.innerText || '').trim().length > 0,
    };
  });
}

function esFuente(u) {
  return HOSTS_FUENTES.some((h) => String(u).indexOf(h) !== -1);
}

// ---------------------------------------------------------------------------
// 10. Entradas a los recorridos
// ---------------------------------------------------------------------------

async function entrarAPrueba(page, materia) {
  await elegirMateria(page, '#lista-materias', materia);
  await clic(page, '#s-inicio [data-ir="prueba"]', 'boton Empezar la prueba (E1)');
  await esperarPantalla(page, 's-prueba', 'E2');
}

// Desde juzouy, M2 no salta a la certificacion: pasa por M2.5 (#monitor-correo),
// que pide el correo antes de evaluar. Se soportan los dos flujos.
async function pasarDeM2aCertificacion(page, retratar) {
  const directo = page.locator('#s-monitor-materia [data-ir="certificacion"]').first();
  if (await directo.isVisible().catch(() => false)) {
    await directo.click();
    await esperarPantalla(page, 's-certificacion', 'M3');
    return;
  }
  await clic(page, '#s-monitor-materia [data-ir="monitor-correo"]', 'boton de M2 hacia M2.5');
  await esperarPantalla(page, 's-monitor-correo', 'M2.5');
  if (retratar) {
    await auditarPantalla(page, 'm-02b-correo-monitor');
    await capturar(page, DIR_MON, 'm-02b-correo-monitor.png', 'M2.5 · Correo del monitor');
    await page.locator('#correo-monitor-pre').first().fill('no-es-un-correo');
    await page.locator('#s-monitor-correo button[type="submit"]').first().click();
    await page.waitForTimeout(300);
    const sigue = await seccionVisible(page, 's-monitor-correo');
    registrar('M2.5 · un correo invalido no deja pasar a la certificacion', sigue, sigue ? '' : 'avanzo con "no-es-un-correo"');
  }
  await page.locator('#correo-monitor-pre').first().fill('monitor.demo@uniandes.edu.co');
  await page.locator('#s-monitor-correo button[type="submit"]').first().click();
  await esperarPantalla(page, 's-monitor-correo', 'M2.5 tras enviar (queda a la espera de contacto)');
  // El envio ya no salta solo a la certificacion: el equipo contacta antes.
  // El arnes fuerza el salto para seguir probando la logica de M3/M4.
  await page.evaluate(function () { location.hash = '#certificacion'; });
  await esperarPantalla(page, 's-certificacion', 'M3 tras M2.5 (salto forzado por el arnes)');
}

async function entrarACertificacion(page, base, materia, cfg) {
  await preparar(page, base, { certificacion: cfg || CFG_FIJA });
  await clic(page, '#s-inicio [data-ir="monitor"]', 'enlace Soy monitor (E1)');
  await esperarPantalla(page, 's-monitor', 'M1');
  await clic(page, '#s-monitor [data-ir="monitor-materia"]', 'boton de M1 hacia M2');
  await esperarPantalla(page, 's-monitor-materia', 'M2');
  await elegirMateria(page, '#s-monitor-materia .materias, #s-monitor-materia ul, #s-monitor-materia', materia);
  await pasarDeM2aCertificacion(page, false);
}

async function enviarCorreo(page, selectorForm, correo) {
  const form = page.locator(selectorForm).first();
  await form.waitFor({ state: 'visible', timeout: TIEMPO }).catch(() => {
    throw new Error('No encuentro el formulario ' + selectorForm + ' (contrato: form.captura con data-rol).');
  });
  await form.locator('input[type="email"]').first().fill(correo);
  await form.locator('button[type="submit"], button').first().click();
  await form.locator('.gracias').first().waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
}

// ---------------------------------------------------------------------------
// 11. Bloque: codigo fuente
// ---------------------------------------------------------------------------

function tieneId(fuente, id) {
  return fuente.indexOf('id="' + id + '"') !== -1 || fuente.indexOf("id='" + id + "'") !== -1;
}

async function bloqueFuente() {
  abrirBloque('Codigo fuente');
  const fuente = fs.readFileSync(INDEX, 'utf8');

  const usaLocal = /\blocalStorage\b/.test(fuente);
  const usaSesion = /\bsessionStorage\b/.test(fuente);
  registrar(
    'almacenamiento · sin localStorage ni sessionStorage',
    !usaLocal && !usaSesion,
    !usaLocal && !usaSesion ? '' : 'el fuente menciona ' + [usaLocal ? 'localStorage' : null, usaSesion ? 'sessionStorage' : null].filter(Boolean).join(' y ')
  );

  const secciones12 = [
    's-inicio', 's-prueba', 's-diagnostico', 's-monitores', 's-perfil', 's-confirmacion',
    's-monitor', 's-monitor-materia', 's-certificacion', 's-monitor-resultado', 's-panel', 's-profesor',
  ];
  const faltan = secciones12.filter((id) => !tieneId(fuente, id));
  registrar(
    'contrato · las 12 secciones originales existen',
    faltan.length === 0,
    faltan.length === 0 ? '' : 'faltan: ' + faltan.join(', ')
  );

  const seccionesNuevas = ['s-buscar', 's-crear-perfil'];
  const faltanNuevas = seccionesNuevas.filter((id) => !tieneId(fuente, id));
  registrar(
    'contrato v2 · las 2 secciones nuevas existen',
    faltanNuevas.length === 0,
    faltanNuevas.length === 0
      ? ''
      : 'faltan: ' + faltanNuevas.join(', ') + ' (s-buscar => #buscar, entrada libre; s-crear-perfil => #crear-perfil, requiere certificado)'
  );

  const ids = [
    'lista-materias', 'prueba-contador', 'prueba-track', 'prueba-track-fill', 'prueba-topic',
    'prueba-enunciado', 'prueba-opciones', 'prueba-siguiente', 'diag-barras', 'diag-debil-titulo',
    'diag-debil-error', 'lista-monitores', 'perfil-contenido', 'confirmacion-resumen',
    'cert-contador', 'cert-track', 'cert-track-fill', 'cert-topic', 'cert-enunciado', 'cert-opciones',
    'cert-siguiente', 'cert-resultado', 'panel-contenido', 'btn-reiniciar',
  ];
  const faltanIds = ids.filter((id) => !tieneId(fuente, id));
  registrar(
    'contrato · ids que rellena el motor',
    faltanIds.length === 0,
    faltanIds.length === 0 ? '' : 'faltan: ' + faltanIds.join(', ')
  );

  const idsNuevos = ['buscar-lista', 'buscar-conteo', 'buscar-vacio'];
  const faltanNuevos = idsNuevos.filter((id) => !tieneId(fuente, id));
  registrar(
    'contrato v2 · ids de la exploracion libre',
    faltanNuevos.length === 0,
    faltanNuevos.length === 0 ? '' : 'faltan: ' + faltanNuevos.join(', ')
  );

  const capturas = (fuente.match(/class="captura"/g) || []).length + (fuente.match(/class='captura'/g) || []).length;
  registrar(
    'contrato · tres formularios .captura',
    capturas >= 3,
    'encontrados: ' + capturas + ' (esperados 3: estudiante, monitor, profesor)'
  );

  // -- determinismo ---------------------------------------------------------
  const hayMulberry = /mulberry32/i.test(fuente);
  registrar(
    'determinismo · implementa mulberry32',
    hayMulberry,
    hayMulberry ? '' : 'el contrato exige un PRNG con semilla llamado mulberry32'
  );

  const haySemilla = /__calibraSemilla/.test(fuente);
  registrar(
    'determinismo · expone window.__calibraSemilla',
    haySemilla,
    haySemilla ? '' : 'sin este gancho el arnes no puede fijar la semilla antes de cada recorrido'
  );

  // Se quitan comentarios antes de buscar: el motor menciona Math.random en
  // comentarios que explican justamente que no lo usa, y daba falso positivo.
  const _sinComentarios = fuente
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
  const usaMathRandom = /Math\s*\.\s*random/.test(_sinComentarios);
  registrar(
    'determinismo · sin Math.random',
    !usaMathRandom,
    usaMathRandom ? 'el barajado y los desempates deben salir del PRNG con semilla, no de Math.random' : ''
  );

  const exponeMaterias = /window\s*\.\s*(MATERIAS|__calibraMaterias)/.test(fuente)
    || /window\.__calibra\s*=/.test(fuente);
  registrar(
    'contrato v2 · expone MATERIAS en window',
    exponeMaterias,
    exponeMaterias ? '' : 'el arnes necesita leer y mutar el arreglo de materias (window.MATERIAS)'
  );

  // -- estructura de datos v2 ----------------------------------------------
  const campos = ['barajarOpciones', 'adaptativa', 'minimoAciertos', 'subtemas', 'dificultad'];
  const faltanCampos = campos.filter((c) => fuente.indexOf(c) === -1);
  registrar(
    'contrato v2 · campos de la estructura de datos',
    faltanCampos.length === 0,
    faltanCampos.length === 0 ? '' : 'no aparecen en el fuente: ' + faltanCampos.join(', ')
  );

  // -- higiene: nada de innerHTML con interpolacion --------------------------
  const innerHtmlPeligroso = (fuente.match(/innerHTML\s*(\+)?=\s*[`'"][^`'"]*\$\{/g) || []).length
    + (fuente.match(/innerHTML\s*(\+)?=\s*[^;]*\+\s*\w+/g) || []).length;
  registrar(
    'seguridad · sin innerHTML con datos interpolados',
    innerHtmlPeligroso === 0,
    innerHtmlPeligroso === 0 ? '' : innerHtmlPeligroso + ' asignacion(es) a innerHTML con datos; el contrato pide textContent'
  );
}

// ---------------------------------------------------------------------------
// 12. Bloque: capturas y auditoria por pantalla
// ---------------------------------------------------------------------------

async function bloqueCapturas(page, base, materia) {
  abrirBloque('Capturas y auditoria por pantalla');

  // ---------------- Flujo del estudiante ----------------
  contexto = 'E1 inicio';
  await preparar(page, base, { prueba: CFG_FIJA, certificacion: CFG_FIJA });
  await auditarPantalla(page, 'e-01-inicio');
  await capturar(page, DIR_EST, 'e-01-inicio.png', 'E1 · Inicio');

  contexto = 'E2 prueba';
  await entrarAPrueba(page, materia);

  const desactivado = await page.locator('#prueba-siguiente').first().isDisabled().catch(() => null);
  registrar(
    'E2 · Siguiente deshabilitado hasta elegir',
    desactivado === true,
    desactivado === true ? '' : 'el boton #prueba-siguiente no esta deshabilitado al entrar a la pregunta 1'
  );

  for (let i = 0; i < COMBO_CAPTURA.length; i += 1) {
    const n = i + 1;
    contexto = 'E2 pregunta ' + n;
    await auditarPantalla(page, 'e-0' + (n + 1) + '-pregunta-' + n);
    await capturar(page, DIR_EST, 'e-0' + (n + 1) + '-pregunta-' + n + '.png', 'E2 · Pregunta ' + n);
    const dom = await leerPreguntaActual(page, SEL_PRUEBA);
    const pregunta = localizarPregunta(materia, dom.enunciado);
    const mapa = emparejarOpciones(pregunta, dom.opciones);
    const idx = estrategiaPatronCanonica(COMBO_CAPTURA)({ paso: i, mapa });
    await clicOpcionPorIndice(page, SEL_PRUEBA.opciones, idx, 'E2 pregunta ' + n);
    await avanzarPregunta(page, {
      enunciado: SEL_PRUEBA.enunciado,
      boton: SEL_PRUEBA.boton,
      destino: SEL_PRUEBA.destino,
      etiqueta: 'E2 pregunta ' + n,
    });
  }

  // Con 12 preguntas, despues de las 4 retratadas quedan mas. Se responden en
  // orden hasta el diagnostico; la ultima se audita y se retrata.
  const totalPrueba = (materia.prueba && materia.prueba.longitud) || COMBO_CAPTURA.length;
  let contadorFinal = '';
  for (let i = COMBO_CAPTURA.length; i < totalPrueba; i += 1) {
    const n = i + 1;
    contexto = 'E2 pregunta ' + n;
    if (await seccionVisible(page, 's-diagnostico')) break;
    if (n === totalPrueba) {
      contadorFinal = normalizarEspacios(await page.locator('#prueba-contador').first().textContent().catch(() => ''));
      await auditarPantalla(page, 'e-05b-pregunta-' + n);
      await capturar(page, DIR_EST, 'e-05b-pregunta-' + n + '.png', 'E2 · Pregunta ' + n + ' (ultima)');
    }
    const dom = await leerPreguntaActual(page, SEL_PRUEBA);
    const pregunta = localizarPregunta(materia, dom.enunciado);
    const mapa = emparejarOpciones(pregunta, dom.opciones);
    await clicOpcionPorIndice(page, SEL_PRUEBA.opciones, mapa.findIndex((m) => !!m.datos.correcta), 'E2 pregunta ' + n);
    await avanzarPregunta(page, {
      enunciado: SEL_PRUEBA.enunciado,
      boton: SEL_PRUEBA.boton,
      destino: SEL_PRUEBA.destino,
      etiqueta: 'E2 pregunta ' + n,
    });
  }
  if (totalPrueba > COMBO_CAPTURA.length) {
    const esperadoContador = 'Pregunta ' + totalPrueba + ' de ' + totalPrueba;
    registrar(
      'E2 · la prueba recorre las ' + totalPrueba + ' preguntas configuradas',
      contadorFinal === esperadoContador,
      contadorFinal === esperadoContador ? '' : 'contador en la ultima pregunta: "' + contadorFinal + '", se esperaba "' + esperadoContador + '"'
    );
  }

  contexto = 'E3 diagnostico';
  await esperarPantalla(page, 's-diagnostico', 'E3');
  await auditarPantalla(page, 'e-06-diagnostico');
  await capturar(page, DIR_EST, 'e-06-diagnostico.png', 'E3 · Diagnostico');

  contexto = 'E4 monitores';
  await clic(page, '#s-diagnostico [data-ir="monitores"]', 'boton Ver monitores (E3)');
  await esperarPantalla(page, 's-monitores', 'E4');
  await auditarPantalla(page, 'e-07-monitores');
  await capturar(page, DIR_EST, 'e-07-monitores.png', 'E4 · Monitores');

  contexto = 'E5 perfil';
  await clic(page, '#lista-monitores [data-ir="perfil"], #s-monitores [data-ir="perfil"]', 'tarjeta de monitor (E4)');
  await esperarPantalla(page, 's-perfil', 'E5');
  await auditarPantalla(page, 'e-08-perfil');
  await capturar(page, DIR_EST, 'e-08-perfil.png', 'E5 · Perfil y agendar');

  // Con diagnostico hecho, la tarjeta destacada SI puede prometer el brief.
  const textoPerfilConDiag = normalizarEspacios(await page.locator('#s-perfil').first().innerText());
  registrar(
    'E5 · con diagnostico, promete el brief al monitor',
    contieneTexto(textoPerfilConDiag, PROMESA_DIAGNOSTICO),
    contieneTexto(textoPerfilConDiag, PROMESA_DIAGNOSTICO)
      ? ''
      : 'no aparece la promesa "' + PROMESA_DIAGNOSTICO + '" aunque el estudiante ya hizo la prueba'
  );

  contexto = 'E6 confirmacion';
  const hayHorario = await page.locator('#s-perfil .slot').count().catch(() => 0);
  if (hayHorario) await page.locator('#s-perfil .slot').first().click().catch(() => {});
  await clic(page, '#s-perfil [data-ir="confirmacion"]', 'boton Agendar y pagar (E5)');
  await esperarPantalla(page, 's-confirmacion', 'E6');
  await auditarPantalla(page, 'e-09-confirmacion');
  await capturar(page, DIR_EST, 'e-09-confirmacion.png', 'E6 · Confirmacion');

  contexto = 'E6 captura de correo';
  await enviarCorreo(page, '#s-confirmacion form.captura', 'juan.demo@uniandes.edu.co');
  await capturar(page, DIR_EST, 'e-10-confirmacion-gracias.png', 'E6 · Agradecimiento');
  await auditarPantalla(page, 'e-10-confirmacion-gracias');

  // ---------------- Canal profesor ----------------
  contexto = 'P1 profesor';
  await preparar(page, base, {});
  const hayEnlaceProfesor = await page.locator('#s-inicio [data-ir="profesor"]').count();
  if (hayEnlaceProfesor) {
    await clic(page, '#s-inicio [data-ir="profesor"]', 'enlace Soy profesor (E1)');
  } else {
    await page.goto(base + '#profesor', { waitUntil: 'domcontentloaded' });
  }
  registrar(
    'P1 · enlace "Soy profesor" en E1',
    hayEnlaceProfesor > 0,
    hayEnlaceProfesor > 0 ? '' : 'no hay [data-ir="profesor"] en #s-inicio; se llego por hash'
  );
  await esperarPantalla(page, 's-profesor', 'P1');
  await auditarPantalla(page, 'e-11-profesor');
  await capturar(page, DIR_EST, 'e-11-profesor.png', 'P1 · Profesor');

  // ---------------- Flujo del monitor ----------------
  contexto = 'M1 inicio monitor';
  await preparar(page, base, { certificacion: CFG_FIJA });
  await clic(page, '#s-inicio [data-ir="monitor"]', 'enlace Soy monitor (E1)');
  await esperarPantalla(page, 's-monitor', 'M1');
  await auditarPantalla(page, 'm-01-inicio');
  await capturar(page, DIR_MON, 'm-01-inicio.png', 'M1 · Inicio monitor');

  contexto = 'M2 materia monitor';
  await clic(page, '#s-monitor [data-ir="monitor-materia"]', 'boton de M1 hacia M2');
  await esperarPantalla(page, 's-monitor-materia', 'M2');
  await auditarPantalla(page, 'm-02-materia');
  await capturar(page, DIR_MON, 'm-02-materia.png', 'M2 · Materia');

  contexto = 'M3 certificacion';
  await elegirMateria(page, '#s-monitor-materia .materias, #s-monitor-materia ul, #s-monitor-materia', materia);
  await pasarDeM2aCertificacion(page, true);

  const longitudCert = (materia.certificacion && materia.certificacion.longitud) || 3;
  for (let i = 0; i < longitudCert; i += 1) {
    const n = i + 1;
    contexto = 'M3 pregunta ' + n;
    await auditarPantalla(page, 'm-0' + (n + 2) + '-pregunta-' + n);
    await capturar(page, DIR_MON, 'm-0' + (n + 2) + '-pregunta-' + n + '.png', 'M3 · Pregunta ' + n);
    const dom = await leerPreguntaActual(page, SEL_CERT);
    const pregunta = localizarPregunta(materia, dom.enunciado);
    const mapa = emparejarOpciones(pregunta, dom.opciones);
    await clicOpcionPorIndice(page, SEL_CERT.opciones, mapa.findIndex((m) => !!m.datos.correcta), 'M3 pregunta ' + n);
    await avanzarPregunta(page, {
      enunciado: SEL_CERT.enunciado,
      boton: SEL_CERT.boton,
      destino: SEL_CERT.destino,
      etiqueta: 'M3 pregunta ' + n,
    });
  }

  contexto = 'M4 resultado certificado';
  await esperarPantalla(page, 's-monitor-resultado', 'M4');
  await auditarPantalla(page, 'm-06-resultado-certificado');
  await capturar(page, DIR_MON, 'm-06-resultado-certificado.png', 'M4 · Resultado certificado');

  // ---------------- R1 crear perfil (capturas) ----------------
  contexto = 'R1 crear perfil';
  const irACrear = await primerSelector(page, [
    '#s-monitor-resultado [data-ir="crear-perfil"]',
    '#s-monitor-resultado [data-ir="panel"]',
  ]);
  if (!irACrear) {
    registrar('R1 · botón de M4 hacia #crear-perfil', false, 'no hay [data-ir="crear-perfil"] en #s-monitor-resultado');
  } else {
    registrar(
      'R1 · botón de M4 hacia #crear-perfil',
      irACrear.indexOf('crear-perfil') !== -1,
      irACrear.indexOf('crear-perfil') !== -1 ? '' : 'M4 salta directo a #panel; el contrato v2 pide pasar por #crear-perfil'
    );
    await clic(page, irACrear, 'boton de M4 hacia R1');
    // La navegacion por hash necesita un ciclo. Sin esta espera, la comprobacion
    // de visibilidad corre antes de que la seccion se muestre y da un falso negativo.
    await page.waitForTimeout(350);
  }

  const llegoACrear = await seccionVisible(page, 's-crear-perfil');
  if (!llegoACrear) {
    registrar('R1 · el recorrido llega a #crear-perfil', false,
      'tras pulsar el boton de M4 la pantalla #s-crear-perfil no quedo visible; las capturas de R1 se saltaron');
  }
  if (llegoACrear) {
    await auditarPantalla(page, 'm-10-crear-perfil-vacio');
    await capturar(page, DIR_MON, 'm-10-crear-perfil-vacio.png', 'R1 · Crear perfil (vacio)');

    // Un envio invalido para retratar el mensaje de error.
    try {
      const campos = await camposCrearPerfil(page);
      await rellenarPerfil(page, campos, { nombre: '', semestre: '0', tarifa: '5000', subtemas: 0 });
      await page.locator(campos.enviar).first().click();
      await page.waitForTimeout(350);
      await auditarPantalla(page, 'm-11-crear-perfil-errores');
      await capturar(page, DIR_MON, 'm-11-crear-perfil-errores.png', 'R1 · Crear perfil (con errores)');

      await rellenarPerfil(page, campos, {
        nombre: PERFIL_NUEVO.nombre, semestre: PERFIL_NUEVO.semestre, tarifa: PERFIL_NUEVO.tarifa, subtemas: 2,
      });
      await page.waitForTimeout(200);
      await auditarPantalla(page, 'm-12-crear-perfil-lleno');
      await capturar(page, DIR_MON, 'm-12-crear-perfil-lleno.png', 'R1 · Crear perfil (lleno)');

      await page.locator(campos.enviar).first().click();
      await esperarPantalla(page, 's-panel', 'M5 tras crear el perfil');
    } catch (e) {
      registrar('R1 · capturas del formulario', false, e.message);
    }
  }

  contexto = 'M5 panel';
  if (!(await seccionVisible(page, 's-panel'))) {
    // Solo se pulsa un boton si esta en la pantalla visible; si no, se navega
    // por hash. Pulsar un boton de una seccion oculta da un timeout inutil.
    const visibles = ['#s-monitor-resultado [data-ir="panel"]', '#s-crear-perfil [data-ir="panel"]'];
    let clicado = false;
    for (const sel of visibles) {
      const loc = page.locator(sel).first();
      if (await loc.isVisible().catch(() => false)) {
        await loc.click();
        clicado = true;
        break;
      }
    }
    if (!clicado) {
      await page.evaluate(() => { window.location.hash = '#panel'; });
      await page.waitForTimeout(300);
    }
  }
  await esperarPantalla(page, 's-panel', 'M5');
  await auditarPantalla(page, 'm-07-panel');
  await capturar(page, DIR_MON, 'm-07-panel.png', 'M5 · Panel del monitor');
  await capturar(page, DIR_MON, 'm-13-panel-perfil-propio.png', 'M5 · Panel con el perfil propio');

  contexto = 'M5 captura de correo';
  await enviarCorreo(page, '#s-panel form.captura', 'daniela.demo@uniandes.edu.co');
  await capturar(page, DIR_MON, 'm-08-panel-gracias.png', 'M5 · Agradecimiento');
  await auditarPantalla(page, 'm-08-panel-gracias');

  contexto = 'M4 resultado no certificado';
  await entrarACertificacion(page, base, materia, CFG_FIJA);
  await recorrer(page, SEL_CERT, materia, estrategiaPatronCanonica('FFV'));
  await esperarPantalla(page, 's-monitor-resultado', 'M4 no certificado');
  await auditarPantalla(page, 'm-09-resultado-no-certificado');
  await capturar(page, DIR_MON, 'm-09-resultado-no-certificado.png', 'M4 · Resultado no certificado');

  // ---------------- B1 buscar (capturas) ----------------
  contexto = 'B1 buscar';
  await preparar(page, base, { hash: '#buscar' });
  if (await seccionVisible(page, 's-buscar')) {
    await auditarPantalla(page, 'e-12-buscar');
    await capturar(page, DIR_EST, 'e-12-buscar.png', 'B1 · Buscar monitores (sin filtros)');
  } else {
    registrar('B1 · capturas de #buscar', false, 'la pantalla #s-buscar no se mostro al abrir #buscar en frio');
  }
}

// ---------------------------------------------------------------------------
// 13. Bloque: regresion del oraculo (orden fijo, sin barajar)
// ---------------------------------------------------------------------------

function comprobarDiagnosticoContraOraculo(materia, d, esperado) {
  const problemas = [];

  const porClave = {};
  d.barras.forEach((b) => {
    const k = claveDeBarra(materia, b);
    if (k) porClave[k] = b.pct;
  });
  const obtenido = [porClave.partes, porClave.sustitucion, porClave.impropias];
  const faltantes = ['partes', 'sustitucion', 'impropias'].filter((k) => porClave[k] === undefined);
  if (faltantes.length) {
    problemas.push('no identifico las barras de: ' + faltantes.join(', ') + ' (nombres leidos: ' + d.barras.map((b) => b.nombre).join(' / ') + ')');
  } else if (obtenido.join(',') !== esperado.pct.join(',')) {
    problemas.push('porcentajes esperados ' + esperado.pct.join('/') + ' y obtenidos ' + obtenido.join('/') + ' (partes/sustitucion/impropias)');
  }

  if (d.faltaTitulo) {
    problemas.push('falta #diag-debil-titulo');
  } else {
    const debil = claveSubtema(d.titulo);
    if (debil !== esperado.debil) {
      problemas.push('punto debil esperado "' + esperado.debil + '" y obtenido "' + (debil || '?') + '" en el texto: ' + d.titulo);
    }
  }

  const marcadas = d.barras.filter((b) => b.debil).map((b) => claveDeBarra(materia, b));
  if (marcadas.length === 1 && marcadas[0] !== esperado.debil) {
    problemas.push('la barra con .is-weak es "' + marcadas[0] + '" y deberia ser "' + esperado.debil + '"');
  }

  if (d.faltaError) {
    problemas.push('falta #diag-debil-error');
  } else if (!contieneTexto(d.error, esperado.error)) {
    problemas.push('error esperado "' + esperado.error + '" y obtenido "' + d.error + '"');
  }

  // En el caso sin fallos, el texto no lleva el prefijo "Error detectado".
  if (esperado.error === SIN_FALLOS && !d.faltaError && contieneTexto(d.error, PREFIJO_ERROR)) {
    problemas.push('el caso sin fallos no debe llevar el prefijo "' + PREFIJO_ERROR + ':" y el texto dice: ' + d.error);
  }

  return problemas;
}

async function bloqueOraculo(page, base, materia) {
  abrirBloque('Regresion del oraculo · 16 combinaciones en orden fijo');

  // Primero: con la bandera apagada el motor debe comportarse como la v1.
  contexto = 'oraculo orden fijo';
  try {
    await preparar(page, base, { prueba: CFG_FIJA, semilla: 12345 });
    await entrarAPrueba(page, materia);
    const traza = await recorrer(page, SEL_PRUEBA, materia, estrategiaPatronCanonica('VVVV'));
    const idsEsperados = materia.preguntas.slice(0, materia.prueba.longitud || 4).map((p) => p.id);
    const idsObtenidos = traza.map((t) => t.preguntaId);
    const ordenOk = idsObtenidos.join(',') === idsEsperados.join(',');
    registrar(
      'orden fijo · preguntas en el orden del banco (' + idsEsperados.join(' ') + ')',
      ordenOk,
      ordenOk ? '' : 'obtenido: ' + idsObtenidos.join(' ')
    );
    const opcionesOk = traza.every((t) => t.ordenOpciones === t.ordenOpciones.split('').sort().join(''));
    const letrasOk = traza.every((t) => !t.letra || /^[A-D]$/.test(t.letra));
    registrar(
      'orden fijo · opciones sin barajar (A,B,C,D en el orden de los datos)',
      opcionesOk && letrasOk,
      opcionesOk && letrasOk ? '' : 'firmas de orden: ' + traza.map((t) => t.preguntaId + ':' + t.ordenOpciones).join(' ')
    );
  } catch (e) {
    registrar('orden fijo · recorrido canonico', false, e.message);
  }

  const combos = Object.keys(ORACULO);
  for (const combo of combos) {
    contexto = 'combinacion ' + combo;
    const esperado = ORACULO[combo];
    try {
      await preparar(page, base, { prueba: CFG_ORACULO, semilla: 12345 });
      await entrarAPrueba(page, materia);
      const traza = await recorrer(page, SEL_PRUEBA, materia, estrategiaPatronCanonica(combo));
      await esperarPantalla(page, 's-diagnostico', 'E3 tras ' + combo);
      const d = await leerDiagnostico(page);
      const problemas = comprobarDiagnosticoContraOraculo(materia, d, esperado);
      if (traza.length !== combo.length) {
        problemas.push('se respondieron ' + traza.length + ' preguntas y el oraculo asume ' + combo.length);
      }
      registrar(
        'combinacion ' + combo,
        problemas.length === 0,
        problemas.join(' | '),
        { esperado, obtenido: { barras: d.barras, titulo: d.titulo, error: d.error }, traza }
      );
    } catch (e) {
      registrar('combinacion ' + combo, false, e.message);
    }
  }
}

// ---------------------------------------------------------------------------
// 14. Bloque: certificacion (8 combinaciones, umbral 2 de 3)
// ---------------------------------------------------------------------------

async function bloqueLogicaMonitor(page, base, materia) {
  abrirBloque('Logica de certificacion · 8 combinaciones');
  const minimo = (materia.certificacion && materia.certificacion.minimoAciertos) || 2;
  const largo = (materia.certificacion && materia.certificacion.longitud) || 3;
  const combos = ['VVV', 'VVF', 'VFV', 'FVV', 'VFF', 'FVF', 'FFV', 'FFF'];
  for (const combo of combos) {
    contexto = 'certificacion ' + combo;
    const aciertos = combo.split('').filter((c) => c === 'V').length;
    const certifica = aciertos >= minimo;
    try {
      await entrarACertificacion(page, base, materia, CFG_FIJA);
      await recorrer(page, SEL_CERT, materia, estrategiaPatronCanonica(combo));
      await esperarPantalla(page, 's-monitor-resultado', 'M4 tras ' + combo);
      const texto = normalizarEspacios(await page.locator('#cert-resultado').first().textContent());
      const problemas = [];
      if (certifica) {
        if (!contieneTexto(texto, TXT_CERTIFICADO)) {
          problemas.push('esperaba "' + TXT_CERTIFICADO + '" y el resultado dice: ' + texto.slice(0, 160));
        }
        if (contieneTexto(texto, TXT_NO_CERTIFICADO)) {
          problemas.push('aparece el texto de no certificado en un caso que si certifica');
        }
      } else {
        if (!contieneTexto(texto, TXT_NO_CERTIFICADO)) {
          problemas.push('esperaba "' + TXT_NO_CERTIFICADO + '" y el resultado dice: ' + texto.slice(0, 160));
        }
        if (contieneTexto(texto, TXT_CERTIFICADO)) {
          problemas.push('aparece "Certificado" en un caso que no alcanza el umbral');
        }
      }
      registrar(
        'certificacion ' + combo + ' (' + aciertos + '/' + largo + ', ' + (certifica ? 'certifica' : 'no certifica') + ')',
        problemas.length === 0,
        problemas.join(' | '),
        { texto: texto.slice(0, 300) }
      );
    } catch (e) {
      registrar('certificacion ' + combo, false, e.message);
    }
  }
}

// ---------------------------------------------------------------------------
// 15. Bloque: invariantes del modo adaptativo
// ---------------------------------------------------------------------------

function invariantesAdaptativo(materia, traza, d, etiqueta) {
  const problemas = [];
  const longitud = materia.prueba.longitud;
  const totalBanco = materia.preguntas.length;
  const claves = Object.keys(materia.subtemas);

  // 1. Termina en exactamente `longitud`, o antes solo si se agoto el banco.
  if (traza.length !== longitud) {
    if (!(traza.length < longitud && traza.length === totalBanco)) {
      problemas.push('respondio ' + traza.length + ' preguntas; se esperaban ' + longitud +
        ' (o menos solo si se agotara el banco de ' + totalBanco + ')');
    }
  }

  // 2. Sin repeticiones.
  const vistos = {};
  const repetidas = [];
  traza.forEach((t) => {
    if (vistos[t.preguntaId]) repetidas.push(t.preguntaId);
    vistos[t.preguntaId] = true;
  });
  if (repetidas.length) problemas.push('preguntas repetidas en la misma sesion: ' + repetidas.join(', '));

  // 3. Si longitud >= numero de subtemas, todos quedan evaluados.
  const evaluados = {};
  traza.forEach((t) => { evaluados[t.subtema] = true; });
  if (longitud >= claves.length) {
    const sinEvaluar = claves.filter((k) => !evaluados[k]);
    if (sinEvaluar.length) {
      problemas.push('con longitud ' + longitud + ' >= ' + claves.length + ' subtemas, quedaron sin evaluar: ' + sinEvaluar.join(', '));
    }
  }

  // 4. El punto debil es un subtema donde fallo, salvo que no haya fallado.
  const fallosPorSubtema = {};
  traza.forEach((t) => { if (!t.correcta) fallosPorSubtema[t.subtema] = (fallosPorSubtema[t.subtema] || 0) + 1; });
  const huboFallos = Object.keys(fallosPorSubtema).length > 0;
  // Por nombre visible de la materia, no por la lista fija de 3 subtemas del brief:
  // el recorrido adaptativo puede terminar en cualquiera de ellos.
  const debil = d.faltaTitulo ? null : claveDeBarra(materia, { nombre: d.titulo });
  if (!huboFallos) {
    if (!contieneTexto(d.error || '', SIN_FALLOS)) {
      problemas.push('no fallo ninguna y el texto deberia ser "' + SIN_FALLOS + '" pero dice: ' + (d.error || '(vacio)'));
    }
    if (contieneTexto(d.error || '', PREFIJO_ERROR)) {
      problemas.push('sin fallos no debe aparecer el prefijo "' + PREFIJO_ERROR + '"');
    }
  } else if (!debil) {
    problemas.push('no pude leer el subtema debil desde #diag-debil-titulo: "' + d.titulo + '"');
  } else if (!fallosPorSubtema[debil]) {
    problemas.push('el punto debil es "' + debil + '" pero el estudiante no fallo ninguna de ese subtema (fallos: ' +
      JSON.stringify(fallosPorSubtema) + ')');
  }

  // 5. El texto de error corresponde a una opcion realmente elegida.
  if (huboFallos && !d.faltaError && !contieneTexto(d.error || '', SIN_FALLOS)) {
    const elegidos = traza.filter((t) => !t.correcta && t.error).map((t) => t.error);
    const coincide = elegidos.some((e) => contieneTexto(d.error, e));
    if (!coincide) {
      problemas.push('el error mostrado no corresponde a ninguna opcion elegida. Mostrado: "' + d.error +
        '". Elegidos: ' + elegidos.map((e) => '"' + e + '"').join(', '));
    }
    // Y ademas debe salir del subtema debil.
    if (debil) {
      const delDebil = traza.filter((t) => !t.correcta && t.subtema === debil && t.error).map((t) => t.error);
      if (delDebil.length && !delDebil.some((e) => contieneTexto(d.error, e))) {
        problemas.push('el error mostrado no pertenece al subtema debil "' + debil + '"');
      }
    }
  }

  // 6. Ninguna barra para un subtema no evaluado.
  const barrasClaves = d.barras.map((b) => claveDeBarra(materia, b)).filter(Boolean);
  const sobrantes = barrasClaves.filter((k) => !evaluados[k]);
  if (sobrantes.length) problemas.push('hay barra para subtemas no evaluados: ' + sobrantes.join(', '));
  const faltanBarras = Object.keys(evaluados).filter((k) => barrasClaves.indexOf(k) === -1);
  if (faltanBarras.length) problemas.push('falta la barra de subtemas si evaluados: ' + faltanBarras.join(', '));

  // 7. Los porcentajes mostrados pertenecen al mapa de presentacion.
  const mapa = [34, 61, 82];
  const fuera = d.barras.filter((b) => mapa.indexOf(b.pct) === -1).map((b) => b.nombre + '=' + b.pct);
  if (fuera.length) problemas.push('porcentajes fuera del mapa 34/61/82: ' + fuera.join(', '));

  return problemas.map((p) => '[' + etiqueta + '] ' + p);
}

function firmaResultado(traza, d) {
  return JSON.stringify({
    preguntas: traza.map((t) => t.preguntaId + ':' + t.idxDatos + ':' + t.ordenOpciones),
    barras: d.barras.map((b) => b.nombre + '=' + b.pct + (b.debil ? '*' : '')),
    titulo: d.titulo,
    error: d.error,
  });
}

async function correrAdaptativo(page, base, materia, semilla, nombreEstrategia) {
  await preparar(page, base, { prueba: CFG_ADAPTATIVA, semilla });
  await entrarAPrueba(page, materia);
  const traza = await recorrer(page, SEL_PRUEBA, materia, ESTRATEGIAS[nombreEstrategia]);
  await esperarPantalla(page, 's-diagnostico', 'E3 (semilla ' + semilla + ', ' + nombreEstrategia + ')');
  const d = await leerDiagnostico(page);
  return { traza, d };
}

async function bloqueAdaptativo(page, base, materia) {
  abrirBloque('Invariantes del modo adaptativo');

  const estrategias = Object.keys(ESTRATEGIAS);
  const firmasPorEstrategia = {};
  const ordenesPorSemilla = {};

  for (const semilla of SEMILLAS) {
    for (const est of estrategias) {
      const etiqueta = 'semilla ' + semilla + ' · ' + est;
      contexto = 'adaptativo ' + etiqueta;
      try {
        const { traza, d } = await correrAdaptativo(page, base, materia, semilla, est);
        const problemas = invariantesAdaptativo(materia, traza, d, etiqueta);
        registrar(
          'adaptativo · ' + etiqueta,
          problemas.length === 0,
          problemas.join(' | '),
          { traza: traza.map((t) => ({ id: t.preguntaId, sub: t.subtema, dif: t.dificultad, ok: t.correcta, orden: t.ordenOpciones })), barras: d.barras, titulo: d.titulo, error: d.error }
        );
        firmasPorEstrategia[est] = firmasPorEstrategia[est] || {};
        firmasPorEstrategia[est][semilla] = firmaResultado(traza, d);
        ordenesPorSemilla[semilla] = ordenesPorSemilla[semilla] || {};
        traza.forEach((t) => { ordenesPorSemilla[semilla][t.preguntaId] = t.ordenOpciones; });
      } catch (e) {
        registrar('adaptativo · ' + etiqueta, false, e.message);
      }
    }
  }

  // -- determinismo: misma semilla + mismas respuestas => mismo resultado ----
  contexto = 'adaptativo determinismo';
  const semillaRepetida = SEMILLAS[0];
  for (const est of ['alterna', 'primera-mal']) {
    try {
      const primera = firmasPorEstrategia[est] && firmasPorEstrategia[est][semillaRepetida];
      const { traza, d } = await correrAdaptativo(page, base, materia, semillaRepetida, est);
      const segunda = firmaResultado(traza, d);
      const ok = !!primera && primera === segunda;
      registrar(
        'determinismo · semilla ' + semillaRepetida + ' + ' + est + ' repite el mismo resultado',
        ok,
        ok ? '' : (!primera ? 'no tengo la primera pasada para comparar' : 'la segunda pasada difiere.\n      primera: ' + primera + '\n      segunda: ' + segunda)
      );
    } catch (e) {
      registrar('determinismo · semilla ' + semillaRepetida + ' + ' + est, false, e.message);
    }
  }

  // -- el barajado de verdad baraja -----------------------------------------
  contexto = 'adaptativo barajado entre semillas';
  const preguntasComunes = {};
  Object.keys(ordenesPorSemilla).forEach((s) => {
    Object.keys(ordenesPorSemilla[s]).forEach((pid) => {
      preguntasComunes[pid] = preguntasComunes[pid] || {};
      preguntasComunes[pid][s] = ordenesPorSemilla[s][pid];
    });
  });
  let hayDiferencia = false;
  const detalle = [];
  Object.keys(preguntasComunes).forEach((pid) => {
    const valores = Object.keys(preguntasComunes[pid]).map((s) => preguntasComunes[pid][s]);
    const distintos = valores.filter((v, i) => valores.indexOf(v) === i);
    if (distintos.length > 1) hayDiferencia = true;
    detalle.push(pid + ': ' + distintos.join(' / '));
  });
  const hayDatos = Object.keys(preguntasComunes).length > 0;
  registrar(
    'barajado · semillas distintas producen ordenes de opciones distintos',
    hayDatos && hayDiferencia,
    !hayDatos
      ? 'ningun recorrido adaptativo llego a completarse, asi que no hay ordenes que comparar'
      : (hayDiferencia ? '' : 'todas las semillas pintaron las opciones en el mismo orden: ' + detalle.join(' | ')),
    preguntasComunes
  );

  // -- el orden barajado no es siempre el de los datos ----------------------
  const algunoBarajado = Object.keys(preguntasComunes).some((pid) =>
    Object.keys(preguntasComunes[pid]).some((s) => {
      const v = preguntasComunes[pid][s];
      return v !== v.split('').sort().join('');
    })
  );
  registrar(
    'barajado · al menos una pregunta salio en orden distinto al de los datos',
    hayDatos && algunoBarajado,
    !hayDatos
      ? 'ningun recorrido adaptativo llego a completarse'
      : (algunoBarajado ? '' : 'con barajarOpciones:true todas las opciones salieron en el orden original de los datos')
  );
}

// ---------------------------------------------------------------------------
// 15b. Bloque: knowledge components (sospecha, confirmacion y dinamismo)
// ---------------------------------------------------------------------------
//
// Solo aplica a materias que declaran kcs (hoy, el piloto de MATERIA_DEMO).
// Cada opcion incorrecta trae mc: la misconcepcion que delata. El motor debe:
//   - tras caer en una mc, mandar enseguida otra pregunta que la ofrezca;
//   - marcarla Confirmado si vuelve a caer, y no listarla si luego acierta;
//   - cambiar de preguntas entre semillas y repetirlas con la misma;
//   - tocar todos los subtemas aunque el estudiante falle todo.

function trampasDeDatos(pregunta) {
  return (pregunta.opciones || []).filter((o) => !o.correcta && o.mc).map((o) => o.mc);
}

// Cae en la primera trampa que vea; despues, si repetir es true, vuelve a caer
// en esa misma cada vez que la ofrezcan, y si no, acierta todo.
function estrategiaTrampa(repetir) {
  const s = { objetivo: null };
  const fn = ({ mapa }) => {
    if (!s.objetivo) {
      const i = mapa.findIndex((m) => !m.datos.correcta && m.datos.mc);
      if (i >= 0) { s.objetivo = mapa[i].datos.mc; return i; }
      return mapa.findIndex((m) => !!m.datos.correcta);
    }
    if (repetir) {
      const i = mapa.findIndex((m) => m.datos.mc === s.objetivo);
      if (i >= 0) return i;
    }
    return mapa.findIndex((m) => !!m.datos.correcta);
  };
  fn.estado = s;
  return fn;
}

async function leerDetalleKc(page) {
  return page.evaluate(() => {
    const caja = document.querySelector('#diag-kc');
    if (!caja) return { existe: false };
    return {
      existe: true,
      visible: !caja.hidden && caja.getClientRects().length > 0,
      errores: Array.prototype.map.call(document.querySelectorAll('#diag-kc-errores li[data-mc]'), (li) => ({
        mc: li.getAttribute('data-mc'),
        estado: li.getAttribute('data-estado'),
      })),
    };
  });
}

async function correrKc(page, base, materia, semilla, estrategia) {
  const opciones = { prueba: CFG_ADAPTATIVA, materia: materia.id };
  if (semilla !== null) opciones.semilla = semilla;
  await preparar(page, base, opciones);
  await entrarAPrueba(page, materia);
  const traza = await recorrer(page, SEL_PRUEBA, materia, estrategia);
  await esperarPantalla(page, 's-diagnostico', 'E3 kc');
  const detalle = await leerDetalleKc(page);
  return { traza, detalle };
}

async function bloqueKc(page, base, materia, materias) {
  abrirBloque('Knowledge components · sospecha, confirmacion y dinamismo');
  if (!materia.kcs || !Object.keys(materia.kcs).length) {
    registrar('kc · ' + materia.id + ' declara knowledge components', false, 'la materia no trae kcs; corre convertir.js con --borradores');
    return;
  }
  const porId = (id) => materia.preguntas.find((p) => p.id === id);

  // -- confirmacion y descarte ------------------------------------------------
  for (const semilla of [1, 42, 1234]) {
    for (const repetir of [true, false]) {
      const nombre = (repetir ? 'confirmacion' : 'descarte') + ' · semilla ' + semilla;
      contexto = 'kc ' + nombre;
      try {
        const est = estrategiaTrampa(repetir);
        const { traza, detalle } = await correrKc(page, base, materia, semilla, est);
        const x = est.estado.objetivo;
        const problemas = [];
        const i = traza.findIndex((t) => porId(t.preguntaId).opciones[t.idxDatos].mc === x);
        if (!x || i < 0) problemas.push('el recorrido nunca ofrecio una opcion con mc');
        else if (!traza[i + 1]) problemas.push('la prueba termino justo despues de caer en ' + x);
        else if (trampasDeDatos(porId(traza[i + 1].preguntaId)).indexOf(x) === -1) {
          problemas.push('despues de caer en "' + x + '" (' + traza[i].preguntaId + ') la siguiente pregunta (' +
            traza[i + 1].preguntaId + ') no la ofrece como trampa');
        }
        if (!detalle.visible) problemas.push('el bloque #diag-kc no esta visible en E3');
        const fila = detalle.errores.find((e) => e.mc === x);
        if (repetir && (!fila || fila.estado !== 'confirmada')) {
          problemas.push('"' + x + '" deberia salir Confirmado y sale ' + (fila ? fila.estado : 'ausente'));
        }
        if (!repetir && fila) problemas.push('"' + x + '" se descarto al acertar el sondeo y aun sale como ' + fila.estado);
        registrar('kc · ' + nombre, problemas.length === 0, problemas.join(' | '),
          { objetivo: x, recorrido: traza.map((t) => t.preguntaId + (t.correcta ? '' : '*')).join(' '), detalle });
      } catch (e) {
        registrar('kc · ' + nombre, false, e.message);
      }
    }
  }

  // -- dinamismo, determinismo y cobertura --------------------------------------
  const recorridos = {};
  for (const semilla of SEMILLAS) {
    contexto = 'kc dinamismo semilla ' + semilla;
    try {
      const { traza } = await correrKc(page, base, materia, semilla, ESTRATEGIAS['todo-bien']);
      recorridos[semilla] = traza.map((t) => t.preguntaId).join(',');
    } catch (e) {
      registrar('kc · recorrido todo-bien semilla ' + semilla, false, e.message);
    }
  }
  const distintos = new Set(Object.values(recorridos)).size;
  registrar('kc · semillas distintas dan pruebas distintas', distintos >= Math.min(3, SEMILLAS.length),
    distintos + ' recorridos distintos en ' + Object.keys(recorridos).length + ' semillas', recorridos);

  contexto = 'kc determinismo';
  try {
    const { traza } = await correrKc(page, base, materia, SEMILLAS[0], ESTRATEGIAS['todo-bien']);
    const otra = traza.map((t) => t.preguntaId).join(',');
    registrar('kc · la misma semilla repite la prueba', otra === recorridos[SEMILLAS[0]],
      otra === recorridos[SEMILLAS[0]] ? '' : 'primera: ' + recorridos[SEMILLAS[0]] + ' | segunda: ' + otra);
  } catch (e) {
    registrar('kc · la misma semilla repite la prueba', false, e.message);
  }

  const nSub = Object.keys(materia.subtemas).length;
  for (const semilla of [7, 99991]) {
    contexto = 'kc cobertura semilla ' + semilla;
    try {
      const { traza } = await correrKc(page, base, materia, semilla, ESTRATEGIAS['todo-mal']);
      const tocados = new Set(traza.map((t) => t.subtema)).size;
      registrar('kc · con todo mal toca los ' + nSub + ' subtemas (semilla ' + semilla + ')', tocados === nSub,
        tocados === nSub ? '' : 'solo toco ' + tocados + ': ' + traza.map((t) => t.subtema).join(', '));
    } catch (e) {
      registrar('kc · cobertura semilla ' + semilla, false, e.message);
    }
  }

  // -- sin semilla fijada, cada carga es distinta ------------------------------
  contexto = 'kc sin semilla';
  try {
    const a = await correrKc(page, base, materia, null, ESTRATEGIAS['todo-bien']);
    const b = await correrKc(page, base, materia, null, ESTRATEGIAS['todo-bien']);
    const ia = a.traza.map((t) => t.preguntaId).join(',');
    const ib = b.traza.map((t) => t.preguntaId).join(',');
    registrar('kc · sin fijar semilla, dos cargas dan pruebas distintas', ia !== ib, ia !== ib ? '' : 'las dos cargas dieron ' + ia);
  } catch (e) {
    registrar('kc · sin fijar semilla, dos cargas dan pruebas distintas', false, e.message);
  }

  // -- una materia sin kc no muestra el bloque ---------------------------------
  const sinKc = (materias || []).find((m) => m.activa && m.id !== materia.id && !(m.kcs && Object.keys(m.kcs).length));
  if (sinKc) {
    contexto = 'kc materia sin kc';
    try {
      const { detalle } = await correrKc(page, base, sinKc, 42, ESTRATEGIAS['todo-bien']);
      registrar('kc · ' + sinKc.id + ' (sin kc) no muestra "Lo que detectamos"', detalle.existe && !detalle.visible,
        detalle.visible ? 'el bloque se ve en una materia sin kc' : '');
    } catch (e) {
      registrar('kc · materia sin kc', false, e.message);
    }
  }
}

// ---------------------------------------------------------------------------
// 16. Bloque: barajado correcto (identificar la opcion por contenido)
// ---------------------------------------------------------------------------

async function bloqueBarajado(page, base, materia) {
  abrirBloque('Barajado correcto · la opcion se identifica por contenido');

  let huboBaraja = false;
  for (const combo of COMBOS_BARAJADO) {
    contexto = 'barajado ' + combo;
    const esperado = ORACULO[combo];
    try {
      // Orden de preguntas fijo (adaptativa:false) pero opciones barajadas.
      await preparar(page, base, { prueba: CFG_ORACULO_BARAJADA, semilla: 20260909 });
      await entrarAPrueba(page, materia);
      const traza = await recorrer(page, SEL_PRUEBA, materia, estrategiaPatronCanonica(combo));
      await esperarPantalla(page, 's-diagnostico', 'E3 tras ' + combo + ' (barajado)');
      const d = await leerDiagnostico(page);
      const problemas = comprobarDiagnosticoContraOraculo(materia, d, esperado);

      // Se considera barajado si la letra que ocupa la opcion ya no es la
      // canonica, o si el orden pintado no es el orden de los datos.
      const seBarajo = traza.some((t) => {
        if (t.letra && t.letra !== 'ABCD'[t.idxDatos]) return true;
        return t.ordenOpciones !== t.ordenOpciones.split('').sort().join('');
      });
      if (seBarajo) huboBaraja = true;

      registrar(
        'barajado ' + combo + ' da el mismo diagnostico que en orden fijo',
        problemas.length === 0,
        problemas.join(' | '),
        {
          esperado,
          letras: traza.map((t) => t.preguntaId + ' -> letra ' + (t.letra || '?') + ' = opcion de datos ' + t.idxDatos),
          obtenido: { barras: d.barras, titulo: d.titulo, error: d.error },
        }
      );
    } catch (e) {
      registrar('barajado ' + combo, false, e.message);
    }
  }

  registrar(
    'barajado · la prueba no fue vacia (alguna letra cambio de posicion)',
    huboBaraja,
    huboBaraja ? '' : 'con barajarOpciones:true ninguna opcion cambio de letra; el barajado no se aplico y la prueba no demuestra nada'
  );
}

// ---------------------------------------------------------------------------
// 17. Bloque: buscar monitores sin examen
// ---------------------------------------------------------------------------

const CLAVES_FILTRO = ['materia', 'subtema', 'precio', 'nivel'];

function selectoresFiltro(clave) {
  return [
    '#s-buscar [data-filtro="' + clave + '"]',
    '#buscar-' + clave,
    '#buscar-filtro-' + clave,
    '#s-buscar [name="' + clave + '"]',
  ];
}

async function leerListaBuscar(page) {
  const r = await page.evaluate(() => {
    const cont = document.querySelector('#buscar-lista')
      || document.querySelector('#lista-buscar')
      || document.querySelector('#s-buscar .monitores');
    if (!cont) return { error: 'falta #buscar-lista (el contenedor de resultados de #s-buscar)' };
    let nodos = Array.prototype.slice.call(cont.querySelectorAll('[data-ir="perfil"]'));
    if (!nodos.length) nodos = Array.prototype.slice.call(cont.querySelectorAll('.monitor'));
    if (!nodos.length) nodos = Array.prototype.slice.call(cont.querySelectorAll('li'));
    const visibles = nodos.filter((n) => n.getClientRects().length > 0);
    const tarjetas = visibles.map((n, i) => ({
      i,
      texto: (n.textContent || '').replace(/\s+/g, ' ').trim(),
      materia: n.getAttribute('data-materia'),
      subtemas: n.getAttribute('data-subtemas'),
      precio: n.getAttribute('data-precio'),
      nivel: n.getAttribute('data-nivel'),
    }));
    const c = document.querySelector('#buscar-conteo');
    const v = document.querySelector('#buscar-vacio');
    return {
      tarjetas,
      totalNodos: nodos.length,
      conteoTexto: c ? (c.textContent || '').replace(/\s+/g, ' ').trim() : null,
      faltaConteo: !c,
      vacioVisible: v ? v.getClientRects().length > 0 : null,
      faltaVacio: !v,
      textoLista: (cont.textContent || '').replace(/\s+/g, ' ').trim(),
    };
  });
  if (r.error) throw new Error(r.error);
  return r;
}

function conteoDeclarado(lectura) {
  if (lectura.conteoTexto == null) return null;
  const m = lectura.conteoTexto.match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

async function describirFiltro(page, clave) {
  const sel = await primerSelector(page, selectoresFiltro(clave));
  if (!sel) return null;
  const info = await page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    const tag = el.tagName.toLowerCase();
    if (tag === 'select') {
      return {
        tipo: 'select',
        opciones: Array.prototype.slice.call(el.options).map((o) => ({ valor: o.value, etiqueta: (o.textContent || '').trim() })),
        valor: el.value,
      };
    }
    if (tag === 'input' && (el.type === 'range' || el.type === 'number')) {
      return { tipo: el.type, min: el.min, max: el.max, step: el.step, valor: el.value };
    }
    // grupo de chips o radios
    const radios = Array.prototype.slice.call(el.querySelectorAll('input[type="radio"], input[type="checkbox"], button'));
    if (radios.length) {
      return {
        tipo: 'grupo',
        opciones: radios.map((r, i) => ({
          valor: r.value || String(i),
          etiqueta: ((r.closest('label') || r).textContent || '').replace(/\s+/g, ' ').trim(),
        })),
      };
    }
    return { tipo: tag };
  }, sel);
  return info ? Object.assign({ selector: sel, clave }, info) : null;
}

async function aplicarFiltro(page, filtro, opcion) {
  const loc = page.locator(filtro.selector).first();
  if (filtro.tipo === 'select') {
    await loc.selectOption(opcion.valor);
  } else if (filtro.tipo === 'range' || filtro.tipo === 'number') {
    await page.evaluate(({ s, v }) => {
      const el = document.querySelector(s);
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, { s: filtro.selector, v: String(opcion.valor) });
  } else if (filtro.tipo === 'grupo') {
    await limpiarMarca(page);
    await page.evaluate(({ s, v, attr }) => {
      const cont = document.querySelector(s);
      const nodos = Array.prototype.slice.call(cont.querySelectorAll('input[type="radio"], input[type="checkbox"], button'));
      const el = nodos.find((n, i) => (n.value || String(i)) === String(v));
      if (el) (el.closest('label') || el).setAttribute(attr, '1');
    }, { s: filtro.selector, v: opcion.valor, attr: MARCA });
    await page.locator('[' + MARCA + '="1"]').first().click().catch(() => {});
    await limpiarMarca(page);
  }
  await page.waitForTimeout(200);
}

async function limpiarFiltros(page, filtros) {
  const boton = await primerSelector(page, ['#buscar-limpiar', '#s-buscar [data-accion="limpiar"]']);
  if (boton) {
    await page.locator(boton).first().click().catch(() => {});
    await page.waitForTimeout(200);
    return;
  }
  for (const f of filtros) {
    if (!f) continue;
    if (f.tipo === 'select' && f.opciones.length) await aplicarFiltro(page, f, f.opciones[0]);
    else if (f.tipo === 'range' || f.tipo === 'number') await aplicarFiltro(page, f, { valor: f.max || f.valor });
    else if (f.tipo === 'grupo' && f.opciones.length) await aplicarFiltro(page, f, f.opciones[0]);
  }
}

function coherenciaTarjeta(clave, tarjeta, opcion) {
  // Devuelve null si no se puede evaluar, o un mensaje si es incoherente.
  const etiqueta = normalizarEspacios(opcion.etiqueta || opcion.valor || '');
  if (!etiqueta) return null;
  if (clave === 'nivel') {
    const n = etiqueta.match(/\d+/);
    if (!n) return null;
    const nivelTarjeta = tarjeta.nivel != null ? parseInt(tarjeta.nivel, 10)
      : (tarjeta.texto.match(/nivel\s*(\d)/i) ? parseInt(tarjeta.texto.match(/nivel\s*(\d)/i)[1], 10) : null);
    if (nivelTarjeta == null) return null;
    // La etiqueta del filtro es "Nivel N o mas": la comparacion es >=.
    if (nivelTarjeta < parseInt(n[0], 10)) return 'filtro nivel minimo ' + n[0] + ' deja pasar una tarjeta de nivel ' + nivelTarjeta;
    return null;
  }
  if (clave === 'precio') {
    const tope = parseInt(String(etiqueta).replace(/[^\d]/g, ''), 10);
    if (!tope || tope < 1000) return null;
    const precio = tarjeta.precio != null ? parseInt(tarjeta.precio, 10) : numeroDePesos(tarjeta.texto);
    if (precio == null) return null;
    if (precio > tope) return 'filtro precio hasta ' + tope + ' deja pasar una tarifa de ' + precio;
    return null;
  }
  if (clave === 'materia' || clave === 'subtema') {
    const attr = clave === 'materia' ? tarjeta.materia : tarjeta.subtemas;
    if (attr != null) {
      if (plano(attr).indexOf(plano(opcion.valor)) === -1 && plano(attr).indexOf(plano(etiqueta)) === -1) {
        return 'filtro ' + clave + ' "' + etiqueta + '" deja pasar una tarjeta con data-' + clave + '="' + attr + '"';
      }
      return null;
    }
    if (plano(tarjeta.texto).indexOf(plano(etiqueta)) === -1) {
      return 'filtro ' + clave + ' "' + etiqueta + '" deja pasar una tarjeta cuyo texto no lo menciona (y no expone data-' + clave + ')';
    }
    return null;
  }
  return null;
}

async function bloqueBuscar(page, base, materia) {
  abrirBloque('B1 · Buscar monitores sin examen');

  // 1. Entrada libre en frio.
  contexto = 'buscar en frio';
  try {
    await page.goto(base + '#buscar', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    const est = await estadoPantallas(page);
    const ok = est.visibles.length === 1 && est.visibles[0] === 's-buscar';
    registrar(
      'abrir #buscar en frio NO redirige (entrada libre)',
      ok,
      ok ? '' : 'visibles: [' + est.visibles.join(', ') + '] hash: "' + est.hash + '"',
      est
    );
  } catch (e) {
    registrar('abrir #buscar en frio NO redirige (entrada libre)', false, e.message);
  }

  // 2. Enlace desde E1.
  contexto = 'buscar desde E1';
  try {
    await preparar(page, base, {});
    const sel = await primerSelector(page, ['#s-inicio [data-ir="buscar"]']);
    if (!sel) {
      registrar('E1 · boton secundario hacia #buscar', false, 'no existe [data-ir="buscar"] dentro de #s-inicio');
    } else {
      await clic(page, sel, 'boton secundario de E1 hacia B1');
      await esperarPantalla(page, 's-buscar', 'B1 desde E1');
      registrar('E1 · boton secundario hacia #buscar', true, '');
    }
  } catch (e) {
    registrar('E1 · boton secundario hacia #buscar', false, e.message);
  }

  // 3. Lista completa y conteo.
  contexto = 'buscar lista';
  let filtros = [];
  let totalInicial = 0;
  let textosIniciales = [];
  try {
    await page.goto(base + '#buscar', { waitUntil: 'domcontentloaded' });
    await esperarPantalla(page, 's-buscar', 'B1');
    const l = await leerListaBuscar(page);
    totalInicial = l.tarjetas.length;
    textosIniciales = l.tarjetas.map((t) => t.texto);
    registrar(
      'B1 · la lista muestra los 3 monitores de ejemplo',
      totalInicial >= 3,
      totalInicial >= 3 ? 'visibles: ' + totalInicial : 'solo hay ' + totalInicial + ' tarjeta(s) visibles en #buscar-lista'
    );
    const c = conteoDeclarado(l);
    registrar(
      'B1 · #buscar-conteo refleja el numero visible',
      !l.faltaConteo && c === totalInicial,
      l.faltaConteo ? 'falta el elemento #buscar-conteo' : (c === totalInicial ? l.conteoTexto : '#buscar-conteo dice "' + l.conteoTexto + '" y hay ' + totalInicial + ' tarjetas')
    );
    registrar(
      'B1 · sin filtros, #buscar-vacio esta oculto',
      l.faltaVacio ? false : l.vacioVisible === false,
      l.faltaVacio ? 'falta el elemento #buscar-vacio' : (l.vacioVisible === false ? '' : '#buscar-vacio se ve con ' + totalInicial + ' resultados')
    );
  } catch (e) {
    registrar('B1 · lectura de la lista', false, e.message);
  }

  // 3.b Los cuatro controles de filtro existen (se comprueba aparte para que
  //     un fallo de la lista no oculte cual filtro falta).
  contexto = 'buscar filtros presentes';
  for (const clave of CLAVES_FILTRO) {
    try {
      const f = await describirFiltro(page, clave);
      if (!f) {
        registrar(
          'B1 · existe el filtro de ' + clave,
          false,
          'no encuentro ninguno de: ' + selectoresFiltro(clave).join('  |  ')
        );
      } else {
        registrar('B1 · existe el filtro de ' + clave, true, f.selector + ' (' + f.tipo + ')');
        filtros.push(f);
      }
    } catch (e) {
      registrar('B1 · existe el filtro de ' + clave, false, e.message);
    }
  }

  // 4. Cada filtro reduce de forma coherente.
  if (filtros.length && totalInicial === 0) {
    registrar(
      'B1 · los filtros reducen la lista de forma coherente',
      false,
      'no se evaluaron: la lista sin filtros ya venia vacia, no hay nada que reducir'
    );
  }
  for (const f of (totalInicial === 0 ? [] : filtros)) {
    contexto = 'buscar filtro ' + f.clave;
    try {
      await page.goto(base + '#buscar', { waitUntil: 'domcontentloaded' });
      await esperarPantalla(page, 's-buscar', 'B1 filtro ' + f.clave);
      const problemas = [];
      let redujoAlguna = false;
      let opciones = [];
      if (f.tipo === 'select' || f.tipo === 'grupo') opciones = f.opciones.slice(1, 5);
      else if (f.tipo === 'range' || f.tipo === 'number') {
        const min = f.min !== '' && f.min != null ? f.min : '0';
        opciones = [{ valor: min, etiqueta: String(min) }];
      }
      if (!opciones.length) {
        problemas.push('el control no ofrece ninguna opcion aparte de la de por defecto');
      }
      for (const op of opciones) {
        await limpiarFiltros(page, filtros);
        await aplicarFiltro(page, f, op);
        const l = await leerListaBuscar(page);
        const c = conteoDeclarado(l);
        const etiqueta = normalizarEspacios(op.etiqueta || op.valor);
        if (l.tarjetas.length > totalInicial) {
          problemas.push('"' + etiqueta + '" muestra ' + l.tarjetas.length + ' tarjetas, mas que las ' + totalInicial + ' sin filtrar');
        }
        if (l.tarjetas.length < totalInicial) redujoAlguna = true;
        const fuera = l.tarjetas.filter((t) => textosIniciales.indexOf(t.texto) === -1);
        if (fuera.length) {
          problemas.push('"' + etiqueta + '" muestra tarjetas que no estaban en la lista completa');
        }
        if (c !== null && c !== l.tarjetas.length) {
          problemas.push('"' + etiqueta + '": #buscar-conteo dice ' + c + ' y hay ' + l.tarjetas.length + ' tarjetas');
        }
        l.tarjetas.forEach((t) => {
          const msg = coherenciaTarjeta(f.clave, t, op);
          if (msg) problemas.push(msg);
        });
        if (l.tarjetas.length === 0 && l.vacioVisible === false) {
          problemas.push('"' + etiqueta + '" deja la lista en cero sin mostrar #buscar-vacio');
        }
      }
      if (!redujoAlguna) {
        problemas.push('ninguna opcion de este filtro cambio el numero de resultados: el filtro no filtra');
      }
      registrar(
        'B1 · el filtro de ' + f.clave + ' reduce la lista de forma coherente',
        problemas.length === 0,
        problemas.slice(0, 4).join(' | ')
      );
    } catch (e) {
      registrar('B1 · el filtro de ' + f.clave + ' reduce la lista de forma coherente', false, e.message);
    }
  }

  // 5. Captura con filtros aplicados.
  contexto = 'buscar captura filtrada';
  try {
    await page.goto(base + '#buscar', { waitUntil: 'domcontentloaded' });
    await esperarPantalla(page, 's-buscar', 'B1 filtrado');
    const f = filtros.find((x) => x.clave === 'subtema') || filtros[0];
    if (f) {
      const op = (f.opciones && f.opciones[1]) || { valor: f.min || '0', etiqueta: 'min' };
      await aplicarFiltro(page, f, op);
    }
    await auditarPantalla(page, 'e-13-buscar-filtrado');
    await capturar(page, DIR_EST, 'e-13-buscar-filtrado.png', 'B1 · Buscar con filtros aplicados');
  } catch (e) {
    registrar('B1 · captura con filtros', false, e.message);
  }

  // 6. Estado vacio.
  contexto = 'buscar estado vacio';
  try {
    await page.goto(base + '#buscar', { waitUntil: 'domcontentloaded' });
    await esperarPantalla(page, 's-buscar', 'B1 vacio');
    let logrado = null;
    const conOpciones = filtros.filter((f) => (f.opciones && f.opciones.length > 1) || f.tipo === 'range' || f.tipo === 'number');
    // Busca una combinacion sin resultados: primero el precio mas restrictivo,
    // luego cruzando pares de opciones.
    const candidatos = [];
    conOpciones.forEach((f) => {
      if (f.tipo === 'range' || f.tipo === 'number') candidatos.push([{ f, op: { valor: f.min || '0', etiqueta: String(f.min || 0) } }]);
      else f.opciones.slice(1).forEach((op) => candidatos.push([{ f, op }]));
    });
    for (let i = 0; i < conOpciones.length && candidatos.length < 60; i += 1) {
      for (let j = i + 1; j < conOpciones.length; j += 1) {
        const a = conOpciones[i];
        const b = conOpciones[j];
        const opsA = a.opciones ? a.opciones.slice(1) : [{ valor: a.min || '0', etiqueta: String(a.min || 0) }];
        const opsB = b.opciones ? b.opciones.slice(1) : [{ valor: b.min || '0', etiqueta: String(b.min || 0) }];
        opsA.forEach((oa) => opsB.forEach((ob) => candidatos.push([{ f: a, op: oa }, { f: b, op: ob }])));
      }
    }
    // Tope duro: cada intento toca el DOM, no vale la pena barrer 200 combinaciones.
    for (const combo of candidatos.slice(0, 40)) {
      await limpiarFiltros(page, filtros);
      for (const paso of combo) await aplicarFiltro(page, paso.f, paso.op);
      const l = await leerListaBuscar(page);
      if (l.tarjetas.length === 0) {
        logrado = { combo: combo.map((p) => p.f.clave + '=' + normalizarEspacios(p.op.etiqueta || p.op.valor)), lectura: l };
        break;
      }
    }
    if (!logrado) {
      registrar(
        'B1 · una combinacion sin resultados muestra #buscar-vacio',
        false,
        'no encontre ninguna combinacion de filtros que deje la lista en cero; el estado vacio no es alcanzable'
      );
    } else {
      const l = logrado.lectura;
      const problemas = [];
      if (l.faltaVacio) problemas.push('falta el elemento #buscar-vacio');
      else if (l.vacioVisible !== true) problemas.push('#buscar-vacio no se ve con cero resultados');
      const c = conteoDeclarado(l);
      if (c !== null && c !== 0) problemas.push('#buscar-conteo dice "' + l.conteoTexto + '" con cero tarjetas');
      registrar(
        'B1 · una combinacion sin resultados muestra #buscar-vacio',
        problemas.length === 0,
        problemas.join(' | ') || ('con ' + logrado.combo.join(' + ')),
        logrado.combo
      );
      await auditarPantalla(page, 'e-14-buscar-vacio');
      await capturar(page, DIR_EST, 'e-14-buscar-vacio.png', 'B1 · Buscar sin resultados');
    }
  } catch (e) {
    registrar('B1 · una combinacion sin resultados muestra #buscar-vacio', false, e.message);
  }

  // 7. Agendar desde #buscar sin haber hecho la prueba.
  contexto = 'buscar agendar sin prueba';
  try {
    await page.goto(base + '#buscar', { waitUntil: 'domcontentloaded' });
    await esperarPantalla(page, 's-buscar', 'B1 hacia perfil');
    // La prueba del estado vacio dejo filtros que no devuelven a nadie.
    // Se limpian antes de intentar entrar a un perfil desde la busqueda.
    await page.evaluate(() => {
      ['#filtro-materia', '#filtro-subtema', '#filtro-precio', '#filtro-nivel'].forEach((s) => {
        const el = document.querySelector(s);
        if (el) { el.value = ''; el.dispatchEvent(new Event('change', { bubbles: true })); }
      });
    });
    await page.waitForTimeout(200);
    await clic(page, '#buscar-lista [data-ir="perfil"], #s-buscar [data-ir="perfil"]', 'tarjeta de monitor en B1');
    await esperarPantalla(page, 's-perfil', 'E5 desde B1');
    const texto = normalizarEspacios(await page.locator('#s-perfil').first().innerText());
    const prometeDiagnostico = contieneTexto(texto, PROMESA_DIAGNOSTICO);
    registrar(
      'E5 sin prueba · no promete un diagnostico que no existe',
      !prometeDiagnostico,
      prometeDiagnostico
        ? 'la tarjeta destacada dice "' + PROMESA_DIAGNOSTICO + '" aunque el estudiante no hizo la prueba'
        : ''
    );
    await auditarPantalla(page, 'e-15-perfil-sin-diagnostico');
    await capturar(page, DIR_EST, 'e-15-perfil-sin-diagnostico.png', 'E5 · Perfil sin diagnostico previo');

    const hayHorario = await page.locator('#s-perfil .slot').count().catch(() => 0);
    if (hayHorario) await page.locator('#s-perfil .slot').first().click().catch(() => {});
    await clic(page, '#s-perfil [data-ir="confirmacion"]', 'boton Agendar y pagar sin prueba');
    await esperarPantalla(page, 's-confirmacion', 'E6 sin prueba');
    registrar('B1 · se puede agendar sin haber hecho la prueba', true, '');
  } catch (e) {
    registrar('B1 · se puede agendar sin haber hecho la prueba', false, e.message);
  }
}

// ---------------------------------------------------------------------------
// 18. Bloque: crear el perfil del monitor
// ---------------------------------------------------------------------------

async function camposCrearPerfil(page) {
  const nombre = await exigirSelector(page, [
    '#s-crear-perfil [name="nombre"]', '#cp-nombre', '#crear-nombre', '#s-crear-perfil input[type="text"]',
  ], 'el campo de nombre de #s-crear-perfil');
  const semestre = await exigirSelector(page, [
    '#s-crear-perfil [name="semestre"]', '#cp-semestre', '#crear-semestre',
  ], 'el campo de semestre de #s-crear-perfil');
  const tarifa = await exigirSelector(page, [
    '#s-crear-perfil [name="tarifa"]', '#cp-tarifa', '#crear-tarifa',
  ], 'el campo de tarifa de #s-crear-perfil');
  const subtemas = await exigirSelector(page, [
    '#s-crear-perfil [name="subtemas"]', '#s-crear-perfil [name="subtema"]', '#s-crear-perfil input[type="checkbox"]',
  ], 'las casillas de subtemas de #s-crear-perfil');
  const enviar = await exigirSelector(page, [
    '#s-crear-perfil button[type="submit"]', '#perfil-guardar', '#s-crear-perfil form button', '#s-crear-perfil [data-ir="panel"]',
  ], 'el boton de guardar de #s-crear-perfil');
  const error = await primerSelector(page, [
    '#crear-perfil-error', '#cp-error', '#s-crear-perfil [role="alert"]', '#s-crear-perfil .error',
  ]);
  return { nombre, semestre, tarifa, subtemas, enviar, error };
}

async function rellenarPerfil(page, campos, datos) {
  await page.locator(campos.nombre).first().fill(String(datos.nombre));
  await page.locator(campos.semestre).first().fill(String(datos.semestre));
  await page.locator(campos.tarifa).first().fill(String(datos.tarifa));
  const casillas = page.locator(campos.subtemas);
  const n = await casillas.count();
  for (let i = 0; i < n; i += 1) {
    const c = casillas.nth(i);
    const debe = i < datos.subtemas;
    const esta = await c.isChecked().catch(() => false);
    if (debe === esta) continue;
    // El input va oculto detras de su etiqueta, igual que en .opt y .slot del
    // resto de la app. Se pulsa la etiqueta, que es lo que hace una persona.
    const etiqueta = c.locator('xpath=ancestor::label[1]');
    if (await etiqueta.count()) await etiqueta.first().click();
    else await c.setChecked(debe, { force: true });
  }
  await page.waitForTimeout(120);
  // Sin este control, un fallo al marcar se tragaba en silencio y reaparecia
  // mucho despues como "el formulario no navega".
  let marcadas = 0;
  for (let i = 0; i < n; i += 1) {
    if (await casillas.nth(i).isChecked().catch(() => false)) marcadas += 1;
  }
  if (marcadas !== datos.subtemas) {
    registrar('R1 · marcar subtemas en el formulario', false,
      'se pidieron ' + datos.subtemas + ' subtemas y quedaron ' + marcadas + ' marcados');
  }
}

async function mensajeDeError(page, campos) {
  if (campos.error) {
    const vis = await page.locator(campos.error).first().isVisible().catch(() => false);
    if (vis) {
      const t = normalizarEspacios(await page.locator(campos.error).first().textContent());
      if (t) return t;
    }
  }
  // Fallback: validacion nativa del navegador.
  const nativo = await page.evaluate((sel) => {
    const el = document.querySelector(sel.nombre);
    const form = el && el.closest('form');
    if (!form) return null;
    const invalidos = Array.prototype.slice.call(form.querySelectorAll(':invalid'));
    if (!invalidos.length) return null;
    return invalidos.map((i) => i.validationMessage).filter(Boolean).join(' / ') || 'campo invalido';
  }, campos).catch(() => null);
  return nativo;
}

async function llegarACrearPerfil(page, base, materia) {
  await entrarACertificacion(page, base, materia, CFG_FIJA);
  const largo = (materia.certificacion && materia.certificacion.longitud) || 3;
  await recorrer(page, SEL_CERT, materia, estrategiaPatronCanonica('V'.repeat(largo)));
  await esperarPantalla(page, 's-monitor-resultado', 'M4 certificado');
  const sel = await primerSelector(page, ['#s-monitor-resultado [data-ir="crear-perfil"]']);
  if (!sel) {
    throw new Error('No hay [data-ir="crear-perfil"] en #s-monitor-resultado; tras certificar el contrato v2 exige pasar por R1.');
  }
  await clic(page, sel, 'boton de M4 hacia R1');
  await esperarPantalla(page, 's-crear-perfil', 'R1');
}

async function bloquePerfilMonitor(page, base, materia) {
  abrirBloque('R1 · Crear el perfil del monitor');

  // 1. Guarda en frio.
  contexto = 'crear-perfil en frio';
  try {
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.goto(base + '#crear-perfil', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    const est = await estadoPantallas(page);
    const ok = est.visibles.length === 1 && est.visibles[0] === 's-monitor' && (est.hash === '' || est.hash === '#monitor');
    registrar(
      'abrir #crear-perfil sin certificado redirige a #monitor',
      ok,
      ok ? '' : 'visibles: [' + est.visibles.join(', ') + '] hash: "' + est.hash + '"',
      est
    );
  } catch (e) {
    registrar('abrir #crear-perfil sin certificado redirige a #monitor', false, e.message);
  }

  // 2. Tras certificar se llega a R1.
  contexto = 'crear-perfil tras certificar';
  let campos = null;
  try {
    await llegarACrearPerfil(page, base, materia);
    registrar('tras certificar se llega a #crear-perfil', true, '');
    campos = await camposCrearPerfil(page);
  } catch (e) {
    registrar('tras certificar se llega a #crear-perfil', false, e.message);
    return;
  }

  // 3. Rechazos del formulario.
  const casos = [
    { nombre: 'nombre vacio', datos: { nombre: '', semestre: '7', tarifa: '30000', subtemas: 2 } },
    { nombre: 'semestre 0', datos: { nombre: 'Ana P.', semestre: '0', tarifa: '30000', subtemas: 2 } },
    { nombre: 'semestre 13', datos: { nombre: 'Ana P.', semestre: '13', tarifa: '30000', subtemas: 2 } },
    { nombre: 'tarifa 5000', datos: { nombre: 'Ana P.', semestre: '7', tarifa: '5000', subtemas: 2 } },
    { nombre: 'tarifa 500000', datos: { nombre: 'Ana P.', semestre: '7', tarifa: '500000', subtemas: 2 } },
    { nombre: 'cero subtemas', datos: { nombre: 'Ana P.', semestre: '7', tarifa: '30000', subtemas: 0 } },
  ];

  for (const caso of casos) {
    contexto = 'crear-perfil rechazo ' + caso.nombre;
    try {
      if (!(await seccionVisible(page, 's-crear-perfil'))) await llegarACrearPerfil(page, base, materia);
      await rellenarPerfil(page, campos, caso.datos);
      await page.locator(campos.enviar).first().click();
      await page.waitForTimeout(400);
      const sigueAqui = await seccionVisible(page, 's-crear-perfil');
      const msg = await mensajeDeError(page, campos);
      const problemas = [];
      if (!sigueAqui) {
        const est = await estadoPantallas(page);
        problemas.push('avanzo a [' + est.visibles.join(', ') + '] con datos invalidos');
      }
      if (!msg) problemas.push('no aparecio ningun mensaje de error visible' + (campos.error ? ' en ' + campos.error : ' (y no hay #crear-perfil-error)'));
      registrar(
        'rechaza ' + caso.nombre,
        problemas.length === 0,
        problemas.join(' | ') || ('mensaje: ' + String(msg).slice(0, 90))
      );
    } catch (e) {
      registrar('rechaza ' + caso.nombre, false, e.message);
    }
  }

  // 4. Datos validos: guarda, navega a #panel, el panel muestra nombre y tarifa.
  contexto = 'crear-perfil valido';
  try {
    if (!(await seccionVisible(page, 's-crear-perfil'))) await llegarACrearPerfil(page, base, materia);
    await rellenarPerfil(page, campos, {
      nombre: PERFIL_NUEVO.nombre, semestre: PERFIL_NUEVO.semestre, tarifa: PERFIL_NUEVO.tarifa, subtemas: 2,
    });
    await page.locator(campos.enviar).first().click();
    await esperarPantalla(page, 's-panel', 'M5 tras guardar el perfil');
    const est = await estadoPantallas(page);
    registrar(
      'con datos validos guarda y navega a #panel',
      est.hash === '#panel' || est.visibles[0] === 's-panel',
      est.hash === '#panel' || est.visibles[0] === 's-panel' ? '' : 'hash "' + est.hash + '" visibles [' + est.visibles.join(', ') + ']'
    );
    const panel = normalizarEspacios(await page.locator('#s-panel').first().innerText());
    const tieneNombre = contieneTexto(panel, PERFIL_NUEVO.nombre);
    const tieneTarifa = contieneTexto(panel, PERFIL_TARIFA_TEXTO) || panel.indexOf('30.000') !== -1;
    registrar(
      'el panel muestra el nombre escrito',
      tieneNombre,
      tieneNombre ? '' : 'no aparece "' + PERFIL_NUEVO.nombre + '" en #s-panel'
    );
    registrar(
      'el panel muestra la tarifa escrita',
      tieneTarifa,
      tieneTarifa ? '' : 'no aparece "' + PERFIL_TARIFA_TEXTO + '" en #s-panel'
    );
  } catch (e) {
    registrar('con datos validos guarda y navega a #panel', false, e.message);
    return;
  }

  // 5. El monitor creado aparece en #buscar y en #monitores (sin recargar).
  contexto = 'crear-perfil aparece en buscar';
  try {
    await irPorHash(page, '#buscar');
    await esperarPantalla(page, 's-buscar', 'B1 tras crear el perfil');
    const l = await leerListaBuscar(page);
    const esta = contieneTexto(l.textoLista, PERFIL_NUEVO.nombre);
    registrar(
      'el monitor creado aparece en #buscar',
      esta,
      esta ? '' : 'no aparece "' + PERFIL_NUEVO.nombre + '" entre las ' + l.tarjetas.length + ' tarjetas de #buscar-lista'
    );
  } catch (e) {
    registrar('el monitor creado aparece en #buscar', false, e.message);
  }

  contexto = 'crear-perfil aparece en monitores';
  try {
    await irPorHash(page, '#inicio');
    await esperarPantalla(page, 's-inicio', 'E1 tras crear el perfil');
    await forzarConfig(page, MATERIA_DEMO, CFG_FIJA, null);
    await entrarAPrueba(page, materia);
    await recorrer(page, SEL_PRUEBA, materia, estrategiaPatronCanonica(COMBO_CAPTURA));
    await esperarPantalla(page, 's-diagnostico', 'E3 tras crear el perfil');
    await clic(page, '#s-diagnostico [data-ir="monitores"]', 'boton Ver monitores');
    await esperarPantalla(page, 's-monitores', 'E4 tras crear el perfil');
    const texto = normalizarEspacios(await page.locator('#lista-monitores').first().innerText());
    const esta = contieneTexto(texto, PERFIL_NUEVO.nombre);
    registrar(
      'el monitor creado aparece en #monitores',
      esta,
      esta ? '' : 'no aparece "' + PERFIL_NUEVO.nombre + '" en #lista-monitores'
    );
  } catch (e) {
    registrar('el monitor creado aparece en #monitores', false, e.message);
  }

  // 6. El reinicio lo borra de las dos listas.
  contexto = 'crear-perfil reinicio';
  try {
    await clic(page, '#btn-reiniciar', 'boton de reinicio global');
    await page.waitForTimeout(300);
    await irPorHash(page, '#buscar');
    await esperarPantalla(page, 's-buscar', 'B1 tras reiniciar');
    const l = await leerListaBuscar(page);
    const sigue = contieneTexto(l.textoLista, PERFIL_NUEVO.nombre);
    registrar(
      'el reinicio borra el monitor creado de #buscar',
      !sigue,
      sigue ? 'sigue apareciendo "' + PERFIL_NUEVO.nombre + '" tras pulsar #btn-reiniciar' : ''
    );

    await irPorHash(page, '#inicio');
    await esperarPantalla(page, 's-inicio', 'E1 tras reiniciar');
    await forzarConfig(page, MATERIA_DEMO, CFG_FIJA, null);
    await entrarAPrueba(page, materia);
    await recorrer(page, SEL_PRUEBA, materia, estrategiaPatronCanonica(COMBO_CAPTURA));
    await esperarPantalla(page, 's-diagnostico', 'E3 tras reiniciar');
    await clic(page, '#s-diagnostico [data-ir="monitores"]', 'boton Ver monitores');
    await esperarPantalla(page, 's-monitores', 'E4 tras reiniciar');
    const texto = normalizarEspacios(await page.locator('#lista-monitores').first().innerText());
    const sigue2 = contieneTexto(texto, PERFIL_NUEVO.nombre);
    registrar(
      'el reinicio borra el monitor creado de #monitores',
      !sigue2,
      sigue2 ? 'sigue apareciendo "' + PERFIL_NUEVO.nombre + '" en #lista-monitores tras reiniciar' : ''
    );
  } catch (e) {
    registrar('el reinicio borra el monitor creado', false, e.message);
  }
}

// ---------------------------------------------------------------------------
// 19. Bloque: robustez
// ---------------------------------------------------------------------------

async function bloqueRobustez(page, base, red, materia) {
  abrirBloque('Robustez');

  // 1. #diagnostico sin estado
  contexto = 'robustez #diagnostico directo';
  try {
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.goto(base + '#diagnostico', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    const est = await estadoPantallas(page);
    const ok = est.visibles.length === 1 && est.visibles[0] === 's-inicio' && (est.hash === '' || est.hash === '#inicio');
    registrar(
      'abrir #diagnostico sin estado redirige a #inicio',
      ok,
      ok ? '' : 'visibles: [' + est.visibles.join(', ') + '] hash: "' + est.hash + '"',
      est
    );
  } catch (e) {
    registrar('abrir #diagnostico sin estado redirige a #inicio', false, e.message);
  }

  // 2. #panel sin estado
  contexto = 'robustez #panel directo';
  try {
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.goto(base + '#panel', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    const est = await estadoPantallas(page);
    const ok = est.visibles.length === 1 && est.visibles[0] === 's-monitor' && (est.hash === '' || est.hash === '#monitor');
    registrar(
      'abrir #panel sin estado redirige a #monitor',
      ok,
      ok ? '' : 'visibles: [' + est.visibles.join(', ') + '] hash: "' + est.hash + '"',
      est
    );
  } catch (e) {
    registrar('abrir #panel sin estado redirige a #monitor', false, e.message);
  }

  // 3. Reinicio deja el estado limpio
  contexto = 'robustez reinicio';
  try {
    await preparar(page, base, { prueba: CFG_FIJA });
    await entrarAPrueba(page, materia);
    await recorrer(page, SEL_PRUEBA, materia, estrategiaPatronCanonica('VVVV'));
    await esperarPantalla(page, 's-diagnostico', 'E3 antes de reiniciar');
    await clic(page, '#btn-reiniciar', 'boton de reinicio global');
    await page.waitForTimeout(300);
    const tras = await estadoPantallas(page);
    const volvioAInicio = tras.visibles.length === 1 && tras.visibles[0] === 's-inicio';
    registrar(
      'el boton de reinicio vuelve a #inicio',
      volvioAInicio,
      volvioAInicio ? '' : 'visibles: [' + tras.visibles.join(', ') + ']',
      tras
    );

    await irPorHash(page, '#diagnostico');
    const est = await estadoPantallas(page);
    const limpio = est.visibles.length === 1 && est.visibles[0] === 's-inicio';
    registrar(
      'tras reiniciar, #diagnostico vuelve a redirigir',
      limpio,
      limpio ? '' : 'visibles: [' + est.visibles.join(', ') + '] hash: "' + est.hash + '" (el estado no quedo limpio)',
      est
    );

    await irPorHash(page, '#buscar');
    const estB = await estadoPantallas(page);
    const buscarSigueLibre = estB.visibles.length === 1 && estB.visibles[0] === 's-buscar';
    registrar(
      'tras reiniciar, #buscar sigue siendo entrada libre',
      buscarSigueLibre,
      buscarSigueLibre ? '' : 'visibles: [' + estB.visibles.join(', ') + '] hash: "' + estB.hash + '"',
      estB
    );
  } catch (e) {
    registrar('el boton de reinicio deja el estado limpio', false, e.message);
  }

  // 4. Boton atras a mitad de la prueba
  contexto = 'robustez boton atras';
  try {
    await preparar(page, base, { prueba: CFG_FIJA });
    await entrarAPrueba(page, materia);
    const dom = await leerPreguntaActual(page, SEL_PRUEBA);
    const pregunta = localizarPregunta(materia, dom.enunciado);
    const mapa = emparejarOpciones(pregunta, dom.opciones);
    await clicOpcionPorIndice(page, SEL_PRUEBA.opciones, mapa.findIndex((m) => !!m.datos.correcta), 'E2 pregunta 1 (atras)');
    await avanzarPregunta(page, {
      enunciado: SEL_PRUEBA.enunciado,
      boton: SEL_PRUEBA.boton,
      destino: SEL_PRUEBA.destino,
      etiqueta: 'E2 pregunta 1 (atras)',
    });
    const erroresAntes = reporte.consola.length;
    await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForTimeout(400);
    const est = await estadoPantallas(page);
    const problemas = [];
    if (est.visibles.length !== 1) problemas.push('secciones visibles: [' + est.visibles.join(', ') + ']');
    if (!est.textoVisible) problemas.push('la pantalla quedo en blanco');
    if (reporte.consola.length > erroresAntes) problemas.push('genero ' + (reporte.consola.length - erroresAntes) + ' error(es) de consola');
    registrar(
      'el boton atras a mitad de la prueba no rompe la pantalla',
      problemas.length === 0,
      problemas.join(' | '),
      est
    );
  } catch (e) {
    registrar('el boton atras a mitad de la prueba no rompe la pantalla', false, e.message);
  }

  // 5 y 6. Formulario de correo
  contexto = 'robustez formulario';
  try {
    await preparar(page, base, { prueba: CFG_FIJA });
    await entrarAPrueba(page, materia);
    await recorrer(page, SEL_PRUEBA, materia, estrategiaPatronCanonica(COMBO_CAPTURA));
    await esperarPantalla(page, 's-diagnostico', 'E3 para el formulario');
    await clic(page, '#s-diagnostico [data-ir="monitores"]', 'boton Ver monitores');
    await esperarPantalla(page, 's-monitores', 'E4');
    await clic(page, '#lista-monitores [data-ir="perfil"], #s-monitores [data-ir="perfil"]', 'tarjeta de monitor');
    await esperarPantalla(page, 's-perfil', 'E5');
    const hayHorario = await page.locator('#s-perfil .slot').count().catch(() => 0);
    if (hayHorario) await page.locator('#s-perfil .slot').first().click().catch(() => {});
    await clic(page, '#s-perfil [data-ir="confirmacion"]', 'boton Agendar y pagar');
    await esperarPantalla(page, 's-confirmacion', 'E6');

    const form = page.locator('#s-confirmacion form.captura').first();
    await form.waitFor({ state: 'visible', timeout: TIEMPO });

    // 6. Correo invalido: no debe mostrar el agradecimiento
    await form.locator('input[type="email"]').first().fill('correo-invalido');
    await form.locator('button[type="submit"], button').first().click();
    await page.waitForTimeout(500);
    const graciasInvalido = await form.locator('.gracias').first().isVisible().catch(() => false);
    registrar(
      'un correo invalido no muestra el agradecimiento',
      graciasInvalido === false,
      graciasInvalido === false ? '' : '.gracias aparecio con el valor "correo-invalido"'
    );

    // 5. Correo valido en modo demo: agradecimiento y cero peticiones de red
    const antes = red.peticiones.length;
    await form.locator('input[type="email"]').first().fill('demo@uniandes.edu.co');
    await form.locator('button[type="submit"], button').first().click();
    await page.waitForTimeout(800);
    const graciasValido = await form.locator('.gracias').first().isVisible().catch(() => false);
    // Con credenciales reales, guardar el correo en Supabase es lo que debe
    // pasar: lo que este chequeo vigila es que no aparezca un tercero y que el
    // agradecimiento no dependa de la red.
    const nuevas = red.peticiones
      .slice(antes)
      .filter((p) => !esFuente(p.url))
      .filter((p) => !(CREDENCIALES_REALES && /(\.supabase\.co|cdn\.jsdelivr\.net)/.test(p.url)));
    const problemas = [];
    if (!graciasValido) problemas.push('no aparecio .gracias tras enviar un correo valido');
    if (nuevas.length) problemas.push('hizo ' + nuevas.length + ' peticion(es) de red: ' + nuevas.slice(0, 3).map((p) => p.url).join(', '));
    registrar(
      'el formulario en modo demo agradece y no llama a la red',
      problemas.length === 0,
      problemas.join(' | '),
      { peticiones: nuevas }
    );
  } catch (e) {
    registrar('formulario de captura de correo', false, e.message);
  }

  // 7. Materias inactivas: no dejan empezar la prueba
  contexto = 'robustez materia inactiva';
  try {
    await preparar(page, base, {});
    const materias = await leerMaterias(page);
    const inactiva = materias.find((m) => m.activa === false);
    if (!inactiva) {
      registrar(
        'las materias inactivas salen en gris con "pronto"',
        true,
        'no aplica: las ' + materias.length + ' materias de MATERIAS estan activas'
      );
    } else {
      const info = await page.evaluate(({ id, nombre }) => {
        function llano(s) {
          return String(s || '').replace(/\s+/g, ' ').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        }
        const c = document.querySelector('#lista-materias');
        if (!c) return { error: 'falta #lista-materias' };
        let nodos = Array.prototype.slice.call(c.querySelectorAll('[data-materia]'));
        if (!nodos.length) nodos = Array.prototype.slice.call(c.querySelectorAll('.materia, li'));
        const el = nodos.find((n) => n.getAttribute('data-materia') === id || llano(n.textContent).indexOf(llano(nombre)) !== -1);
        if (!el) return { error: 'la materia inactiva "' + nombre + '" no aparece en #lista-materias' };
        return {
          pronto: /pronto/i.test(el.textContent || ''),
          marcada: el.classList.contains('is-pronto') || !!el.querySelector('.is-pronto') || el.getAttribute('aria-disabled') === 'true',
        };
      }, { id: inactiva.id, nombre: inactiva.nombre });
      if (info.error) {
        registrar('las materias inactivas salen en gris con "pronto"', false, info.error);
      } else {
        registrar(
          'las materias inactivas salen en gris con "pronto"',
          info.pronto && info.marcada,
          info.pronto && info.marcada ? '' : 'la materia "' + inactiva.nombre + '" ' + (info.pronto ? 'dice pronto pero no esta marcada como no seleccionable' : 'no muestra la etiqueta "pronto"')
        );
      }
    }
  } catch (e) {
    registrar('las materias inactivas salen en gris con "pronto"', false, e.message);
  }
}

// ---------------------------------------------------------------------------
// 20. Contact sheet
// ---------------------------------------------------------------------------

function escribirContactSheet() {
  const porCarpeta = {};
  reporte.capturas.forEach((c) => {
    const k = c.carpeta || 'otros';
    porCarpeta[k] = porCarpeta[k] || [];
    porCarpeta[k].push(c);
  });

  const secciones = Object.keys(porCarpeta).sort().map((k) => {
    const filas = porCarpeta[k]
      .slice()
      .sort((a, b) => a.archivo.localeCompare(b.archivo))
      .map(
        (c) =>
          '  <figure>\n    <img src="' + c.archivo + '" alt="' + c.etiqueta.replace(/"/g, '&quot;') + '" loading="lazy">\n' +
          '    <figcaption><b>' + c.archivo + '</b><br>' + c.etiqueta + '</figcaption>\n  </figure>'
      )
      .join('\n');
    return '<h2>' + k + ' · ' + porCarpeta[k].length + ' capturas</h2>\n<div class="rejilla">\n' + filas + '\n</div>';
  }).join('\n');

  const html =
    '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>Calibra · hoja de contacto (v2)</title>\n<style>\n' +
    'body{margin:0;padding:24px;background:#101418;color:#E8EDF3;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}\n' +
    'h1{font-size:22px;margin:0 0 4px}\n' +
    'h2{font-size:17px;margin:28px 0 12px;color:#9AA7B6;text-transform:capitalize}\n' +
    'p.meta{margin:0 0 24px;color:#9AA7B6}\n' +
    '.rejilla{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px}\n' +
    'figure{margin:0;background:#181E25;border:1px solid #2A333D;border-radius:12px;overflow:hidden}\n' +
    'img{display:block;width:100%;height:auto;background:#FFFDF5}\n' +
    'figcaption{padding:10px 12px;font-size:14px;color:#C3CEDA}\n' +
    'figcaption b{color:#FFFFFF;font-weight:600}\n' +
    '.resumen{margin:0 0 24px;padding:12px 16px;border-radius:12px;border:1px solid #2A333D;background:#181E25}\n' +
    '.ok{color:#7EE2A8}.falla{color:#FF9A9E}\n' +
    '</style>\n</head>\n<body>\n' +
    '<h1>Calibra · hoja de contacto (v2)</h1>\n' +
    '<p class="meta">Generada ' + new Date().toLocaleString('es-CO') + ' · viewport 390 × 844 · deviceScaleFactor 3</p>\n' +
    '<p class="resumen">Comprobaciones: ' + reporte.resumen.total +
    ' · <span class="ok">OK ' + reporte.resumen.ok + '</span>' +
    ' · <span class="falla">fallas ' + reporte.resumen.fallas + '</span>' +
    ' · detalle en <code>reporte.json</code></p>\n' +
    secciones + '\n</body>\n</html>\n';

  fs.writeFileSync(RUTA_SHEET, html, 'utf8');
}

// ---------------------------------------------------------------------------
// 21. Programa principal
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Bloque: Supabase simulado (Parte 3)
// ---------------------------------------------------------------------------
// No necesita un proyecto real: intercepta la API REST de Supabase con
// page.route y sirve datos de prueba. Comprueba que el frontend lea el
// contenido de la base, que los tres flujos inserten en su tabla con columnas
// que existen, y que si Supabase o el CDN fallan la app siga funcionando con
// los datos del archivo. Requiere internet para descargar supabase-js del CDN.

const SB_URL = 'https://calibra-prueba.supabase.co';
const SB_KEY = 'clave-anon-de-prueba';
const SB_CDN = 'cdn.jsdelivr.net';

// Columnas que acepta cada tabla con insert publico, segun supabase/schema.sql
// (rama main). Una columna de mas hace que PostgREST rechace el insert.
const COLUMNAS_SUPABASE = {
  leads: ['correo', 'rol', 'materia_interes', 'telefono', 'monitor_id', 'sesion_id'],
  monitores: ['nombre', 'carrera', 'semestre', 'nivel', 'calificacion', 'precio_hora', 'materia_certificada_id', 'encaje_texto', 'clave'],
  resultados_diagnostico: ['materia_id', 'subtema_debil_id', 'error_detectado_texto', 'respuestas', 'kcs', 'sesion_id'],
};

function datosSupabasePrueba() {
  const opcionesDe = (p) => ['A', 'B', 'C', 'D'].map((letra, i) => ({
    id: p.id * 10 + i,
    pregunta_id: p.id,
    letra: letra,
    texto: '[BD] opcion ' + letra + ' de la pregunta ' + p.numero,
    es_correcta: i === 0,
    error_texto: i === 0 ? null : '[BD] error ' + letra + ' de la pregunta ' + p.numero,
  }));
  const preguntas = [
    { id: 401, subtema_id: 201, numero: 1, dificultad: '2', enunciado: '[BD] Pregunta 1 de integracion por partes' },
    { id: 402, subtema_id: 202, numero: 2, dificultad: '2', enunciado: '[BD] Pregunta 2 de sustitucion' },
    { id: 403, subtema_id: 201, numero: 3, dificultad: '3', enunciado: '[BD] Pregunta 3 de integracion por partes' },
    { id: 404, subtema_id: 202, numero: 4, dificultad: '1', enunciado: '[BD] Pregunta 4 de sustitucion' },
  ];
  return {
    materias: [
      { id: 101, nombre: 'Cálculo Integral desde Supabase', codigo: 'MATE-1214', activa: true },
      { id: 102, nombre: 'Materia inactiva de la base', codigo: 'BD-0001', activa: false },
    ],
    subtemas: [
      { id: 201, materia_id: 101, clave: 'partes', nombre: 'Integración por partes' },
      { id: 202, materia_id: 101, clave: 'sustitucion', nombre: 'Sustitución' },
    ],
    preguntas: preguntas,
    opciones: preguntas.reduce((acc, p) => acc.concat(opcionesDe(p)), []),
    monitores: [
      { id: 301, nombre: 'Monitora Supabase', carrera: 'Matemáticas', semestre: '6', nivel: 2, calificacion: 4.7,
        precio_hora: 26000, materia_certificada_id: 101, encaje_texto: 'Viene de la base de datos', creado_en: '2026-09-16T12:00:00Z' },
    ],
  };
}

async function abrirPaginaSupabase(navegador, base, opciones) {
  const o = opciones || {};
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-CO', timezoneId: 'America/Bogota' });
  const page = await ctx.newPage();
  page.setDefaultTimeout(TIEMPO);
  const registro = { lecturas: [], escrituras: [], errores: [], alSupabase: 0, alCdn: 0, apikeys: [] };

  page.on('pageerror', (e) => registro.errores.push('pageerror: ' + (e && e.message ? e.message : e)));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    // Con la red caida a proposito, el navegador reporta el recurso fallido.
    // Eso no es un error de la app; los errores de la app si se cuentan.
    if (/Failed to load resource|net::ERR_/.test(t)) return;
    registro.errores.push('console.error: ' + t);
  });
  page.on('request', (req) => {
    const u = req.url();
    if (u.indexOf(SB_URL) === 0) registro.alSupabase += 1;
    if (u.indexOf(SB_CDN) !== -1) registro.alCdn += 1;
  });

  if (!o.sinConfig) {
    await page.addInitScript((cfg) => { window.__calibraSupabase = cfg; }, { url: SB_URL, anonKey: SB_KEY });
  }
  if (o.sinConfig && CREDENCIALES_REALES) {
    // Este recorrido comprueba el modo demo, y el archivo ya tiene credenciales
    // reales pegadas. Se sirve una copia con las dos constantes vacias; el
    // archivo del repo no se toca.
    const sinLlaves = fs.readFileSync(INDEX, 'utf8')
      .replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
      .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
    await page.route(base, (route) => route.fulfill({
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      body: sinLlaves,
    }));
  }
  if (o.sinCdn) {
    await page.route('**/' + SB_CDN + '/**', (route) => route.abort('failed'));
  }

  const datos = datosSupabasePrueba();
  await page.route(SB_URL + '/**', async (route) => {
    const req = route.request();
    if (o.caido) return route.abort('failed');
    const cors = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
    };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const u = new URL(req.url());
    const tabla = u.pathname.replace(/^\/rest\/v1\//, '').split('/')[0];
    registro.apikeys.push(req.headers()['apikey'] || '');
    if (o.retrasoMs) await new Promise((r) => setTimeout(r, o.retrasoMs));
    if (req.method() === 'GET') {
      registro.lecturas.push(tabla);
      return route.fulfill({
        status: 200,
        headers: Object.assign({ 'content-type': 'application/json; charset=utf-8' }, cors),
        body: JSON.stringify(datos[tabla] || []),
      });
    }
    let cuerpo = null;
    try { cuerpo = JSON.parse(req.postData() || 'null'); } catch (e) { cuerpo = req.postData(); }
    registro.escrituras.push({ tabla: tabla, metodo: req.method(), cuerpo: cuerpo, query: u.search, prefer: req.headers()['prefer'] || '' });
    return route.fulfill({ status: 201, headers: cors, body: '' });
  });

  await page.goto(base, { waitUntil: 'domcontentloaded' });
  return { ctx: ctx, page: page, registro: registro };
}

async function esperarEstadoSupabase(page) {
  await page.waitForFunction(
    () => typeof window.__calibraSupabaseEstado === 'string' && window.__calibraSupabaseEstado !== 'cargando',
    null,
    { timeout: 15000 }
  ).catch(() => {});
  return page.evaluate(() => window.__calibraSupabaseEstado);
}

async function esperarEscritura(registro, tabla, ms) {
  const fin = Date.now() + (ms || 5000);
  while (Date.now() < fin) {
    const w = registro.escrituras.find((e) => e.tabla === tabla && !e.vista);
    if (w) { w.vista = true; return w; }
    await new Promise((r) => setTimeout(r, 100));
  }
  return null;
}

async function bloqueSupabase(navegador, base) {
  abrirBloque('Supabase simulado · Parte 3');

  // ---- 1. Conectado: lee de la base y escribe en las tres tablas ----
  let s = null;
  try {
    contexto = 'supabase conectado';
    s = await abrirPaginaSupabase(navegador, base, { retrasoMs: 700 });
    const page = s.page;
    const registro = s.registro;

    const cargando = await page.locator('#cargando').first().isVisible().catch(() => false);
    registrar('carga · pantalla de carga visible mientras responde Supabase', cargando,
      cargando ? '' : '#cargando no estaba visible al arrancar con Supabase configurado');

    const estado = await esperarEstadoSupabase(page);
    registrar('carga · queda en estado "conectado"', estado === 'conectado', 'estado: ' + estado);
    await esperarPantalla(page, 's-inicio', 'E1 tras cargar de Supabase');
    const oculto = !(await page.locator('#cargando').first().isVisible().catch(() => false));
    registrar('carga · la pantalla de carga se oculta al terminar', oculto, oculto ? '' : '#cargando sigue visible');

    const tablas = ['materias', 'subtemas', 'preguntas', 'opciones', 'monitores'];
    const sinLeer = tablas.filter((t) => registro.lecturas.indexOf(t) === -1);
    registrar('lectura · consulta las cuatro tablas de contenido y monitores', sinLeer.length === 0,
      sinLeer.length ? 'no se leyo: ' + sinLeer.join(', ') : '');

    const materias = await leerMaterias(page);
    const ci = materias.find((m) => m.codigo === 'MATE-1214');
    const okMaterias = materias.length === 2 && !!ci && ci.id === MATERIA_DEMO
      && ci.nombre === 'Cálculo Integral desde Supabase'
      && ci.preguntas.length === 4 && /^\[BD\]/.test(ci.preguntas[0].enunciado)
      && ci.preguntas.every((p) => p.opciones.length === 4 && p.opciones.filter((x) => x.correcta).length === 1);
    registrar('lectura · las materias de la base reemplazan a las del archivo', okMaterias,
      okMaterias ? '' : 'materias: ' + materias.map((m) => m.codigo + ' ' + m.id + ' (' + (m.preguntas || []).length + ')').join(', '));
    if (!ci) throw new Error('no llego la materia MATE-1214 desde Supabase; no se puede seguir el recorrido');

    const inactiva = materias.find((m) => m.codigo === 'BD-0001');
    registrar('lectura · una materia inactiva en la base sale inactiva', !!inactiva && inactiva.activa === false,
      inactiva ? 'activa=' + inactiva.activa : 'no llego BD-0001');
    const ids = ci.preguntas.map((p) => p.id).join(',');
    registrar('lectura · cada pregunta se identifica como p + numero', ids === 'p1,p2,p3,p4', ids);
    const correctasLimpias = ci.preguntas.every((p) => p.opciones.every((x) => !x.correcta || x.error === undefined));
    registrar('lectura · la opcion correcta no lleva campo error', correctasLimpias, '');
    const configHeredada = ci.prueba && ci.certificacion && ci.certificacion.minimoAciertos === 2;
    registrar('lectura · conserva la configuracion de la prueba del archivo para la misma materia', !!configHeredada,
      JSON.stringify({ prueba: ci.prueba, certificacion: ci.certificacion }));

    await page.evaluate(() => { location.hash = '#buscar'; });
    await esperarPantalla(page, 's-buscar', 'B1 con Supabase');
    const textoBuscar = normalizarEspacios(await page.locator('#buscar-lista').first().textContent());
    const okMon = textoBuscar.indexOf('Monitora Supabase') !== -1 && textoBuscar.indexOf('Daniela R.') !== -1;
    registrar('lectura · #buscar muestra el monitor de la base junto a los de ejemplo', okMon,
      okMon ? '' : 'texto: ' + textoBuscar.slice(0, 140));

    // Prueba del estudiante -> resultados_diagnostico
    contexto = 'supabase prueba';
    await page.evaluate(() => { location.hash = '#inicio'; });
    await esperarPantalla(page, 's-inicio', 'E1');
    await entrarAPrueba(page, ci);
    await recorrer(page, SEL_PRUEBA, ci, ({ mapa }) => mapa.findIndex((m) => !m.datos.correcta));
    await esperarPantalla(page, 's-diagnostico', 'E3 con Supabase');
    const diag = await esperarEscritura(registro, 'resultados_diagnostico');
    const cd = diag && diag.cuerpo;
    const okDiag = !!cd && cd.materia_id === 101 && cd.subtema_debil_id === 201
      && typeof cd.error_detectado_texto === 'string' && /^\[BD\] error/.test(cd.error_detectado_texto)
      && !!cd.respuestas && typeof cd.respuestas === 'object';
    registrar('escritura · al terminar la prueba inserta en resultados_diagnostico', okDiag,
      okDiag ? '' : 'recibido: ' + JSON.stringify(cd).slice(0, 220));
    const sinLectura = !!diag && diag.query.indexOf('select=') === -1 && diag.prefer.indexOf('return=representation') === -1;
    registrar('escritura · el insert no pide devolver la fila (RLS no deja leer esa tabla)', sinLectura,
      diag ? 'query="' + diag.query + '" prefer="' + diag.prefer + '"' : 'no hubo insert');

    // E6 -> leads (estudiante)
    contexto = 'supabase E6';
    await clic(page, '#s-diagnostico [data-ir="monitores"]', 'Ver monitores (E3)');
    await esperarPantalla(page, 's-monitores', 'E4');
    await clic(page, '#lista-monitores [data-ir="perfil"]', 'tarjeta de monitor (E4)');
    await esperarPantalla(page, 's-perfil', 'E5');
    if (await page.locator('#s-perfil .slot').count()) await page.locator('#s-perfil .slot').first().click();
    await clic(page, '#s-perfil [data-ir="confirmacion"]', 'Agendar (E5)');
    await esperarPantalla(page, 's-confirmacion', 'E6');
    await enviarCorreo(page, '#s-confirmacion form.captura', 'estudiante.bd@uniandes.edu.co');
    const leadE = await esperarEscritura(registro, 'leads');
    const ce = leadE && leadE.cuerpo;
    const okLeadE = !!ce && ce.correo === 'estudiante.bd@uniandes.edu.co' && ce.rol === 'estudiante' && ce.materia_interes === 'MATE-1214';
    registrar('escritura · el correo de E6 inserta en leads con rol estudiante', okLeadE,
      okLeadE ? '' : 'recibido: ' + JSON.stringify(ce));

    // P1: el esquema solo admite estudiante y monitor
    contexto = 'supabase P1';
    await page.evaluate(() => { location.hash = '#profesor'; });
    await esperarPantalla(page, 's-profesor', 'P1');
    const antesProfe = registro.escrituras.length;
    await enviarCorreo(page, '#s-profesor form.captura', 'profe.bd@uniandes.edu.co');
    await page.waitForTimeout(1200);
    const graciasProfe = await page.locator('#s-profesor .gracias').first().isVisible().catch(() => false);
    const insertsProfe = registro.escrituras.slice(antesProfe).filter((e) => e.tabla === 'leads').length;
    registrar('escritura · el canal profesor no inserta (leads.rol no admite "profesor") y agradece igual',
      graciasProfe && insertsProfe === 0, 'gracias=' + graciasProfe + ' inserts=' + insertsProfe);

    // Monitor: M2.5 -> leads (monitor); certificacion -> crear perfil -> monitores
    contexto = 'supabase monitor';
    await page.evaluate(() => { location.hash = '#monitor'; });
    await esperarPantalla(page, 's-monitor', 'M1');
    await clic(page, '#s-monitor [data-ir="monitor-materia"]', 'M1 hacia M2');
    await esperarPantalla(page, 's-monitor-materia', 'M2');
    await elegirMateria(page, '#s-monitor-materia .materias, #s-monitor-materia ul, #s-monitor-materia', ci);
    await clic(page, '#s-monitor-materia [data-ir="monitor-correo"]', 'M2 hacia M2.5');
    await esperarPantalla(page, 's-monitor-correo', 'M2.5');
    await page.locator('#correo-monitor-pre').first().fill('monitor.bd@uniandes.edu.co');
    await page.locator('#s-monitor-correo button[type="submit"]').first().click();
    await esperarPantalla(page, 's-monitor-correo', 'M2.5 tras enviar (queda a la espera de contacto)');
    await page.evaluate(() => { location.hash = '#certificacion'; });
    await esperarPantalla(page, 's-certificacion', 'M3 (salto forzado por el arnes)');
    const leadM = await esperarEscritura(registro, 'leads');
    const cmL = leadM && leadM.cuerpo;
    const okLeadM = !!cmL && cmL.rol === 'monitor' && cmL.correo === 'monitor.bd@uniandes.edu.co';
    registrar('escritura · el correo de M2.5 inserta en leads con rol monitor', okLeadM,
      okLeadM ? '' : 'recibido: ' + JSON.stringify(cmL));

    await recorrer(page, SEL_CERT, ci, ({ mapa }) => mapa.findIndex((m) => !!m.datos.correcta));
    await esperarPantalla(page, 's-monitor-resultado', 'M4');
    await clic(page, '#s-monitor-resultado [data-ir="crear-perfil"]', 'M4 hacia R1');
    await esperarPantalla(page, 's-crear-perfil', 'R1');
    const campos = await camposCrearPerfil(page);
    await page.locator('#perfil-carrera').first().fill('Ingeniería de Sistemas').catch(() => {});
    await rellenarPerfil(page, campos, { nombre: 'Mariana BD', semestre: '7', tarifa: '30000', subtemas: 1 });
    await page.locator(campos.enviar).first().click();
    await esperarPantalla(page, 's-panel', 'M5');
    const mon = await esperarEscritura(registro, 'monitores');
    const cm = mon && mon.cuerpo;
    const okMonIns = !!cm && cm.nombre === 'Mariana BD' && cm.carrera === 'Ingeniería de Sistemas'
      && String(cm.semestre) === '7' && cm.precio_hora === 30000 && cm.materia_certificada_id === 101;
    registrar('escritura · publicar el perfil inserta en monitores', okMonIns,
      okMonIns ? '' : 'recibido: ' + JSON.stringify(cm));

    const extras = [];
    registro.escrituras.forEach((e) => {
      const permitidas = COLUMNAS_SUPABASE[e.tabla];
      if (!permitidas) { extras.push(e.tabla + ' (sin insert publico)'); return; }
      if (Array.isArray(e.cuerpo) || !e.cuerpo || typeof e.cuerpo !== 'object') { extras.push(e.tabla + ' (cuerpo no es un objeto)'); return; }
      Object.keys(e.cuerpo).forEach((k) => { if (permitidas.indexOf(k) === -1) extras.push(e.tabla + '.' + k); });
    });
    registrar('escritura · solo envia columnas que existen en supabase/schema.sql', extras.length === 0,
      extras.join(', '));

    const sinClave = s.registro.apikeys.filter((k) => k !== SB_KEY).length;
    registrar('peticiones · todas llevan la anon key', s.registro.apikeys.length > 0 && sinClave === 0,
      s.registro.apikeys.length + ' peticiones, ' + sinClave + ' sin la clave');

    const ls = await page.evaluate(() => { try { return window.localStorage.length; } catch (e) { return -1; } });
    registrar('almacenamiento · supabase-js no deja nada en localStorage', ls === 0, 'localStorage.length=' + ls);
    registrar('consola · sin errores de JavaScript con Supabase conectado', registro.errores.length === 0,
      registro.errores.slice(0, 3).join(' | '));
  } catch (e) {
    registrar('supabase · recorrido conectado', false, e.message);
  } finally {
    if (s) await s.ctx.close().catch(() => {});
  }

  // ---- 2. Supabase caido: la demo sigue con los datos del archivo ----
  let c = null;
  try {
    contexto = 'supabase caido';
    c = await abrirPaginaSupabase(navegador, base, { caido: true });
    const page = c.page;
    const estado = await esperarEstadoSupabase(page);
    await esperarPantalla(page, 's-inicio', 'E1 con Supabase caido');
    const mats = await leerMaterias(page);
    const conArchivo = mats.some((m) => m.id === MATERIA_DEMO && (m.preguntas || []).length >= PREGUNTAS_POR_MATERIA);
    registrar('degradado · Supabase caido: arranca con los datos del archivo', estado === 'sin-conexion' && conArchivo,
      'estado=' + estado + ' materias=' + mats.length);
    const oculto = !(await page.locator('#cargando').first().isVisible().catch(() => false));
    registrar('degradado · Supabase caido: la pantalla de carga no se queda pegada', oculto, '');

    await page.evaluate(() => { location.hash = '#monitor'; });
    await esperarPantalla(page, 's-monitor', 'M1');
    await clic(page, '#s-monitor [data-ir="monitor-materia"]', 'M1 hacia M2');
    await esperarPantalla(page, 's-monitor-materia', 'M2');
    await clic(page, '#s-monitor-materia [data-ir="monitor-correo"]', 'M2 hacia M2.5');
    await esperarPantalla(page, 's-monitor-correo', 'M2.5');
    await page.locator('#correo-monitor-pre').first().fill('caido@uniandes.edu.co');
    await page.locator('#s-monitor-correo button[type="submit"]').first().click();
    await esperarPantalla(page, 's-monitor-correo', 'M2.5 tras enviar con Supabase caido');
    await page.evaluate(() => { location.hash = '#certificacion'; });
    await esperarPantalla(page, 's-certificacion', 'M3 con Supabase caido (salto forzado por el arnes)');
    await page.waitForTimeout(800);
    registrar('degradado · Supabase caido: guardar un correo no bloquea el flujo', true, '');
    registrar('degradado · Supabase caido: sin errores de JavaScript', c.registro.errores.length === 0,
      c.registro.errores.slice(0, 3).join(' | '));
  } catch (e) {
    registrar('degradado · Supabase caido', false, e.message);
  } finally {
    if (c) await c.ctx.close().catch(() => {});
  }

  // ---- 3. CDN bloqueado: sin cliente, la demo sigue igual ----
  let b = null;
  try {
    contexto = 'supabase sin CDN';
    b = await abrirPaginaSupabase(navegador, base, { sinCdn: true });
    const page = b.page;
    const estado = await esperarEstadoSupabase(page);
    await esperarPantalla(page, 's-inicio', 'E1 sin CDN');
    const mats = await leerMaterias(page);
    const conArchivo = mats.some((m) => m.id === MATERIA_DEMO && (m.preguntas || []).length >= PREGUNTAS_POR_MATERIA);
    registrar('degradado · CDN bloqueado: arranca con los datos del archivo', estado === 'sin-conexion' && conArchivo,
      'estado=' + estado + ' materias=' + mats.length);
    registrar('degradado · CDN bloqueado: sin errores de JavaScript', b.registro.errores.length === 0,
      b.registro.errores.slice(0, 3).join(' | '));
  } catch (e) {
    registrar('degradado · CDN bloqueado', false, e.message);
  } finally {
    if (b) await b.ctx.close().catch(() => {});
  }

  // ---- 4. Sin configuracion: modo demo, cero red ----
  let d = null;
  try {
    contexto = 'supabase sin configurar';
    d = await abrirPaginaSupabase(navegador, base, { sinConfig: true });
    const page = d.page;
    await esperarPantalla(page, 's-inicio', 'E1 sin configuracion');
    const cargandoDemo = await page.locator('#cargando').first().isVisible().catch(() => false);
    await page.evaluate(() => { location.hash = '#profesor'; });
    await esperarPantalla(page, 's-profesor', 'P1');
    await enviarCorreo(page, '#s-profesor form.captura', 'demo@uniandes.edu.co');
    await page.waitForTimeout(1000);
    const estado = await page.evaluate(() => window.__calibraSupabaseEstado);
    const ok = estado === 'demo' && !cargandoDemo && d.registro.alSupabase === 0 && d.registro.alCdn === 0;
    registrar('demo · sin credenciales no muestra carga ni llama a Supabase ni al CDN', ok,
      'estado=' + estado + ' cargando=' + cargandoDemo + ' supabase=' + d.registro.alSupabase + ' cdn=' + d.registro.alCdn);
  } catch (e) {
    registrar('demo · sin credenciales', false, e.message);
  } finally {
    if (d) await d.ctx.close().catch(() => {});
  }
}

const ALIAS_BLOQUE = { logica: 'oraculo', oraculo: 'oraculo', 'crear-perfil': 'perfil', buscar: 'buscar' };

function quiere(bloque) {
  if (!SOLO) return true;
  return SOLO.some((s) => s === bloque || ALIAS_BLOQUE[s] === bloque);
}

async function main() {
  linea('Calibra · arnes de verificacion (v2)');
  linea('Proyecto: ' + RAIZ);

  if (!fs.existsSync(INDEX)) {
    linea('');
    linea('FALLA: no existe ' + INDEX);
    linea('El arnes verifica el prototipo de una sola pagina; cree index.html en la raiz del proyecto y vuelva a ejecutarlo.');
    process.exit(1);
  }

  let playwright;
  try {
    playwright = require('playwright');
  } catch (e) {
    linea('');
    linea('FALLA: no pude cargar playwright.');
    linea('Ejecute este arnes con verificar.cmd, que define NODE_PATH=C:\\Users\\jdcha\\AppData\\Roaming\\npm\\node_modules');
    linea('Detalle: ' + e.message);
    process.exit(1);
  }

  fs.mkdirSync(DIR_EST, { recursive: true });
  fs.mkdirSync(DIR_MON, { recursive: true });

  let servidor = null;
  let navegador = null;
  const red = { peticiones: [], fallidas: [] };

  try {
    const s = await crearServidor(RAIZ);
    servidor = s.servidor;
    const base = 'http://127.0.0.1:' + s.puerto + '/index.html';
    reporte.base = base;
    linea('Servidor local: ' + base);

    try {
      navegador = await playwright.chromium.launch({ headless: !HEADED });
    } catch (e) {
      linea('');
      linea('FALLA: no pude lanzar Chromium. Solo hay Chromium descargado en este equipo.');
      linea('Detalle: ' + e.message);
      process.exit(1);
    }

    const contextoNav = await navegador.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      locale: 'es-CO',
      timezoneId: 'America/Bogota',
    });
    const page = await contextoNav.newPage();
    page.setDefaultTimeout(TIEMPO);

    // Si index.html ya tiene credenciales reales de Supabase, este recorrido no
    // debe llenar la base de produccion con correos, perfiles y diagnosticos de
    // prueba. Las lecturas llegan a Supabase; las escrituras se responden aqui.
    let escriturasRetenidas = 0;
    await contextoNav.route(/\.supabase\.co\/rest\/v1\//, (route) => {
      const metodo = route.request().method();
      if (metodo === 'GET' || metodo === 'HEAD') return route.continue();
      const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
      if (metodo === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      escriturasRetenidas += 1;
      return route.fulfill({ status: 201, headers: cors, body: '' });
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        reporte.consola.push({ pantalla: contexto, tipo: 'console.error', texto: msg.text() });
      }
    });
    page.on('pageerror', (err) => {
      reporte.consola.push({ pantalla: contexto, tipo: 'pageerror', texto: String(err && err.message ? err.message : err) });
    });
    page.on('request', (req) => {
      red.peticiones.push({ url: req.url(), metodo: req.method() });
    });
    page.on('requestfailed', (req) => {
      const u = req.url();
      if (esFuente(u)) return;
      red.fallidas.push({ pantalla: contexto, url: u, motivo: (req.failure() && req.failure().errorText) || 'desconocido' });
    });
    page.on('response', (res) => {
      const u = res.url();
      if (esFuente(u)) return;
      if (res.status() >= 400) {
        red.fallidas.push({ pantalla: contexto, url: u, motivo: 'HTTP ' + res.status() });
      }
    });

    if (quiere('fuente')) {
      await bloqueFuente();
    }

    // ---- Ganchos de datos: sin esto no corre ningun bloque de navegador ----
    abrirBloque('Ganchos de datos');
    let materias = null;
    let materia = null;
    try {
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      materias = await leerMaterias(page);
      registrar('window.MATERIAS es legible', true, materias.length + ' materia(s): ' + materias.map((m) => m.id).join(', '));
      materia = buscarMateria(materias, MATERIA_DEMO);
      registrar('existe la materia "' + MATERIA_DEMO + '"', true, materia.codigo + ' · ' + materia.nombre);

      const problemas = [];
      if (!materia.subtemas || !Object.keys(materia.subtemas).length) problemas.push('no tiene subtemas');
      if (!Array.isArray(materia.preguntas) || !materia.preguntas.length) problemas.push('no tiene preguntas');
      if (!materia.prueba || typeof materia.prueba.longitud !== 'number') problemas.push('no tiene prueba.longitud');
      if (!materia.certificacion || typeof materia.certificacion.longitud !== 'number') problemas.push('no tiene certificacion.longitud');
      (materia.preguntas || []).forEach((p) => {
        if (!p.id) problemas.push('una pregunta sin id');
        if (!materia.subtemas[p.subtema]) problemas.push(p.id + ' apunta al subtema inexistente "' + p.subtema + '"');
        const correctas = (p.opciones || []).filter((o) => o.correcta).length;
        if (correctas !== 1) problemas.push(p.id + ' tiene ' + correctas + ' opciones correctas (debe ser 1)');
        (p.opciones || []).forEach((o) => {
          if (!o.correcta && !o.error) problemas.push(p.id + ' opcion "' + String(o.texto).slice(0, 24) + '" incorrecta sin texto de error');
          if (o.correcta && o.error) problemas.push(p.id + ' la opcion correcta no debe llevar campo error');
        });
      });
      registrar(
        'estructura de datos v2 de ' + MATERIA_DEMO,
        problemas.length === 0,
        problemas.slice(0, 5).join(' | ')
      );

      // Una materia con knowledge components (kcs) usa un banco mayor a 12 para
      // poder sondear y confirmar sospechas; la prueba sigue mostrando 12. Las
      // materias sin kc mantienen banco == prueba == 12.
      const tieneKc = !!(materia.kcs && Object.keys(materia.kcs).length);
      const bancoOk = tieneKc
        ? materia.preguntas.length >= PREGUNTAS_POR_MATERIA
        : materia.preguntas.length === PREGUNTAS_POR_MATERIA;
      const cfgOk = bancoOk
        && materia.prueba.longitud === PREGUNTAS_POR_MATERIA
        && materia.certificacion.longitud === 3 && materia.certificacion.minimoAciertos === 2;
      registrar(
        'configuracion de ' + MATERIA_DEMO + ' (' + PREGUNTAS_POR_MATERIA + ' preguntas, prueba de ' + PREGUNTAS_POR_MATERIA + ', certificacion 3 con minimo 2)',
        cfgOk,
        cfgOk ? '' : 'preguntas=' + materia.preguntas.length + ' prueba.longitud=' + materia.prueba.longitud + ' certificacion.longitud=' + materia.certificacion.longitud + ' minimoAciertos=' + materia.certificacion.minimoAciertos
      );

      const activas = materias.filter((m) => m.activa);
      // El banco debe ser exactamente 12, salvo en materias con knowledge
      // components, donde puede ser mayor (la prueba mostrada sigue en 12).
      const sinBanco = activas.filter((m) => {
        var n = (m.preguntas || []).length;
        var conKc = !!(m.kcs && Object.keys(m.kcs).length);
        return conKc ? n < PREGUNTAS_POR_MATERIA : n !== PREGUNTAS_POR_MATERIA;
      });
      registrar(
        'cada materia activa tiene ' + PREGUNTAS_POR_MATERIA + ' preguntas (' + activas.length + ' activas)',
        sinBanco.length === 0,
        sinBanco.map((m) => m.id + '=' + (m.preguntas || []).length).join(', ')
      );
      // La longitud de la prueba es decision de contenido (contenido/*.md): se
      // avisa si no coincide, sin bloquear.
      const longitudDistinta = activas.filter((m) => m.prueba && m.prueba.longitud !== PREGUNTAS_POR_MATERIA);
      if (longitudDistinta.length) {
        console.log('  AVISO prueba con longitud distinta de ' + PREGUNTAS_POR_MATERIA + ': ' +
          longitudDistinta.map((m) => m.id + '=' + m.prueba.longitud).join(', ') + ' (revisar el frontmatter en contenido/)');
      }

      const forzado = await forzarConfig(page, MATERIA_DEMO, CFG_FIJA, CFG_FIJA);
      registrar(
        'el arnes puede forzar { adaptativa:false, barajarOpciones:false }',
        forzado.prueba.adaptativa === false && forzado.prueba.barajarOpciones === false,
        JSON.stringify(forzado.prueba)
      );
    } catch (e) {
      registrar('ganchos de datos', false, e.message);
    }

    if (materia) {
      if (quiere('capturas')) {
        try {
          await bloqueCapturas(page, base, materia);
        } catch (e) {
          registrar('recorrido de capturas', false, e.message);
        }
      }

      if (quiere('oraculo')) {
        try {
          await bloqueOraculo(page, base, materia);
        } catch (e) {
          registrar('regresion del oraculo', false, e.message);
        }
      }

      if (quiere('monitor')) {
        try {
          await bloqueLogicaMonitor(page, base, materia);
        } catch (e) {
          registrar('logica de certificacion', false, e.message);
        }
      }

      if (quiere('adaptativo')) {
        try {
          await bloqueAdaptativo(page, base, materia);
        } catch (e) {
          registrar('invariantes del adaptativo', false, e.message);
        }
      }

      if (quiere('kc')) {
        try {
          await bloqueKc(page, base, materia, materias);
        } catch (e) {
          registrar('knowledge components', false, e.message);
        }
      }

      if (quiere('barajado')) {
        try {
          await bloqueBarajado(page, base, materia);
        } catch (e) {
          registrar('barajado correcto', false, e.message);
        }
      }

      if (quiere('buscar')) {
        try {
          await bloqueBuscar(page, base, materia);
        } catch (e) {
          registrar('buscar monitores', false, e.message);
        }
      }

      if (quiere('perfil')) {
        try {
          await bloquePerfilMonitor(page, base, materia);
        } catch (e) {
          registrar('crear perfil del monitor', false, e.message);
        }
      }

      if (quiere('robustez')) {
        try {
          await bloqueRobustez(page, base, red, materia);
        } catch (e) {
          registrar('robustez', false, e.message);
        }
      }
    } else {
      registrar(
        'bloques de navegador',
        false,
        'no se ejecutaron: sin window.MATERIAS y sin la materia "' + MATERIA_DEMO + '" el arnes no puede responder las pruebas'
      );
    }

    if (quiere('supabase')) {
      try {
        await bloqueSupabase(navegador, base);
      } catch (e) {
        registrar('supabase', false, e.message);
      }
    }

    if (escriturasRetenidas) {
      linea('  AVISO ' + escriturasRetenidas + ' escritura(s) a Supabase retenidas por el arnes: no llegaron a la base real.');
    }

    // Bloque global: consola y red, ya con todo el recorrido hecho
    abrirBloque('Consola y red');
    registrar(
      'consola sin errores',
      reporte.consola.length === 0,
      reporte.consola.length === 0
        ? ''
        : reporte.consola.length + ' error(es): ' + reporte.consola.slice(0, 3).map((c) => '[' + c.pantalla + '] ' + c.texto.slice(0, 120)).join(' | '),
      reporte.consola
    );
    registrar(
      'red sin peticiones fallidas (fuera de Google Fonts)',
      red.fallidas.length === 0,
      red.fallidas.length === 0
        ? ''
        : red.fallidas.length + ' fallida(s): ' + red.fallidas.slice(0, 3).map((f) => f.url + ' (' + f.motivo + ')').join(' | '),
      red.fallidas
    );
    reporte.red = red.fallidas;

    await contextoNav.close();
  } catch (e) {
    registrar('ejecucion del arnes', false, 'error inesperado: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' / ') : e));
  } finally {
    if (navegador) await navegador.close().catch(() => {});
    if (servidor) await new Promise((r) => servidor.close(r));
  }

  // ---- Salida ----
  try {
    escribirContactSheet();
  } catch (e) {
    linea('Aviso: no pude escribir la hoja de contacto: ' + e.message);
  }
  try {
    fs.writeFileSync(RUTA_REPORTE, JSON.stringify(reporte, null, 2), 'utf8');
  } catch (e) {
    linea('Aviso: no pude escribir reporte.json: ' + e.message);
  }

  linea('');
  linea('== RESUMEN ==');
  linea('  Comprobaciones: ' + reporte.resumen.total);
  linea('  OK:             ' + reporte.resumen.ok);
  linea('  FALLAS:         ' + reporte.resumen.fallas);
  linea('  Capturas:       ' + reporte.capturas.length + ' en ' + DIR_CAPTURAS);
  linea('  Hoja de contacto: ' + RUTA_SHEET);
  linea('  Reporte:          ' + RUTA_REPORTE);

  if (reporte.supuestos.length) {
    linea('');
    linea('Selectores alternos usados (conviene alinearlos con el contrato):');
    reporte.supuestos.forEach((s) => linea('  - ' + s));
  }

  if (reporte.resumen.fallas > 0) {
    linea('');
    linea('Fallas por bloque:');
    reporte.bloques.forEach((b) => {
      const malas = b.comprobaciones.filter((c) => !c.ok);
      if (!malas.length) return;
      linea('  ' + b.nombre + ': ' + malas.length);
      malas.slice(0, 12).forEach((c) => linea('    - ' + c.nombre + (c.detalle ? ' -> ' + c.detalle : '')));
      if (malas.length > 12) linea('    - (' + (malas.length - 12) + ' mas en reporte.json)');
    });
  }

  process.exit(reporte.resumen.fallas > 0 ? 1 : 0);
}

main().catch((e) => {
  linea('');
  linea('FALLA no controlada del arnes: ' + (e && e.stack ? e.stack : e));
  process.exit(1);
});
